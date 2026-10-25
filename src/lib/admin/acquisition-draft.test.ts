import { describe, expect, it } from 'vitest'
import { buildDraft, EXAMPLE_URL } from '@/lib/admin/acquisition-draft'

describe('brouillons de prospection', () => {
  it('premier mail : une seule demande, pas de faux signal', () => {
    const { subject, body } = buildDraft({ fullName: 'Léa', companyName: 'Maison Dubois', evidence: [{ label: 'Support client détecté', evidence: null, source_url: 'https://x.fr' }] })
    expect(subject).toBe('Une question sur vos retours clients')
    expect(body).toContain('Bonjour Léa,')
    expect(body).toContain('répondez simplement « oui »')
    expect(body).not.toContain('signal')
    expect(body).not.toContain('J’ai vu que')
    expect(body.match(/\?/g)).toBeNull()
  })

  it('reste générique et honnête même si des signaux existent', () => {
    const draft = buildDraft({ companyName: 'Maison Dubois', evidence: [{ label: 'Avis ou témoignages détectés', evidence: null, source_url: 'https://x.fr' }] })
    expect(draft.body).not.toContain('J’ai vu que')
    expect(draft.body).toContain(EXAMPLE_URL)
  })

  it('relance : lien exemple, propose de s’arrêter', () => {
    const { subject, body } = buildDraft({ fullName: null, companyName: 'Maison Dubois', followUpOf: { subject: 'Une question sur vos retours clients' } })
    expect(subject).toBe('Re: Une question sur vos retours clients')
    expect(body).toContain(EXAMPLE_URL)
    expect(body).toContain('avis d’exemple')
  })
})
