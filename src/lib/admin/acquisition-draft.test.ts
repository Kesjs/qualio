import { describe, expect, it } from 'vitest'
import { buildDraft, EXAMPLE_URL } from '@/lib/admin/acquisition-draft'

describe('brouillons de prospection', () => {
  it('premier mail : une seule demande, pas de faux signal', () => {
    const { subject, body } = buildDraft({ fullName: 'Léa', companyName: 'Maison Dubois', evidence: [{ label: 'Support client détecté', evidence: null, source_url: 'https://x.fr' }] })
    expect(subject).toBe('Vos avis clients chez Maison Dubois')
    expect(body).toContain('Bonjour Léa,')
    expect(body).toContain('Ça vous intéresse ?')
    expect(body).not.toContain('signal')
    expect(body).not.toContain('J’ai vu que')
    expect(body.match(/\?/g)).toHaveLength(1)
  })

  it('ajoute une accroche seulement si le site montre des avis ou du feedback', () => {
    const reviews = buildDraft({ companyName: 'Maison Dubois', evidence: [{ label: 'Avis ou témoignages détectés', evidence: null, source_url: 'https://x.fr' }] })
    expect(reviews.body).toContain('J’ai vu que Maison Dubois affiche des avis clients sur son site.')
    const feedback = buildDraft({ companyName: 'Maison Dubois', evidence: [{ label: 'Collecte de feedback détectée', evidence: null, source_url: 'https://x.fr' }] })
    expect(feedback.body).toContain('invite ses clients à donner leur avis')
  })

  it('relance : lien exemple, propose de s’arrêter', () => {
    const { subject, body } = buildDraft({ fullName: null, companyName: 'Maison Dubois', followUpOf: { subject: 'Vos avis clients chez Maison Dubois' } })
    expect(subject).toBe('Re: Vos avis clients chez Maison Dubois')
    expect(body).toContain(EXAMPLE_URL)
    expect(body).toContain('avis d’exemple')
  })
})
