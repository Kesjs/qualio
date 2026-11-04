import { describe, expect, it } from 'vitest'
import { decodeEscapes, extractEmails, extractReviewSources, isUsablePublicEmail, sameCompanyDomain } from '@/lib/admin/acquisition-scan'

describe('extraction des emails publics', () => {
  it('décode les échappements unicode au lieu de coller « u003e » devant l’adresse', () => {
    const html = '{"text":"\\u003econtact@vanksen.com\\u003c"}'
    expect(extractEmails(html)).toEqual(['contact@vanksen.com'])
    expect(decodeEscapes('\\u003e')).toBe('>')
  })

  it('rejette un reste d’échappement mal décodé', () => {
    expect(isUsablePublicEmail('u003econtact@vanksen.com')).toBe(false)
  })

  it('accepte hello@ et bonjour@ : ce sont de vraies adresses d’agences', () => {
    expect(isUsablePublicEmail('hello@zebrart.fr')).toBe(true)
    expect(isUsablePublicEmail('bonjour@oconnection.fr')).toBe(true)
  })

  it('écarte les boîtes RGPD, recrutement, presse et juridique', () => {
    for (const local of ['rgpd', 'dpo', 'privacy', 'job', 'jobs', 'recrutement', 'rh', 'careers', 'presse', 'juridique', 'dpo.france', 'jobs-paris']) {
      expect(isUsablePublicEmail(`${local}@intuiti.net`)).toBe(false)
    }
    expect(isUsablePublicEmail('contact@intuiti.net')).toBe(true)
  })

  it('trouve les adresses en mailto, brutes ou écrites avec &#64;', () => {
    const html = '<a href="mailto:hello@agence.fr?subject=x">écrire</a> <p>direction&#64;agence.fr</p>'
    expect(extractEmails(html).sort()).toEqual(['direction@agence.fr', 'hello@agence.fr'])
  })

  it('ignore les adresses techniques et les noreply', () => {
    expect(extractEmails('a@sentry.io noreply@agence.fr logo@2x.png')).toEqual([])
  })
})

describe('adresse du bon domaine', () => {
  it('accepte le même domaine, un sous-domaine ou une autre extension', () => {
    expect(sameCompanyDomain('contact@zebrart.fr', 'zebrart.fr')).toBe(true)
    expect(sameCompanyDomain('contact@mail.zebrart.fr', 'zebrart.fr')).toBe(true)
    expect(sameCompanyDomain('contact@zebrart.com', 'www.zebrart.fr')).toBe(true)
  })

  it('accepte la variante « group » du même nom', () => {
    expect(sameCompanyDomain('contact@webedia.com', 'webedia-group.com')).toBe(true)
    expect(sameCompanyDomain('contact@betclic.com', 'betclicgroup.com')).toBe(true)
    expect(sameCompanyDomain('contact@publicis.com', 'publicisgroupe.com')).toBe(true)
  })

  it('refuse l’adresse d’une autre entreprise', () => {
    expect(sameCompanyDomain('contact@lecollectiffreelance.fr', 'webedia-group.com')).toBe(false)
    expect(sameCompanyDomain('austria@nortal.com', 'skelia.com')).toBe(false)
    expect(sameCompanyDomain('agence@gmail.com', 'zebrart.fr')).toBe(false)
  })
})

describe('détection des pages d’avis publiques sur le site', () => {
  it('détecte App Store, Trustpilot et G2 dans le HTML', () => {
    const html = `
      <footer>
        <a href="https://apps.apple.com/fr/app/mon-saas/id1492837465">iOS</a>
        <a href="https://fr.trustpilot.com/review/mon-saas.fr">Trustpilot</a>
        <a href="https://www.g2.com/products/mon-saas">G2</a>
      </footer>
    `
    const sources = extractReviewSources(html)
    expect(sources.map((s) => s.type)).toEqual(['app_store', 'trustpilot', 'g2'])
  })
})
