import { describe, expect, it } from 'vitest'
import { buildDraft, EXAMPLE_URL } from '@/lib/admin/acquisition-draft'

describe('brouillons de prospection', () => {
  it('premier mail : une seule demande, pas de faux signal', () => {
    const { subject, body } = buildDraft({ fullName: 'Léa', companyName: 'Maison Dubois', evidence: [{ label: 'Support client détecté', evidence: null, source_url: 'https://x.fr' }] })
    expect(['Une question sur vos retours clients', 'Une idée à partir de vos avis clients']).toContain(subject)
    expect(body).toContain('Bonjour Léa,')
    expect(body).toContain('l’analyse des avis publics de Maison Dubois')
    expect(body).toContain('Ça vous intéresse ?')
    expect(body).not.toContain('signal')
    expect(body).toContain('Maison Dubois')
    expect(body.match(/\?/g)).toHaveLength(1)
  })

  it('garde le même message clair même avec des éléments de crawl', () => {
    const draft = buildDraft({ companyName: 'Maison Dubois', evidence: [{ label: 'Avis ou témoignages détectés', evidence: null, source_url: 'https://x.fr' }] })
    expect(draft.body).not.toContain('signal public')
    expect(draft.body).toContain(EXAMPLE_URL)
  })

  it('agence : pitch multi-clients, une seule question', () => {
    const { subject, body } = buildDraft({ companyName: 'Pixel Studio', companyNotes: null })
    expect(subject).toBe('Un rapport de retours utilisateurs pour vos clients')
    expect(body).toContain('l’un des clients de Pixel Studio')
    expect(body).toContain(EXAMPLE_URL)
    expect(body.match(/\?/g)).toHaveLength(1)
  })

  it('rapport public (/rapport/[token]) : 3 thèmes, <= 110 mots, sans « derniers » ni « récents »', () => {
    const report = {
      url: 'https://tryqualio.pro/rapport/abc123456789012345678',
      reviewCount: 84,
      sourceLabel: 'App Store',
      subjectName: 'Swile',
      themes: [
        { name: 'Synchronisation bancaire et bugs de connexion', mentions: 28, negativeShare: 75 },
        { name: 'Notifications', mentions: 19, negativeShare: 60 },
        { name: 'Export comptable', mentions: 12, negativeShare: 50 },
      ],
      topQuote: 'Impossible de se connecter depuis la mise à jour, écrivez à test@swile.co',
    }
    const first = buildDraft({ fullName: 'Camille Dupont', companyName: 'Swile', report })
    expect(first.subject).toBe('Swile : 28 avis sur 84 parlent de synchronisation bancaire')
    expect(first.body).toContain('Bonjour Camille,')
    expect(first.body).toContain('que j’ai pu récupérer. Trois sujets reviennent :')
    expect(first.body).toContain('1. Synchronisation bancaire : 28 avis, dont 75 % critiques « ')
    expect(first.body).toContain('2. Notifications : 19 avis, dont 60 % critiques')
    expect(first.body).toContain('3. Export comptable : 12 avis, dont 50 % critiques')
    expect(first.body).not.toContain('test@swile.co')
    expect(first.body).toContain(report.url)
    expect(first.body).not.toContain(EXAMPLE_URL)
    expect(first.body.toLowerCase()).not.toContain('derniers')
    expect(first.body.toLowerCase()).not.toContain('récents')
    expect(first.body).not.toContain('?')
    const words = first.body.trim().split(/\s+/).length
    expect(words).toBeLessThanOrEqual(110)

    // Relance J+4 conserve le lien du rapport
    const follow = buildDraft({ fullName: 'Camille', companyName: 'Swile', followUpOf: { subject: first.subject }, report })
    expect(follow.subject).toBe(`Re: ${first.subject}`)
    expect(follow.body).toContain(report.url)
  })

  it('rapport public : cas à 1 et 2 thèmes, et autre source (Trustpilot)', () => {
    const oneTheme = buildDraft({
      fullName: null,
      companyName: 'PayFit',
      report: {
        url: 'https://tryqualio.pro/rapport/xyz123456789012345678',
        reviewCount: 42,
        sourceLabel: 'Trustpilot',
        subjectName: 'PayFit',
        themes: [{ name: 'Support client', mentions: 15, negativeShare: 40 }],
        topQuote: 'Réponse lente cette semaine',
      },
    })
    expect(oneTheme.subject).toBe('PayFit : 15 avis sur 42 parlent de support client')
    expect(oneTheme.body).toContain('42 avis Trustpilot de PayFit que j’ai pu récupérer. Un sujet revient :')
    expect(oneTheme.body).toContain('1. Support client : 15 avis, dont 40 % critiques « Réponse lente cette semaine »')
    expect(oneTheme.body).not.toContain('2.')
    expect(oneTheme.body.trim().split(/\s+/).length).toBeLessThanOrEqual(110)

    const twoThemes = buildDraft({
      fullName: 'Marc',
      companyName: 'Qlower',
      report: {
        url: 'https://tryqualio.pro/rapport/qlo123456789012345678',
        reviewCount: 30,
        sourceLabel: 'App Store',
        subjectName: 'Qlower',
        themes: [
          { name: 'Ergonomie', mentions: 11, negativeShare: 27 },
          { name: 'Tarifs', mentions: 9, negativeShare: 89 },
        ],
        topQuote: null,
      },
    })
    expect(twoThemes.body).toContain('Deux sujets reviennent :')
    expect(twoThemes.body).toContain('1. Ergonomie : 11 avis, dont 27 % critiques')
    expect(twoThemes.body).toContain('2. Tarifs : 9 avis, dont 89 % critiques')
    expect(twoThemes.body).not.toContain('3.')
    expect(twoThemes.body.trim().split(/\s+/).length).toBeLessThanOrEqual(110)
  })

  it('relance : lien exemple, propose de s’arrêter', () => {
    const { subject, body } = buildDraft({ fullName: null, companyName: 'Maison Dubois', followUpOf: { subject: 'Une question sur vos retours clients' } })
    expect(subject).toBe('Re: Une question sur vos retours clients')
    expect(body).toContain(EXAMPLE_URL)
    expect(body).toContain('avis d’exemple')
  })
})
