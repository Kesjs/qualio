import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../supabase/database.types'
import { DiscoveryEngine } from '../discovery'
import { CrawlerEngine } from '../crawler'
import { BrowserEngine } from '../browser'
import { QAConfigManager } from '../config'
import type {
  ScanResult, ScanStatus, CheckResult, Issue, IssueSeverity, PageResult, ScanModule, JourneyDefinition, Evidence,
} from '../types'
import { EvidenceEngine, Incident } from '../evidence'
import { DiffEngine } from '../diff'
import { AIEngine } from '../ai/engine'
import { persistJourneyResults } from '../journeys/persistence'
interface ScanOptions {
  scanId?: string
  siteId: string
  userId: string
  url: string
  previousScanId?: string
  config?: QAConfigManager
  consentConfirmedAt?: string | null
  modules?: ScanModule[]
  journeys?: unknown
}

function parseJourneys(value: unknown, baseUrl: string): JourneyDefinition[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item): JourneyDefinition[] => {
    if (!item || typeof item !== 'object') return []
    const journey = item as Partial<JourneyDefinition>
    if (!journey.name || !Array.isArray(journey.steps) || journey.steps.length === 0) return []
    return [{
      ...journey,
      name: journey.name,
      steps: journey.steps,
      startUrl: new URL(journey.startUrl || '/', baseUrl).toString(),
    } as JourneyDefinition]
  })
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
    const scanId = options.scanId ?? await this.createScan({ siteId, userId, url, previousScanId, consentConfirmedAt })
    const enabledModules = new Set(options.modules ?? ['pages', 'cta', 'forms', 'consoleErrors', 'mobileResponsive'])

    const result: ScanResult = {
      scanId, siteId, status: 'created',
      startedAt: new Date(), completedAt: null,
      pagesDiscovered: 0, checksTotal: 0, checksPassed: 0, checksWarning: 0, checksFailed: 0,
      criticalCount: 0, majorCount: 0, summary: '', error: null,
      issues: [], checks: [], pages: [], screenshots: [],
    }

    // Add new engine instances to constructor or instantiate locally
    const evidenceEngine = new EvidenceEngine()
    const diffEngine = new DiffEngine()
    const aiEngine = new AIEngine()

    try {
      await this.initEngines()
      // Utility timeout wrapper
      const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
        let timer: NodeJS.Timeout
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => {
            timer = setTimeout(() => reject(new Error(`Timeout: ${label} exceeded ${ms}ms`)), ms)
          }).finally(() => clearTimeout(timer))
        ])
      }

      // Phase 1: Discovery (15s timeout)
      await this.updateStatus(scanId, 'discovering')
      const discovery = await withTimeout(this.discovery.discover(url), 15000, 'Discovery')
      await this.saveDiscoveredPages(scanId, discovery.internalLinks)

      // Phase 2: Crawl (45s timeout)
      await this.updateStatus(scanId, 'crawling')
      const crawl = await withTimeout(this.crawler.crawl(url), 45000, 'Crawler')
      const crawledPages = await this.saveCrawledPages(scanId, crawl.pages)
      result.pages = crawledPages
      result.pagesDiscovered = crawledPages.length

      // Phase 3: Browser testing (2m timeout)
      await this.updateStatus(scanId, 'browser_testing')
      const allChecks: CheckResult[] = []

      await withTimeout((async () => {
        for (const page of crawledPages.slice(0, this.config.getMaxPages())) {
          try {
            const checks = [
              ...(enabledModules.has('pages') || enabledModules.has('consoleErrors')
                ? await this.browser.testNavigation(page.url, {
                    navigation: enabledModules.has('pages'),
                    consoleErrors: enabledModules.has('consoleErrors'),
                  })
                : []),
              ...(enabledModules.has('forms') ? await this.browser.testForms(page.url) : []),
              ...(enabledModules.has('cta') ? await this.browser.testCTA(page.url) : []),
            ]
            checks.forEach(c =>
              allChecks.push({ ...c, id: crypto.randomUUID(), scanId, pageId: page.id ?? null })
            )
          } catch (e) { console.error(`Browser test error for ${page.url}:`, e) }
        }

        // Responsive test on homepage only
        if (enabledModules.has('mobileResponsive')) {
          const resp = await this.browser.testResponsive(url)
          resp.forEach(c =>
            allChecks.push({ ...c, id: crypto.randomUUID(), scanId, pageId: crawledPages[0]?.id ?? null })
          )
        }

        for (const journey of parseJourneys(options.journeys, url)) {
          const journeyResult = await this.browser.executeJourney(scanId, journey)
          const persisted = await persistJourneyResults(journeyResult)
          if (!persisted.success) console.error('[QAOrchestrator] Journey persistence failed:', persisted.error)
        }
      })(), 120000, 'Browser testing')

      await this.saveChecks(scanId, allChecks)
      result.checks = allChecks
      result.checksTotal = allChecks.length
      result.checksPassed = allChecks.filter(c => c.status === 'passed').length
      result.checksWarning = allChecks.filter(c => c.status === 'warning').length
      result.checksFailed = allChecks.filter(c => c.status === 'failed').length
      result.criticalCount = allChecks.filter(c => c.severity === 'critical').length
      result.majorCount = allChecks.filter(c => c.severity === 'major').length

      // Phase 4: Analyzing (Evidence -> Diff -> AI)
      await this.updateStatus(scanId, 'analyzing')
      
      // 4.1. Evidence Engine: Group raw events (checks) into incidents
      const incidents = evidenceEngine.groupChecksIntoIncidents(allChecks)
      
      // 4.2. Diff Engine: Compare with previous scan to find new vs persistent
      let previousIssues: Issue[] = []
      if (previousScanId) {
        const { data } = await this.supabase.from('issues').select('*').eq('scan_id', previousScanId)
        if (data) {
          previousIssues = data.map(d => ({
            id: d.id, scanId: d.scan_id, pageId: d.page_id,
            category: d.category as any, severity: d.severity as any,
            title: d.title, description: d.description || '',
            suggestion: d.suggestion || '', confidence: d.confidence as any,
            status: d.status as any, evidence: [] // We don't strictly need previous evidence for the diff
          }))
        }
      }
      
      const { persistent, newIncidents, resolved } = diffEngine.diff(previousIssues, incidents)
      
      // Update resolved status in database for issues that are now gone
      if (resolved.length > 0) {
        const resolvedIds = resolved.map(r => r.id)
        await this.supabase.from('issues').update({ status: 'resolved' as any }).in('id', resolvedIds)
      }
      
      // 4.3. AI QA Engine: Diagnose new incidents
      const finalIssues: Issue[] = []
      
      // Process persistent issues (carry over previous diagnostic)
      for (const { issue, incident } of persistent) {
        finalIssues.push({
          ...issue,
          id: crypto.randomUUID(),
          scanId,
          pageId: incident.pageId,
          status: 'persistent',
          evidence: incident.checks.flatMap(c => c.evidence || [])
        })
      }
      
      // Initialize AI tracking stats on result
      result.aiCallsCount = 0
      result.aiTokensInput = 0
      result.aiTokensOutput = 0
      result.aiCostUsd = undefined
      result.aiDurationMs = 0
      
      // Process new incidents (run AI)
      for (const incident of newIncidents) {
        let title = incident.title
        let severity = incident.severity
        let description = 'Diagnostic IA indisponible.'
        let suggestion = 'Investigate the reported errors manually.'
        let confidence: any = 'low'
        let status = 'new'
        let aiTokensInput, aiTokensOutput, aiDurationMs, aiCostUsd, aiModel
        
        // AI Diagnosis
        const diagnostic = await aiEngine.diagnoseIncident(incident)
        if (diagnostic) {
          title = diagnostic.title
          severity = diagnostic.severity
          description = JSON.stringify({
            title: diagnostic.title,
            severity: diagnostic.severity,
            summary: diagnostic.summary,
            impact: diagnostic.impact,
            probable_cause: diagnostic.probable_cause,
            recommendation: diagnostic.recommendation,
            confidence: diagnostic.confidence,
            _meta: diagnostic._meta
          })
          suggestion = diagnostic.recommendation
          confidence = String(diagnostic.confidence)
          
          if (diagnostic._meta) {
            aiTokensInput = diagnostic._meta.tokens_input
            aiTokensOutput = diagnostic._meta.tokens_output
            aiDurationMs = diagnostic._meta.duration_ms
            aiCostUsd = diagnostic._meta.cost_usd
            aiModel = diagnostic._meta.model
            
            result.aiCallsCount = (result.aiCallsCount || 0) + 1
            if (typeof aiTokensInput === 'number') {
              result.aiTokensInput = (result.aiTokensInput || 0) + aiTokensInput
            }
            if (typeof aiTokensOutput === 'number') {
              result.aiTokensOutput = (result.aiTokensOutput || 0) + aiTokensOutput
            }
            if (typeof aiCostUsd === 'number') {
              result.aiCostUsd = (result.aiCostUsd ?? 0) + aiCostUsd
            }
            if (typeof aiDurationMs === 'number') {
              result.aiDurationMs = (result.aiDurationMs || 0) + aiDurationMs
            }
          }
        }
        
        finalIssues.push({
          id: crypto.randomUUID(),
          scanId,
          pageId: incident.pageId,
          category: incident.category as any,
          severity,
          title,
          description,
          suggestion,
          confidence,
          status: status as any,
          evidence: incident.checks.flatMap(c => c.evidence || []),
          aiTokensInput, aiTokensOutput, aiDurationMs, aiCostUsd, aiModel
        })
      }

      await this.saveIssues(scanId, userId, finalIssues)
      result.issues = finalIssues

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

  private async saveIssues(scanId: string, userId: string, issues: Issue[]) {
    const rows = issues.map(i => ({
      scan_id: scanId,
      page_id: i.pageId,
      category: i.category,
      severity: i.severity,
      title: i.title,
      description: i.description,
      suggestion: i.suggestion,
      confidence: i.confidence,
      status: i.status
    }))
    if (!rows.length) return
    const { data, error } = await this.supabase.from('issues').insert(rows as any).select('id')
    if (error) {
      console.error('[QAOrchestrator] Error inserting issues into Supabase:', error)
      throw new Error(`Failed to save issues: ${error.message}`)
    }
    // Save evidence per issue. Every incident reported to a user must be traceable to
    // at least one evidence row — an issue with zero evidence silently erodes trust in
    // the diagnostic, so we guarantee a fallback row rather than skip the insert.
    for (let i = 0; i < issues.length; i++) {
      const dbIssue = (data ?? [])[i] as any
      if (!dbIssue) continue

      const evRows = []
      if (issues[i].evidence.length > 0) {
        for (const ev of issues[i].evidence) {
          const payload = await this.persistScreenshotEvidence(scanId, userId, dbIssue.id, issues[i].pageId, ev)
          evRows.push({ scan_id: scanId, issue_id: dbIssue.id, type: ev.type, payload })
        }
      } else {
        console.error(`[QAOrchestrator] Issue ${dbIssue.id} (${issues[i].category}/${issues[i].title}) has no evidence — inserting fallback marker.`)
        evRows.push({
          scan_id: scanId,
          issue_id: dbIssue.id,
          type: 'diagnostic',
          payload: { note: 'No evidence was captured for this incident by the check that reported it.' },
        })
      }
      await this.supabase.from('evidence').insert(evRows as any)
    }
  }

  private async persistScreenshotEvidence(scanId: string, userId: string, issueId: string, pageId: string | null, evidence: Evidence) {
    if (evidence.type !== 'screenshot' || typeof evidence.payload.screenshotBuffer !== 'string') return evidence.payload
    const storagePath = `${userId}/${scanId}/issue_${issueId}_${Date.now()}.png`
    const screenshotBuffer = Buffer.from(evidence.payload.screenshotBuffer, 'base64')
    const { error: uploadError } = await this.supabase.storage.from('screenshots').upload(storagePath, screenshotBuffer, {
      contentType: 'image/png', upsert: false,
    })
    if (uploadError) {
      console.error('[QAOrchestrator] Screenshot upload failed:', uploadError)
      return { ...evidence.payload, screenshotBuffer: undefined, uploadError: uploadError.message }
    }
    const { data: screenshotRecord, error: screenshotError } = await this.supabase.from('screenshots').insert({
      scan_id: scanId, page_id: pageId, issue_id: issueId, storage_path: storagePath,
      viewport: String(evidence.payload.viewport ?? 'desktop'),
    } as any).select('id').single()
    if (screenshotError) console.error('[QAOrchestrator] Screenshot record failed:', screenshotError)
    const { screenshotBuffer: _screenshotBuffer, ...payload } = evidence.payload
    return { ...payload, screenshotId: screenshotRecord?.id ?? null }
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
    let summary = result.summary
    if (result.aiCallsCount && result.aiCallsCount > 0) {
      const costStr = result.aiCostUsd !== undefined ? `$${result.aiCostUsd.toFixed(6)}` : 'coût inconnu'
      summary += ` [AI: ${result.aiCallsCount} call(s), ${result.aiTokensInput ?? 0} in / ${result.aiTokensOutput ?? 0} out, ${costStr}]`
    }

    await this.supabase.from('scans').update({
      pages_discovered: result.pagesDiscovered,
      checks_total: result.checksTotal,
      checks_passed: result.checksPassed,
      checks_warning: result.checksWarning,
      checks_failed: result.checksFailed,
      critical_count: result.criticalCount,
      major_count: result.majorCount,
      summary,
    } as any).eq('id', scanId)
  }

  private async updateSiteLastScan(siteId: string, scanId: string) {
    await this.supabase.from('sites').update({
      last_scan_id: scanId, updated_at: new Date().toISOString(),
    } as any).eq('id', siteId)
  }
}
