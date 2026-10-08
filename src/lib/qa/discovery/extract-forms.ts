import type { Page } from 'playwright-core'
import type { DiscoveredForm } from '../types'
import { classifyForm } from './classify-form'
import { detectUntestable } from './detect-untestable'
import { formSignature } from './form-signature'

export async function extractForms(page: Page): Promise<Array<DiscoveredForm & { index: number }>> {
  const pageUrl = page.url()
  const pageTitle = await page.title()
  const raw = await page.evaluate(() => {
    const captchaScripts = Array.from(document.querySelectorAll('script[src]'))
      .map(script => script.getAttribute('src') ?? '').filter(src => /captcha|turnstile/i.test(src)).join(' ')
    const forms = Array.from(document.querySelectorAll('form, [role="form"]')).map((form, index) => {
      const htmlForm = form as HTMLFormElement
      const fields = Array.from(form.querySelectorAll('input, textarea, select')).map(node => {
        const field = node as HTMLInputElement
        const style = getComputedStyle(field)
        return {
          name: field.name || field.id || '', type: field.tagName === 'TEXTAREA' ? 'textarea' : field.type || 'text',
          required: field.required, label: field.labels?.[0]?.textContent?.trim() ?? field.getAttribute('aria-label'),
          hidden: field.type === 'hidden' || field.hidden || style.display === 'none' || style.visibility === 'hidden' || field.getClientRects().length === 0,
          autocomplete: field.autocomplete, min: field.min, max: field.max, maxLength: field.maxLength,
        }
      })
      const submit = form.querySelector('button[type="submit"], input[type="submit"], button:not([type])')
      return {
        action: form.getAttribute('action') ? htmlForm.action : '', method: htmlForm.method || 'get', fields,
        submitButton: submit?.textContent?.trim() || (submit as HTMLInputElement | null)?.value || null,
        index, markup: form.outerHTML + captchaScripts, spa: form.tagName !== 'FORM',
        multiStep: !!form.querySelector('[data-step], [aria-label*="step"], [class*="wizard"], [class*="multistep"]'),
        thirdPartyIframe: false,
      }
    })
    for (const iframe of Array.from(document.querySelectorAll('iframe[src]'))) {
      const src = (iframe as HTMLIFrameElement).src
      if (!/hubspot|typeform|forms\.gle|docs\.google\.com\/forms|jotform|tally\.so|formstack|formsite/i.test(src)) continue
      forms.push({ action: src, method: 'get', fields: [], submitButton: null, index: -1,
        markup: iframe.outerHTML, spa: false, multiStep: false, thirdPartyIframe: true })
    }
    return forms
  })
  return raw.map(({ markup, spa, multiStep, thirdPartyIframe, index, ...form }) => ({
    ...form, index, signature: formSignature(form, pageUrl), formType: classifyForm(form, pageUrl),
    testability: detectUntestable(form, { markup, spa, multiStep, thirdPartyIframe }),
    occurrences: [{ pageUrl, pageTitle }],
  }))
}
