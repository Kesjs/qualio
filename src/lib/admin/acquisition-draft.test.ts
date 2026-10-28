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
    expect(body.match(/\?/g)).toBeNull()
  })

  it('garde le même message clair même avec des éléments de crawl', () => {
    const draft = buildDraft({ companyName: 'Maison Dubois', evidence: [{ label: 'Avis ou témoignages détectés', evidence: null, source_url: 'https://x.fr' }] })
    expect(draft.body).not.toContain('signal public')
    expect(draft.body).toContain(EXAMPLE_URL)
  })

  it('relance : lien exemple, propose de s’arrêter', () => {
    const { subject, body } = buildDraft({ fullName: null, companyName: 'Maison Dubois', followUpOf: { subject: 'Une question sur vos retours clients' } })
    expect(subject).toBe('Re: Une question sur vos retours clients')
    expect(body).toContain(EXAMPLE_URL)
    expect(body).toContain('avis d’exemple')
  })
})
