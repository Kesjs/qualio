import { describe, expect, it } from 'vitest'
import { buildMailto, buildTaskText, buildTasksCsv } from './task-text'
import { redactPersonalInfo } from './redact'
import type { ActionItem } from './types'

const action: ActionItem = {
  id: 'a1', title: 'Raccourcir le formulaire', description: null, action: 'Passer à 3 champs', rationale: 'Trop de champs à remplir',
  confidence: 'high', status: 'accepted', priority: 'high', theme: 'Inscription', feedback_ids: ['1', '2', '3'], created_at: '2026-10-01T10:00:00Z', decided_at: '2026-10-05T10:00:00Z',
}
const reviews = [{ content: 'Le formulaire est trop long.' }, { content: 'J’ai abandonné à la deuxième page.' }]

describe('tâche partageable', () => {
  it('le texte contient titre, raison, priorité, confiance et avis cités', () => {
    const text = buildTaskText(action, reviews)
    expect(text).toContain('Tâche : Raccourcir le formulaire')
    expect(text).toContain('Pourquoi : Trop de champs à remplir')
    expect(text).toContain('Priorité : Haute')
    expect(text).toContain('Confiance : élevée')
    expect(text).toContain('« Le formulaire est trop long. »')
  })

  it('mailto : objet et texte préremplis, texte tronqué si trop long', () => {
    const url = buildMailto(action, reviews)
    expect(url.startsWith('mailto:?subject=')).toBe(true)
    expect(decodeURIComponent(url)).toContain('Tâche : Raccourcir le formulaire')
    const long = buildMailto(action, Array.from({ length: 5 }, () => ({ content: 'x'.repeat(500) })))
    expect(decodeURIComponent(long.split('&body=')[1]).length).toBeLessThan(1700)
  })

  it('CSV : en-tête, avis cités et neutralisation des formules de tableur', () => {
    const csv = buildTasksCsv([{ action, reviews: [{ content: '=HYPERLINK("http://x")' }, { content: 'Avis, avec virgule' }] }])
    const [header, row] = csv.replace('\uFEFF', '').split('\n')
    expect(header).toContain('titre,action,raison')
    expect(row).toContain("'=HYPERLINK")
    expect(row).toContain('Avis, avec virgule')
    expect(row).toContain('Haute')
  })
})

describe('avis sur page publique', () => {
  it('masque e-mails, liens et téléphones', () => {
    const text = redactPersonalInfo('Écrivez à marie.dupont@mail.fr ou appelez le +33 6 12 34 56 78, voir https://site.fr/x')
    expect(text).not.toContain('marie.dupont')
    expect(text).not.toContain('12 34 56')
    expect(text).not.toContain('https://')
    expect(text).toContain('[e-mail masqué]')
  })

  it('garde le texte normal et les petits nombres', () => {
    expect(redactPersonalInfo('3 champs sur 12, livré en 48 h')).toBe('3 champs sur 12, livré en 48 h')
  })
})
