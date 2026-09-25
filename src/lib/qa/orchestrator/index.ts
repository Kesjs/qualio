import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../supabase/database.types'
import { DiscoveryEngine } from '../discovery'
import { CrawlerEngine } from '../crawler'
import { BrowserEngine } from '../browser'
import { QAConfigManager } from '../config'
import type {
  ScanResult, ScanStatus, CheckResult, Issue, IssueSeverity, PageResult,
} from '../types'

interface ScanOptions {
  siteId: string
  userId: string
  url: string
  previousScanId?: string
  config?: QAConfigManager
  consentConfirmedAt?: string | null
}

export class QAOrchestrator {
  private supabase: ReturnType<typeof createClient<Database>>
  private config: QAConfigManager
  private discovery: DiscoveryEngine
  private crawler: CrawlerEngine
  private browser: BrowserEngine

  constructor(supabaseUrl: string, supabaseKey: string, config?: QAConfigManager) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey)
    this.config = config ?? new QAConfigManager()
    this.discovery = new DiscoveryEngine()
    this.crawler = new CrawlerEngine(this.config)
    this.browser = new BrowserEngine(this.config)
  }

  /** Create scan record, return scanId immediately, then run in background */
  async createScan(options: Omit<ScanOptions, 'config'>): Promise<string> {
    const { data: scan, error } = await this.supabase
      .from('scans')
      .insert({
        site_id: options.siteId,
        user_id: options.userId,
        status: 'created' as ScanStatus,
        previous_scan_id: options.previousScanId ?? null,
        consent_confirmed_at: options.consentConfirmedAt
          ? new Date(options.consentConfirmedAt).toISOString()
          : null,
      })
      .select('id')
      .single()

    if (error || !scan) throw new Error(`Failed to create scan: ${error?.message}`)
    return scan.id
  }

  /** Full scan run — called by the GitHub Actions cron via /api/scan/run */
  async runScan(options: ScanOptions): Promise<ScanResult> {
    const { siteId, userId, url, previousScanId, consentConfirmedAt } = options

    // 1. Create scan record
    const scanId = await this.createScan({ siteId, userId, url, previousScanId, consentConfirmedAt })

    const result: ScanResult = {
      scanId, siteId, status: 'created',
      startedAt: new Date(), completedAt: null,
      pagesDiscovered: 0, checksTotal: 0, checksPassed: 0, checksWarning: 0, checksFailed: 0,
      criticalCount: 0, majorCount: 0, summary: '', error: null,
      issues: [], checks: [], pages: [], screenshots: [],
    }

    try {
      await this.initEngines()

      // Phase 1: Discovery
      await this.updateStatus(scanId, 'discovering')
      const discovery = await this.discovery.discover(url)
      await this.saveDiscoveredPages(scanId, discovery.internalLinks)

      // Phase 2: Crawl
      await this.updateStatus(scanId, 'crawling')
      const crawl = await this.crawler.crawl(url)
      const crawledPages = await this.saveCrawledPages(scanId, crawl.pages)
      result.pages = crawledPages
      result.pagesDiscovered = crawledPages.length

      // Phase 3: Browser testing
      await this.updateStatus(scanId, 'browser_testing')
      const allChecks: CheckResult[] = []

      for (const page of crawledPages.slice(0, this.config.getMaxPages())) {
        try {
          const nav = await this.browser.testNavigation(page.url)
          const forms = await this.browser.testForms(page.url)
          const cta = await this.browser.testCTA(page.url)
          ;[...nav, ...forms, ...cta].forEach(c =>
            allChecks.push({ ...c, id: crypto.randomUUID(), scanId, pageId: page.id ?? null })
          )
        } catch (e) { console.error(`Browser test error for ${page.url}:`, e) }
      }

      // Responsive test on homepage only
      const resp = await this.browser.testResponsive(url)
      resp.forEach(c =>
        allChecks.push({ ...c, id: crypto.randomUUID(), scanId, pageId: crawledPages[0]?.id ?? null })
      )

      await this.saveChecks(scanId, allChecks)
      result.checks = allChecks
      result.checksTotal = allChecks.length
      result.checksPassed = allChecks.filter(c => c.status === 'passed').length
      result.checksWarning = allChecks.filter(c => c.status === 'warning').length
      result.checksFailed = allChecks.filter(c => c.status === 'failed').length
      result.criticalCount = allChecks.filter(c => c.severity === 'critical').length
      result.majorCount = allChecks.filter(c => c.severity === 'major').length

      // Phase 4: Analyzing
      await this.updateStatus(scanId, 'analyzing')
      const issues = this.extractIssues(allChecks)
      await this.saveIssues(scanId, issues)
      result.issues = issues

      // Phase 5: Reporting
      await this.updateStatus(scanId, 'reporting')
      result.summary = this.generateSummary(result)

      // Phase 6: Complete
      await this.updateStatus(scanId, 'completed')
      result.status = 'completed'
      result.completedAt = new Date()
      await this.finalizeScan(scanId, result)
      await this.updateSiteLastScan(siteId, scanId)

      return result
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err)
      result.error = msg
      result.status = 'failed'
      await this.updateStatus(scanId, 'failed')
      await this.supabase.from('scans').update({ error: msg } as any).eq('id', scanId)
      throw err
    } finally {
      await this.cleanupEngines()
    }
  }

  async getScanStatus(scanId: string): Promise<ScanStatus | null> {
    const { data } = await this.supabase.from('scans').select('status').eq('id', scanId).single()
    return (data?.status as ScanStatus) ?? null
  }

  async getScanResult(scanId: string): Promise<ScanResult | null> {
    const { data: scan } = await this.supabase.from('scans').select('*').eq('id', scanId).single()
    if (!scan) return null
    const { data: pages } = await this.supabase.from('pages').select('*').eq('scan_id', scanId)
    const { data: issues } = await this.supabase.from('issues').select('*').eq('scan_id', scanId)
    const { data: checks } = await this.supabase.from('checks').select('*').eq('scan_id', scanId)
    return {
      scanId: scan.id, siteId: scan.site_id, status: scan.status as ScanStatus,
      startedAt: new Date(scan.started_at ?? scan.created_at ?? Date.now()),
      completedAt: scan.completed_at ? new Date(scan.completed_at) : null,
      pagesDiscovered: scan.pages_discovered ?? 0,
      checksTotal: scan.checks_total ?? 0, checksPassed: scan.checks_passed ?? 0,
      checksWarning: scan.checks_warning ?? 0, checksFailed: scan.checks_failed ?? 0,
      criticalCount: scan.critical_count ?? 0, majorCount: scan.major_count ?? 0,
      summary: scan.summary ?? '', error: scan.error,
      issues: (issues ?? []) as any, checks: (checks ?? []) as any,
      pages: (pages ?? []) as any, screenshots: [],
    }
  }

  private async initEngines() {
    await this.discovery.initialize()
    await this.crawler.initialize()
    await this.browser.initialize()
  }

  private async cleanupEngines() {
    await this.discovery.cleanup()
    await this.crawler.cleanup()
    await this.browser.cleanup()
  }

  private async updateStatus(scanId: string, status: ScanStatus) {
    const update: Record<string, unknown> = { status }
    if (status === 'discovering') update.started_at = new Date().toISOString()
    if (['completed', 'failed', 'partial'].includes(status)) update.completed_at = new Date().toISOString()
    await this.supabase.from('scans').update(update as any).eq('id', scanId)
  }

  private async saveDiscoveredPages(scanId: string, links: string[]) {
    const rows = links.map(url => ({ scan_id: scanId, url, final_url: url, depth: 0 }))
    if (rows.length) await this.supabase.from('pages').insert(rows as any)
  }

  private async saveCrawledPages(scanId: string, pages: PageResult[]): Promise<PageResult[]> {
    const rows = pages.map(p => ({
      scan_id: scanId, url: p.url, status_code: p.status,
      final_url: p.finalUrl, response_time_ms: p.responseTime, title: p.title, depth: p.depth,
    }))
    const { data } = await this.supabase.from('pages').insert(rows as any).select('id')
    return (data ?? []).map((d: any, i) => ({ ...pages[i], id: d.id }))
  }

  private async saveChecks(scanId: string, checks: CheckResult[]) {
    const rows = checks.map(c => ({
      scan_id: scanId, page_id: c.pageId, category: c.category, key: c.key,
      status: c.status, severity: c.severity, title: c.title, message: c.message, duration_ms: c.duration,
    }))
    if (rows.length) await this.supabase.from('checks').insert(rows as any)
  }

  private async saveIssues(scanId: string, issues: Issue[]) {
    const rows = issues.map(i => ({
      scan_id: scanId, page_id: i.pageId, category: i.category, severity: i.severity,
      title: i.title, description: i.description, suggestion: i.suggestion,
      confidence: i.confidence, status: i.status,
    }))
    if (!rows.length) return
    const { data } = await this.supabase.from('issues').insert(rows as any).select('id')
    // Save evidence per issue
    for (let i = 0; i < issues.length; i++) {
      const dbIssue = (data ?? [])[i] as any
      if (dbIssue && issues[i].evidence.length > 0) {
        const evRows = issues[i].evidence.map(ev => ({
          scan_id: scanId, issue_id: dbIssue.id, type: ev.type, payload: ev.payload,
        }))
        await this.supabase.from('evidence').insert(evRows as any)
      }
    }
  }

  private extractIssues(checks: CheckResult[]): Issue[] {
    return checks
      .filter(c => c.status === 'failed' && c.severity)
      .map(c => ({
        id: crypto.randomUUID(), scanId: c.scanId, pageId: c.pageId,
        category: c.category, severity: c.severity as IssueSeverity,
        title: c.title, description: c.message,
        suggestion: this.getSuggestion(c.key),
        confidence: 'high' as const, status: 'open' as const,
        evidence: c.evidence ?? [],
      }))
  }

  private getSuggestion(key: string): string {
    const map: Record<string, string> = {
      http_status: 'Verify the page exists and is publicly accessible.',
      console_errors: 'Fix JavaScript errors shown in the browser console.',
      page_title: 'Add a descriptive <title> tag to the page.',
      form_no_submit: 'Add a visible submit button to the form.',
      cta_detected: 'Add a clear call-to-action button to guide users.',
      responsive_mobile: 'Fix layout to prevent horizontal overflow on mobile.',
      responsive_tablet: 'Fix layout to prevent horizontal overflow on tablet.',
      responsive_desktop: 'Fix layout to prevent horizontal overflow on desktop.',
    }
    return map[key] ?? 'Investigate and fix the reported issue.'
  }

  private generateSummary(result: ScanResult): string {
    if (result.criticalCount > 0)
      return `${result.criticalCount} critical issue(s) detected. Site is not ready to ship.`
    if (result.majorCount > 0)
      return `${result.majorCount} major issue(s) found. Fix before going live.`
    if (result.checksFailed > 0)
      return `${result.checksFailed} issue(s) detected. Review the details.`
    if (result.checksWarning > 0)
      return `${result.checksWarning} warning(s). Site is good but improvements are possible.`
    return 'QA complete. Site is ready to ship.'
  }

  private async finalizeScan(scanId: string, result: ScanResult) {
    await this.supabase.from('scans').update({
      pages_discovered: result.pagesDiscovered,
      checks_total: result.checksTotal, checks_passed: result.checksPassed,
      checks_warning: result.checksWarning, checks_failed: result.checksFailed,
      critical_count: result.criticalCount, major_count: result.majorCount,
      summary: result.summary,
    } as any).eq('id', scanId)
  }

  private async updateSiteLastScan(siteId: string, scanId: string) {
    await this.supabase.from('sites').update({
      last_scan_id: scanId, updated_at: new Date().toISOString(),
    } as any).eq('id', siteId)
  }
}
