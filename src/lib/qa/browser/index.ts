import { chromium, type Browser, type BrowserContext } from 'playwright'
import type { QAConfigManager } from '../config'
import type { CheckResult, CheckCategory, CheckStatus, IssueSeverity } from '../types'

export class BrowserEngine {
  private config: QAConfigManager
  private browser: Browser | null = null
  private context: BrowserContext | null = null

  constructor(config: QAConfigManager) {
    this.config = config
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
    this.context = await this.browser.newContext({
      userAgent: 'Qualio-QA/1.0 (https://qualio.dev)',
      ignoreHTTPSErrors: true,
    })
  }

  async cleanup(): Promise<void> {
    await this.context?.close()
    await this.browser?.close()
    this.context = null
    this.browser = null
  }

  private makeCheck(
    key: string,
    category: CheckCategory,
    status: CheckStatus,
    title: string,
    message: string,
    severity: IssueSeverity | null = null,
    duration = 0
  ): Omit<CheckResult, 'id' | 'scanId' | 'pageId'> {
    return { key, category, status, title, message, severity, duration }
  }

  async testNavigation(url: string): Promise<Omit<CheckResult, 'id' | 'scanId' | 'pageId'>[]> {
    const page = await this.context!.newPage()
    const consoleErrors: string[] = []
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })

    const t0 = Date.now()
    let statusCode = 200
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
      statusCode = res?.status() ?? 200
    } catch {}
    const duration = Date.now() - t0

    await page.close()

    return [
      this.makeCheck(
        'http_status', 'navigation',
        statusCode >= 200 && statusCode < 400 ? 'passed' : 'failed',
        'HTTP Status',
        `Page returned HTTP ${statusCode}`,
        statusCode >= 400 ? 'critical' : null,
        duration
      ),
      this.makeCheck(
        'console_errors', 'browser',
        consoleErrors.length === 0 ? 'passed' : consoleErrors.length <= 2 ? 'warning' : 'failed',
        'Console Errors',
        consoleErrors.length === 0 ? 'No console errors' : `${consoleErrors.length} console error(s) found`,
        consoleErrors.length > 2 ? 'major' : null,
        duration
      ),
    ]
  }

  async testForms(url: string): Promise<Omit<CheckResult, 'id' | 'scanId' | 'pageId'>[]> {
    const page = await this.context!.newPage()
    const t0 = Date.now()
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }) } catch {}

    const forms = await page.$$eval('form', fEls =>
      fEls.map(f => ({
        hasSubmit: !!f.querySelector('[type=submit], button[type=submit], button:not([type])'),
        fieldCount: f.querySelectorAll('input:not([type=hidden]), select, textarea').length,
        action: (f as HTMLFormElement).action || '',
      }))
    ).catch(() => [] as { hasSubmit: boolean; fieldCount: number; action: string }[])

    await page.close()
    const duration = Date.now() - t0

    if (forms.length === 0) {
      return [this.makeCheck('forms_detected', 'forms', 'passed', 'Form Check', 'No forms found on page', null, duration)]
    }

    const results: Omit<CheckResult, 'id' | 'scanId' | 'pageId'>[] = []
    for (const f of forms) {
      if (!f.hasSubmit) {
        results.push(this.makeCheck('form_no_submit', 'forms', 'warning', 'Form Missing Submit', 'A form has no visible submit button', 'warning', duration))
      }
      if (f.fieldCount === 0) {
        results.push(this.makeCheck('form_empty', 'forms', 'warning', 'Empty Form', 'A form has no visible fields', 'warning', duration))
      }
    }
    if (results.length === 0) {
      results.push(this.makeCheck('forms_detected', 'forms', 'passed', 'Forms OK', `${forms.length} form(s) look valid`, null, duration))
    }
    return results
  }

  async testCTA(url: string): Promise<Omit<CheckResult, 'id' | 'scanId' | 'pageId'>[]> {
    const page = await this.context!.newPage()
    const t0 = Date.now()
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }) } catch {}

    const ctaCount = await page.$$eval(
      'a[href*="contact"], a[href*="signup"], a[href*="register"], button[type=submit], .cta, [class*="cta"], [id*="cta"]',
      els => els.length
    ).catch(() => 0)

    await page.close()
    const duration = Date.now() - t0

    return [
      this.makeCheck(
        'cta_detected', 'cta',
        ctaCount > 0 ? 'passed' : 'warning',
        'Call-to-Action',
        ctaCount > 0 ? `${ctaCount} CTA element(s) found` : 'No clear CTA found on page',
        ctaCount === 0 ? 'warning' : null,
        duration
      ),
    ]
  }

  async testResponsive(url: string): Promise<Omit<CheckResult, 'id' | 'scanId' | 'pageId'>[]> {
    const viewports = this.config.getViewports()
    const results: Omit<CheckResult, 'id' | 'scanId' | 'pageId'>[] = []

    for (const vp of viewports) {
      const page = await this.context!.newPage()
      await page.setViewportSize({ width: vp.width, height: vp.height })
      const t0 = Date.now()
      try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }) } catch {}

      const hasOverflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      ).catch(() => false)

      await page.close()
      const duration = Date.now() - t0

      results.push(this.makeCheck(
        `responsive_${vp.name}`, 'responsive',
        hasOverflow ? 'failed' : 'passed',
        `Responsive — ${vp.name} (${vp.width}px)`,
        hasOverflow ? `Horizontal overflow detected at ${vp.width}px` : `No overflow at ${vp.width}px`,
        hasOverflow ? 'major' : null,
        duration
      ))
    }

    return results
  }

  async takeScreenshot(url: string, viewport: { name: string; width: number; height: number }): Promise<Buffer> {
    const page = await this.context!.newPage()
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
    const screenshot = await page.screenshot({ type: 'png', fullPage: false })
    await page.close()
    return screenshot
  }
}
