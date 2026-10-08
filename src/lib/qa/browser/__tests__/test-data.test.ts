import { describe, it, expect } from 'vitest'
import { createSignupTestEmail, isHoneypot, testDataForField } from '../test-data'
import { loginCredentialsForPage } from '../login-credentials'
import type { FieldInfo, JourneyDefinition } from '../../types'

const field = (type: string, name = type): FieldInfo => ({ type, name, label: null, required: true })
describe('données de test', () => {
  it('génère un email identifiable et déterministe', () => expect(createSignupTestEmail(1791450000000)).toBe('qualio-test-1791450000000@qualio-test.dev'))
  it('réutilise exactement l’email approuvé', () => expect(testDataForField(field('email'), { formType: 'signup', email: 'qualio-test-1791450000000@qualio-test.dev' })).toBe('qualio-test-1791450000000@qualio-test.dev'))
  it('fournit les identifiants de test sans les remplacer', () => expect(testDataForField(field('password'), { formType: 'login', password: 'configured' })).toBe('configured'))
  it('marque le message comme test Qualio', () => expect(testDataForField(field('textarea'), { formType: 'contact' })).toContain('[TEST QUALIO]'))
  it.each([{ type: 'hidden', name: 'csrf' }, { type: 'text', name: 'honeypot' }, { type: 'text', name: 'website', hidden: true }, { type: 'text', name: 'bot_check' }])('ignore %s', input => expect(isHoneypot(input)).toBe(true))
  it('préserve un champ visible normal', () => expect(isHoneypot(field('text', 'website'))).toBe(false))
})
describe('identifiants des journeys', () => {
  it('résout uniquement les références du parcours de la même page', () => {
    const journey: JourneyDefinition = { name: 'Login', startUrl: 'https://example.com/login', steps: [
      { name: 'Email', action: { type: 'fill', target: '[name=email]', value: '{{secret:LOGIN_EMAIL}}' } },
      { name: 'Password', action: { type: 'fill', target: '[name=password]', value: '{{secret:LOGIN_PASSWORD}}' } },
    ] }
    const secrets = new Map([['LOGIN_EMAIL', 'test@example.com'], ['LOGIN_PASSWORD', 'configured']])
    expect(loginCredentialsForPage([journey], secrets, 'https://example.com/other')).toBeUndefined()
    // Site secret syntax is validated by the existing resolver.
    const credentials = loginCredentialsForPage([], new Map([['TEST_EMAIL', 'test@example.com'], ['TEST_PASSWORD', 'configured']]), 'https://example.com/login')
    expect(credentials?.password).toBe('configured')
  })
})
