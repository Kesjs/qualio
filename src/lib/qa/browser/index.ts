import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import type { QAConfigManager } from '../config'
import type { CheckResult, CheckCategory, CheckStatus, IssueSeverity, JourneyDefinition, JourneyResult, JourneyStepResult, JourneyActionType } from '../types'

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
        results.push(this.makeCheck('form_no_submit', 'forms', 'warning', 'Form Missing Submit', 'A form has no visible submit button', 'minor', duration))
      }
      if (f.fieldCount === 0) {
        results.push(this.makeCheck('form_empty', 'forms', 'warning', 'Empty Form', 'A form has no visible fields', 'minor', duration))
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
        ctaCount === 0 ? 'minor' : null,
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

  /**
   * Exécute un parcours utilisateur (user journey) défini par une série d'étapes
   * Capture un screenshot uniquement à l'étape en échec
   * Retourne les résultats de chaque étape pour persistance
   */
  async executeJourney(scanId: string, journey: JourneyDefinition): Promise<JourneyResult> {
    const page = await this.context!.newPage()
    const steps: JourneyStepResult[] = []
    let stepsPassed = 0
    let stepsFailed = 0
    let stepsNotReached = 0
    const startTime = Date.now()

    // Configurer le viewport si spécifié
    if (journey.viewport) {
      await page.setViewportSize({ 
        width: journey.viewport.width, 
        height: journey.viewport.height 
      })
    }

    // Capturer les erreurs console
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    try {
      // Naviguer vers l'URL de départ
      await page.goto(journey.startUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 20000 
      })

      // Exécuter chaque étape du parcours
      for (let i = 0; i < journey.steps.length; i++) {
        const stepDef = journey.steps[i]
        const stepStartTime = Date.now()
        const stepResult: JourneyStepResult = {
          scanId,
          journeyName: journey.name,
          stepOrder: i + 1,
          stepName: stepDef.name,
          actionType: stepDef.action.type,
          actionTarget: stepDef.action.target,
          actionDetails: {},
          status: 'pass',
          resultPayload: {},
          durationMs: 0,
        }

        try {
          // Exécuter l'action selon son type
          await this.executeStepAction(page, stepDef.action, stepResult)

          // Vérifier le résultat attendu si spécifié
          if (stepDef.expectedResult) {
            await this.verifyStepResult(page, stepDef.expectedResult, stepResult)
          }

          // Si on arrive ici, l'étape a réussi
          stepResult.status = 'pass'
          stepsPassed++

        } catch (error: any) {
          // L'étape a échoué
          stepResult.status = 'fail'
          stepResult.errorMessage = error.message
          stepResult.resultPayload = {
            ...stepResult.resultPayload,
            error: error.message,
            stack: error.stack,
            consoleErrors: consoleErrors.length > 0 ? consoleErrors : undefined,
            currentUrl: page.url(),
          }
          stepsFailed++

          // IMPORTANT : Capturer screenshot uniquement en cas d'échec
          try {
            const screenshot = await page.screenshot({ type: 'png', fullPage: false })
            // Le screenshot sera uploadé et son ID sera ajouté lors de la persistance
            stepResult.resultPayload!.screenshotBuffer = screenshot.toString('base64')
          } catch (screenshotError) {
            console.error('Impossible de capturer screenshot à l\'échec:', screenshotError)
          }

          // Marquer toutes les étapes suivantes comme "not_reached"
          for (let j = i + 1; j < journey.steps.length; j++) {
            const notReachedStep: JourneyStepResult = {
              scanId,
              journeyName: journey.name,
              stepOrder: j + 1,
              stepName: journey.steps[j].name,
              actionType: journey.steps[j].action.type,
              actionTarget: journey.steps[j].action.target,
              status: 'not_reached',
              errorMessage: `Étape précédente "${stepDef.name}" a échoué`,
              durationMs: 0,
            }
            steps.push(notReachedStep)
            stepsNotReached++
          }

          // Ajouter l'étape en échec et sortir de la boucle
          stepResult.durationMs = Date.now() - stepStartTime
          steps.push(stepResult)
          break
        }

        stepResult.durationMs = Date.now() - stepStartTime
        steps.push(stepResult)
      }

    } catch (error: any) {
      // Erreur globale du parcours (ex: timeout sur startUrl)
      return {
        journeyName: journey.name,
        status: 'fail',
        stepsTotal: journey.steps.length,
        stepsPassed: 0,
        stepsFailed: 0,
        stepsNotReached: journey.steps.length,
        steps: [],
        durationMs: Date.now() - startTime,
        error: error.message,
      }
    } finally {
      await page.close()
    }

    const totalDuration = Date.now() - startTime
    const status = stepsFailed > 0 ? 'fail' : stepsPassed === journey.steps.length ? 'pass' : 'partial'

    return {
      journeyName: journey.name,
      status,
      stepsTotal: journey.steps.length,
      stepsPassed,
      stepsFailed,
      stepsNotReached,
      steps,
      durationMs: totalDuration,
    }
  }

  /**
   * Exécute une action Playwright selon son type
   */
  private async executeStepAction(
    page: Page, 
    action: JourneyDefinition['steps'][0]['action'],
    stepResult: JourneyStepResult
  ): Promise<void> {
    switch (action.type) {
      case 'navigation':
        if (!action.target) throw new Error('Navigation requires a target URL')
        const response = await page.goto(action.target, { 
          waitUntil: 'domcontentloaded', 
          timeout: 20000 
        })
        stepResult.resultPayload = {
          url: action.target,
          status: response?.status(),
          finalUrl: page.url(),
        }
        break

      case 'click':
        if (!action.target) throw new Error('Click requires a target selector')
        await page.click(action.target, { timeout: 10000 })
        stepResult.actionDetails = { selector: action.target }
        if (action.waitFor) {
          await page.waitForURL(action.waitFor, { timeout: 10000 })
        }
        stepResult.resultPayload = { currentUrl: page.url() }
        break

      case 'fill':
        if (!action.target) throw new Error('Fill requires a target selector')
        if (typeof action.value === 'object') {
          // Remplir plusieurs champs
          for (const [selector, value] of Object.entries(action.value)) {
            await page.fill(selector, value, { timeout: 10000 })
          }
          stepResult.actionDetails = { fields: Object.keys(action.value) }
        } else {
          // Remplir un seul champ
          await page.fill(action.target, action.value || '', { timeout: 10000 })
          stepResult.actionDetails = { selector: action.target }
        }
        break

      case 'submit':
        if (!action.target) throw new Error('Submit requires a target selector')
        const submitPromises = [page.click(action.target, { timeout: 10000 })]
        if (action.waitFor) {
          submitPromises.push(page.waitForURL(action.waitFor, { timeout: 10000 }))
        }
        await Promise.all(submitPromises)
        stepResult.resultPayload = { currentUrl: page.url() }
        break

      case 'wait':
        if (action.target) {
          // Attendre un sélecteur
          await page.waitForSelector(action.target, { timeout: 10000 })
        } else if (action.waitFor) {
          // Attendre une URL
          await page.waitForURL(action.waitFor, { timeout: 10000 })
        }
        break

      case 'assert':
        // Les assertions sont gérées par verifyStepResult
        break

      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  /**
   * Vérifie que le résultat attendu est présent
   */
  private async verifyStepResult(
    page: Page,
    expected: JourneyDefinition['steps'][0]['expectedResult'],
    stepResult: JourneyStepResult
  ): Promise<void> {
    if (expected!.url) {
      const currentUrl = page.url()
      if (!currentUrl.includes(expected!.url)) {
        throw new Error(`Expected URL to include "${expected!.url}", but got "${currentUrl}"`)
      }
    }

    if (expected!.selector) {
      const element = await page.$(expected!.selector)
      if (!element) {
        throw new Error(`Expected element "${expected!.selector}" not found`)
      }
    }

    if (expected!.text) {
      const pageText = await page.textContent('body')
      if (!pageText?.includes(expected!.text)) {
        throw new Error(`Expected text "${expected!.text}" not found in page`)
      }
    }
  }
}
