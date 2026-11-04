import { describe, expect, it } from 'vitest'
import { buildDraft, EXAMPLE_URL } from '@/lib/admin/acquisition-draft'

describe('brouillons de prospection', () => {
  it('premier mail : une seule demande, pas de faux signal', () => {
    const { subject, body } = buildDraft({ fullName: 'Léa', companyName: 'Maison Dubois', evidence: [{ label: 'Support client détecté', evidence: null, source_url: 'https://x.fr' }] })
    expect(['Une question sur vos retours clients', 'Une idée à partir de vos avis clients']).toContain(subject)
    expect(body).toContain('Bonjour Léa,')
    expect(body).toContain('une première analyse des avis publics')
    expect(body).toContain('aperçu personnalisé, sans engagement')
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

  it('rapport public (/rapport/[token]) : valeur d’abord, sans pitch générique', () => {
    const report = {
      url: 'https://tryqualio.pro/rapport/abc123456789012345678',
      reviewCount: 84,
      sourceLabel: 'App Store',
      subjectName: 'Swile',
      topProblem: { title: 'Déconnexion après mise à jour iOS', mentions: 14 },
      problemCount: 3,
    }
    const first = buildDraft({ fullName: 'Camille', companyName: 'Swile', report })
    expect(first.subject).toBe('84 avis App Store de Swile, lus pour vous')
    expect(first.body).toContain('Déconnexion après mise à jour iOS')
    expect(first.body).toContain(report.url)
    expect(first.body).not.toContain(EXAMPLE_URL)
    expect(first.body.match(/\?/g)).toHaveLength(1)

    const follow = buildDraft({ fullName: 'Camille', companyName: 'Swile', followUpOf: { subject: first.subject }, report })
    expect(follow.subject).toBe(`Re: ${first.subject}`)
    expect(follow.body).toContain(report.url)
  })

  it('relance : lien exemple, propose de s’arrêter', () => {
    const { subject, body } = buildDraft({ fullName: null, companyName: 'Maison Dubois', followUpOf: { subject: 'Une question sur vos retours clients' } })
    expect(subject).toBe('Re: Une question sur vos retours clients')
    expect(body).toContain(EXAMPLE_URL)
    expect(body).toContain('avis d’exemple')
  })
})
