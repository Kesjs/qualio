import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { chromium, type Browser } from 'playwright-core'
import { existsSync } from 'node:fs'
import { submitSelectedForm } from '../submit-selected-form'
import { formSignature } from '../../discovery/form-signature'
import type { FormInfo, FormSelection } from '../../types'

// Every browser request below is fulfilled locally. No external form is contacted.
vi.mock('../../ssrf', () => ({ assertPublicScanUrl: vi.fn().mockResolvedValue(undefined) }))
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const available = existsSync(executablePath)
describe.skipIf(!available)('soumission ciblée dans un vrai navigateur (réseau simulé)', () => {
  let browser: Browser
  beforeAll(async () => { browser = await chromium.launch({ executablePath, headless: true }) }, 20000)
  afterAll(async () => { await browser?.close() }, 30000)
  const url = 'https://qualio-fixture.example/contact'
  const data: FormInfo = { action: 'https://qualio-fixture.example/submit', method: 'post', submitButton: 'Envoyer', fields: [
    { name: 'email', type: 'email', required: true, label: null }, { name: 'message', type: 'textarea', required: true, label: null },
    { name: 'honeypot', type: 'text', required: false, label: null },
  ] }
  const html = '<form method="post" action="/submit"><input name="email" type="email" required><textarea name="message" required></textarea><input name="honeypot" style="display:none"><button>Envoyer</button></form>'
  const selection: FormSelection = { signature: formSignature(data, url), pageUrl: url, formType: 'contact' }
  async function fixture(body: string, response: string, failure = false) {
    const context = await browser.newContext({ serviceWorkers: 'block' })
    const submissions: string[] = []
    await context.route('**/*', async route => {
      if (route.request().method() === 'POST') {
        submissions.push(route.request().postData() ?? '')
        if (failure) return route.abort('failed')
        return route.fulfill({ status: 200, contentType: 'text/html', body: response })
      }
      return route.fulfill({ status: 200, contentType: 'text/html', body })
    })
    return { context, submissions }
  }
  it('envoie une fois, ignore le honeypot et capture avant/après', async () => {
    const fixturePage = await fixture(html, '<p>Merci, message envoyé.</p>')
    try {
      const result = await submitSelectedForm(fixturePage.context, selection)
      expect(result.status).toBe('passed')
      expect(fixturePage.submissions).toHaveLength(1)
      expect(new URLSearchParams(fixturePage.submissions[0]).get('honeypot')).toBe('')
      expect(result.evidence?.filter(ev => ev.type === 'screenshot').map(ev => ev.payload.phase)).toEqual(['before', 'after'])
      expect(result.evidence?.some(ev => ev.type === 'action' && ev.payload.action === 'field_filled')).toBe(true)
    } finally { await fixturePage.context.close() }
  }, 25000)
  it('une panne réseau est indéterminée, sans second POST', async () => {
    const fixturePage = await fixture(html, '', true)
    try { expect((await submitSelectedForm(fixturePage.context, selection)).status).toBe('inconclusive'); expect(fixturePage.submissions).toHaveLength(1) }
    finally { await fixturePage.context.close() }
  }, 25000)
  it('un formulaire disparu est ignoré sans soumission', async () => {
    const fixturePage = await fixture('<p>Le formulaire a été retiré.</p>', '')
    try { const result = await submitSelectedForm(fixturePage.context, selection); expect(result.status).toBe('skipped'); expect(result.message).toContain('introuvable'); expect(fixturePage.submissions).toHaveLength(0) }
    finally { await fixturePage.context.close() }
  }, 15000)
  it('un CAPTCHA empêche toute soumission', async () => {
    const fixturePage = await fixture(html.replace('</form>', '<div class="g-recaptcha"></div></form>'), '')
    try { expect((await submitSelectedForm(fixturePage.context, selection)).status).toBe('skipped'); expect(fixturePage.submissions).toHaveLength(0) }
    finally { await fixturePage.context.close() }
  }, 15000)
  it('HTTP 200 sans confirmation ne devient pas une réussite', async () => {
    const fixturePage = await fixture(html, '<p>Traitement en cours.</p>')
    try { expect((await submitSelectedForm(fixturePage.context, selection)).status).toBe('inconclusive'); expect(fixturePage.submissions).toHaveLength(1) }
    finally { await fixturePage.context.close() }
  }, 20000)
  it('une erreur de persistance avant clic empêche la soumission', async () => {
    const fixturePage = await fixture(html, '')
    try {
      const result = await submitSelectedForm(fixturePage.context, selection, { onRunning: async () => { throw new Error('storage unavailable') } })
      expect(result.status).toBe('inconclusive'); expect(fixturePage.submissions).toHaveLength(0)
    } finally { await fixturePage.context.close() }
  }, 15000)
})
