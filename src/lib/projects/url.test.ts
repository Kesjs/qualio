import { describe, expect, it } from 'vitest'
import { normalizeProjectUrl, parseOptionalProjectUrl } from './url'

describe('parseOptionalProjectUrl', () => {
  it('traite une chaîne vide ou uniquement composée d’espaces comme absente', () => {
    expect(parseOptionalProjectUrl('')).toEqual({ url: null, error: null })
    expect(parseOptionalProjectUrl('   ')).toEqual({ url: null, error: null })
    expect(parseOptionalProjectUrl(null)).toEqual({ url: null, error: null })
  })

  it('préfixe https:// même quand le domaine commence par http (ex. httpbin.org)', () => {
    expect(parseOptionalProjectUrl('httpbin.org')).toEqual({
      url: 'https://httpbin.org',
      error: null,
    })
    expect(parseOptionalProjectUrl('HTTPS://Mon-Site.fr/')).toEqual({
      url: 'https://mon-site.fr',
      error: null,
    })
  })

  it('rejette les protocoles non web avec le bon message', () => {
    expect(parseOptionalProjectUrl('ftp://mon-site.com')).toEqual({
      url: null,
      error: 'L’URL doit commencer par http:// ou https://.',
    })
  })

  it('rejette localhost, IP locales et chaînes sans nom de domaine complet', () => {
    expect(parseOptionalProjectUrl('localhost:3000').url).toBeNull()
    expect(parseOptionalProjectUrl('http://127.0.0.1:8080').url).toBeNull()
    expect(parseOptionalProjectUrl('mon-site').url).toBeNull()
    expect(parseOptionalProjectUrl('mon-site').error).toContain('URL publique valide')
    expect(normalizeProjectUrl('app.tryqualio.pro/fr')).toBe('https://app.tryqualio.pro/fr')
  })
})
