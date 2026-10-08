import type { BrowserContext, Request } from 'playwright-core'
import type { CheckResult, Evidence, FormSelection, CheckStatus } from '../types'
import { assertPublicScanUrl } from '../ssrf'
import { extractForms } from '../discovery/extract-forms'
import { isHoneypot, testDataForField } from './test-data'

export type FormCheck = Omit<CheckResult, 'id' | 'scanId' | 'pageId'>
export interface LoginTestCredentials { email?: string; username?: string; password: string }

export async function submitSelectedForm(context: BrowserContext, selection: FormSelection, options: {
  credentials?: LoginTestCredentials
  onRunning?: () => Promise<void>
} = {}): Promise<FormCheck> {
  const started = Date.now()
  const evidence: Evidence[] = [{ type: 'url', payload: {
    signature: selection.signature, formType: selection.formType, url: selection.pageUrl,
    testMode: selection.formType === 'login' && !options.credentials ? 'invalid_credentials_once' : 'real_submission',
  } }]
  const finish = (status: CheckStatus, message: string): FormCheck => ({
    key: `form_submission:${selection.signature}`, category: 'forms', status,
    title: `Formulaire ${selection.formType}`, message, duration: Date.now() - started,
    severity: status === 'failed' ? 'major' : null, evidence,
  })
  const action = (name: string, details: Record<string, unknown> = {}) => evidence.push({
    type: 'action', payload: { signature: selection.signature, action: name, at: new Date().toISOString(), ...details },
  })
  const page = await context.newPage()
  let armed = false
  let mutationSent = false
  let attempted = false
  const failedRequests: string[] = []
  const responses: Array<{ url: string; status: number; method: string }> = []
  const pendingRequests = new Set<Request>()
  let settleRequests: (() => void) | undefined
  const scrub = (text: string) => {
    let safe = text
    for (const value of Object.values(options.credentials ?? {})) if (value) safe = safe.split(value).join('[REDACTED]')
    return safe.slice(0, 600)
  }
  const screenshot = async (phase: 'before' | 'after') => {
    try {
      const buffer = await page.screenshot({ type: 'png', fullPage: false, timeout: 3000,
        mask: [page.locator('input:not([type="submit"]), textarea')] })
      evidence.push({ type: 'screenshot', payload: { signature: selection.signature, phase,
        screenshotBuffer: buffer.toString('base64'), url: selection.pageUrl, viewport: 'desktop' } })
    } catch { action('capture_unavailable', { phase }) }
  }
  try {
    // Page routes run before the context's public-network guard, hence fallback.
    await page.route('**/*', async route => {
      const request = route.request()
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        if (!armed || mutationSent || request.redirectedFrom()) return route.abort('blockedbyclient')
        mutationSent = true
      }
      await route.fallback()
    })
    await assertPublicScanUrl(selection.pageUrl)
    await page.goto(selection.pageUrl, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await assertPublicScanUrl(page.url())
    const forms = await extractForms(page)
    const form = forms.find(item => item.signature === selection.signature)
    if (!form) return finish('skipped', 'Formulaire introuvable au moment du test.')
    if (!form.testability.testable) return finish('skipped', form.testability.reason)
    if (form.formType !== selection.formType) return finish('skipped', 'Le type du formulaire a changé. Relancez la découverte avant de le sélectionner.')
    const locator = page.locator('form, [role="form"]').nth(form.index)
    const submit = locator.locator('button[type="submit"], input[type="submit"], button:not([type])').first()
    if (!await submit.count() || !await submit.isVisible()) return finish('failed', 'Aucun bouton de soumission visible.')
    if (/(?:buy|pay|delete|publish|purchase|checkout|transfer|supprimer|payer|acheter|réserver)/i.test(`${form.action} ${form.submitButton}`)) return finish('skipped', 'Action sensible (achat, paiement ou suppression), hors périmètre des tests de formulaires.')
    const targetUrl = await submit.getAttribute('formaction') || form.action || page.url()
    await assertPublicScanUrl(new URL(targetUrl, page.url()).toString())
    // Missing/mismatched credentials must never be guessed from unrelated secrets.
    const credentials = form.formType === 'login' ? options.credentials : undefined
    for (const [index, field] of form.fields.entries()) {
      if (isHoneypot(field) || ['submit', 'button', 'reset', 'file'].includes(field.type)) continue
      const input = locator.locator('input, textarea, select').nth(index)
      if (!await input.isVisible() || !await input.isEnabled()) continue
      if (field.type === 'checkbox' || field.type === 'radio') {
        if (field.required && !await input.isChecked()) await input.check({ timeout: 3000 })
        else continue
      } else if (field.type.startsWith('select')) {
        const value = await input.locator('option').evaluateAll(nodes =>
          nodes.map(node => node as HTMLOptionElement).find(node => node.value && !node.disabled)?.value ?? '')
        if (value) await input.selectOption(value, { timeout: 3000 })
      } else {
        const value = testDataForField(field, { formType: form.formType,
          email: selection.formType === 'signup' ? selection.testEmail : credentials?.email,
          username: credentials?.username, password: credentials?.password })
        await input.fill(field.maxLength && field.maxLength > 0 ? value.slice(0, field.maxLength) : value, { timeout: 3000 })
      }
      action('field_filled', { field: field.name, type: field.type })
    }
    await screenshot('before')
    const beforeUrl = page.url()
    const beforeText = await page.locator('body').innerText()
    const valid = await locator.evaluate(node => (node as HTMLFormElement).checkValidity())
    if (!valid) return finish('inconclusive', 'Les données de test ne satisfont pas les contraintes du formulaire. Aucune soumission envoyée.')
    // Persist the running marker BEFORE the only click. A persistence failure aborts.
    await options.onRunning?.()
    page.on('request', request => {
      if (armed && (request.isNavigationRequest() || !['GET', 'HEAD', 'OPTIONS'].includes(request.method()))) pendingRequests.add(request)
    })
    page.on('requestfinished', request => {
      pendingRequests.delete(request)
      if (!pendingRequests.size) settleRequests?.()
    })
    page.on('requestfailed', request => {
      pendingRequests.delete(request)
      if (!pendingRequests.size) settleRequests?.()
      if (armed && (request.isNavigationRequest() || ['xhr', 'fetch'].includes(request.resourceType()))) failedRequests.push(request.failure()?.errorText ?? 'Échec réseau')
    })
    page.on('response', response => {
      const request = response.request()
      if (armed && (request.isNavigationRequest() || !['GET', 'HEAD', 'OPTIONS'].includes(request.method()))) {
        responses.push({ url: response.url().split('?')[0], status: response.status(), method: request.method() })
      }
    })
    // Suppress a second submit event triggered by application code.
    await locator.evaluate(node => {
      let submitted = false
      node.addEventListener('submit', event => {
        if (submitted) { event.preventDefault(); event.stopImmediatePropagation() }
        submitted = true
      }, true)
    })
    armed = true
    attempted = true
    action('submit_clicked', { label: form.submitButton, url: selection.pageUrl })
    // Exactly one click; never replay on timeout or a failed request.
    await submit.click({ timeout: 5000, noWaitAfter: true })
    await page.waitForFunction(({ url, text }) => location.href !== url || document.body.innerText !== text,
      { url: beforeUrl, text: beforeText }, { timeout: 8000 }).catch(() => undefined)
    await page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => undefined)
    // Let an observed request settle before accepting UI feedback.
    await page.waitForTimeout(750)
    if (pendingRequests.size) {
      await new Promise<void>(resolve => {
        const timer = setTimeout(resolve, 5000)
        settleRequests = () => { clearTimeout(timer); resolve() }
      })
    }
    await assertPublicScanUrl(page.url())
    for (const response of responses) {
      evidence.push({ type: 'network', payload: { signature: selection.signature, ...response } })
      action('response_received', response)
    }
    const afterText = await page.locator('body').innerText()
    const lines = afterText.split('\n').map(line => line.trim()).filter(line => line && !beforeText.includes(line))
    const visibleMessages = lines.filter(line => /error|erreur|invalid|incorrect|failed|échec|merci|thank|success|réussi|envoy|sent|confirm|bienvenue|welcome/i.test(line))
    for (const text of visibleMessages.slice(0, 5)) action('message_displayed', { text: scrub(text) })
    if (failedRequests.length || pendingRequests.size) {
      evidence.push({ type: 'network', payload: { signature: selection.signature, failedRequests, pendingRequestCount: pendingRequests.size } })
      return finish('inconclusive', 'Échec réseau ou réponse toujours en attente : résultat indéterminé, aucun rejeu.')
    }
    const error = visibleMessages.some(text => /error|erreur|invalid|incorrect|failed|échec/i.test(text))
    const invalidLogin = form.formType === 'login' && !credentials
    if (responses.some(response => response.status >= 500)) return finish('failed', 'Le serveur a renvoyé une erreur après la soumission.')
    if (invalidLogin) {
      if (error) return finish('passed', 'Une seule tentative avec des identifiants invalides : message d’erreur visible. La connexion réussie n’a pas été testée.')
      return finish('inconclusive', 'Une seule tentative avec des identifiants invalides : aucun message de rejet explicite observé.')
    }
    if (error || responses.some(response => response.status >= 400)) return finish('failed', 'La soumission a été rejetée : erreur affichée ou réponse HTTP en erreur.')
    const success = visibleMessages.some(text => /merci|thank|success|réussi|envoy|sent|bienvenue|welcome|confirm.*(?:email|mail|inscri)/i.test(text))
    const successRoute = page.url() !== beforeUrl && /\/+(?:dashboard|account|merci|thank|success|confirmation)(?:[/?#]|$)/i.test(page.url())
    if (success || successRoute) return finish('passed', 'Soumission effectuée une fois ; confirmation visible ou navigation de succès observée. La réception d’un email n’est pas vérifiée.')
    return finish('inconclusive', 'Soumission tentée une fois, sans confirmation explicite. Un HTTP 200 seul ne prouve pas la réussite.')
  } catch {
    return finish('inconclusive', attempted ? 'La tentative n’a pas pu être confirmée. Aucun rejeu automatique.' : 'Le formulaire n’a pas pu être préparé ou la navigation a échoué. Aucune soumission rejouée.')
  } finally {
    if (attempted) await screenshot('after')
    await page.close()
  }
}
