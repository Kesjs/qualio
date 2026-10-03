import { afterEach, describe, expect, it } from 'vitest'
import { decryptSiteSecret, encryptSiteSecret, getSiteSecretName, isSiteSecretReference } from './site-secrets'

describe('site secrets', () => {
  const previous = process.env.SITE_SECRETS_ENCRYPTION_KEY

  afterEach(() => {
    if (previous === undefined) delete process.env.SITE_SECRETS_ENCRYPTION_KEY
    else process.env.SITE_SECRETS_ENCRYPTION_KEY = previous
  })

  it('encrypts and decrypts without storing the clear value', () => {
    process.env.SITE_SECRETS_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    const clear = 'test-password-42!'
    const encrypted = encryptSiteSecret(clear)
    expect(encrypted).not.toContain(clear)
    expect(decryptSiteSecret(encrypted)).toBe(clear)
  })

  it('recognizes only valid secret references', () => {
    expect(isSiteSecretReference('{{secret:LOGIN_PASSWORD}}')).toBe(true)
    expect(getSiteSecretName('{{secret:LOGIN_PASSWORD}}')).toBe('LOGIN_PASSWORD')
    expect(isSiteSecretReference('{{secret:login_password}}')).toBe(false)
    expect(isSiteSecretReference('plain text')).toBe(false)
  })
})
