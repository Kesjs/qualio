import { describe, it, expect } from 'vitest'
import { classifyForm } from '../classify-form'
import { detectCaptcha } from '../detect-captcha'
import { detectUntestable } from '../detect-untestable'
import { formSignature, matchFormBySignature, deduplicateForms } from '../form-signature'
import { validateFormSelection } from '../validate-selection'
import type { FormInfo, DiscoveredForm } from '../../types'

const form = (types: string[], button = 'Envoyer'): FormInfo => ({ action: '/submit', method: 'post', submitButton: button,
  fields: types.map((type, index) => ({ name: `${type}-${index}`, type, required: true, label: null })) })
describe('classification passive', () => {
  it.each([
    [['email', 'password'], 'Connexion', 'login'], [['email', 'password', 'password'], 'Créer un compte', 'signup'],
    [['email', 'textarea'], 'Envoyer', 'contact'], [['email'], 'Newsletter', 'newsletter'], [['text'], 'Rechercher', 'other'],
  ] as const)('classifie %s avec %s', (fields, label, expected) => expect(classifyForm(form([...fields], label))).toBe(expected))
  it('ne classe pas le footer selon la route signup', () => expect(classifyForm(form(['email'], 'Newsletter'), '/signup')).toBe('newsletter'))
  it('ignore le password honeypot', () => {
    const data = form(['email', 'password'], 'Newsletter'); data.fields[1].hidden = true
    expect(classifyForm(data)).toBe('newsletter')
  })
})
describe('CAPTCHA et testabilité', () => {
  it.each([['<div class="g-recaptcha">', 'reCAPTCHA'], ['https://js.hcaptcha.com/1/api.js', 'hCaptcha'], ['<input name="cf-turnstile-response">', 'Turnstile']])('détecte %s', (markup, provider) => expect(detectCaptcha(markup)).toBe(provider))
  it('ne détecte pas un simple champ', () => expect(detectCaptcha('<input type="email">')).toBeNull())
  it.each([
    ['captcha', { markup: 'g-recaptcha' }, ['email']], ['third_party_iframe', { thirdPartyIframe: true }, []],
    ['file_upload', {}, ['file']], ['multi_step', { multiStep: true }, ['email']], ['unsupported_spa', { spa: true }, ['email']],
  ])('bloque %s', (code, signals, fields) => expect(detectUntestable(form(fields as string[]), signals)).toMatchObject({ testable: false, code }))
  it('autorise un formulaire simple', () => expect(detectUntestable(form(['email']))).toEqual({ testable: true }))
})
describe('signature et dédoublonnage', () => {
  const base = 'https://example.com/contact'
  it('stabilise la méthode, l’action et l’ordre des champs', () => {
    const data = form(['email', 'textarea'])
    expect(formSignature(data, base)).toBe(formSignature({ ...data, action: 'https://example.com/submit', method: 'POST', fields: [...data.fields].reverse() }, base))
  })
  it('ne correspond pas à un formulaire remplacé', () => {
    const first = form(['email']); const second = form(['email', 'password'])
    expect(matchFormBySignature([second], formSignature(first, base), base)).toBeUndefined()
  })
  it('retrouve le bon formulaire après changement d’ordre DOM', () => {
    const first = form(['email']); const second = form(['email', 'password'])
    expect(matchFormBySignature([second, first], formSignature(first, base), base)).toBe(first)
  })
  it('regroupe les pages sans masquer un CAPTCHA et sans muter la source', () => {
    const first: DiscoveredForm = { ...form(['email']), signature: 'same', formType: 'newsletter', testability: { testable: true }, occurrences: [{ pageUrl: base }] }
    const second: DiscoveredForm = { ...first, occurrences: [{ pageUrl: 'https://example.com/about' }], testability: { testable: false, code: 'captcha', reason: 'CAPTCHA' } }
    const result = deduplicateForms([first, second, first])
    expect(result).toHaveLength(1); expect(result[0].occurrences).toHaveLength(2)
    expect(result[0].testability.testable).toBe(false); expect(first.occurrences).toHaveLength(1)
  })
})
describe('validation de sélection', () => {
  const selected = { signature: 'a'.repeat(64), pageUrl: 'https://example.com/login', formType: 'login' }
  it('refuse le site tiers', () => expect(() => validateFormSelection([{ ...selected, pageUrl: 'https://evil.example/login' }], 'https://example.com')).toThrow())
  it('refuse les doublons et la sélection vide', () => {
    expect(() => validateFormSelection([selected, selected], 'https://example.com')).toThrow()
    expect(() => validateFormSelection([], 'https://example.com')).toThrow()
  })
  it('exige l’email de test avant une inscription', () => {
    expect(() => validateFormSelection([{ ...selected, formType: 'signup' }], 'https://example.com')).toThrow()
    expect(validateFormSelection([{ ...selected, formType: 'signup', testEmail: 'qualio-test-1791450000000@qualio-test.dev' }], 'https://example.com')[0].formType).toBe('signup')
  })
})
