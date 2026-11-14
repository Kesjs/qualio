import { describe, expect, it } from 'vitest'
import { analyzePastedReviews, appStoreIdFrom, parseAppStoreFeed, parsePastedReviews } from '@/lib/admin/acquisition-reviews'
import { assembleReport, quoteExcerpt, reportHook } from '@/lib/admin/acquisition-report'

describe('sources d’avis publics', () => {
  it('extrait un identifiant App Store depuis une URL ou un nombre', () => {
    expect(appStoreIdFrom('https://apps.apple.com/fr/app/pennylane/id1568473921?l=fr')).toBe('1568473921')
    expect(appStoreIdFrom('1568473921')).toBe('1568473921')
    expect(appStoreIdFrom('https://tryqualio.pro')).toBeNull()
  })

  it('parse le flux RSS JSON Apple et ignore l’entrée métadonnée sans note', () => {
    const feed = {
      feed: {
        entry: [
          { id: { label: 'meta' }, title: { label: 'MonApp' } },
          {
            id: { label: 'r1' },
            title: { label: 'Export cassé' },
            content: { label: 'Impossible d’exporter en CSV depuis la mise à jour.' },
            'im:rating': { label: '2' },
            updated: { label: '2026-10-15T10:00:00Z' },
          },
        ],
      },
    }
    const reviews = parseAppStoreFeed(feed)
    expect(reviews).toHaveLength(1)
    expect(reviews[0]).toMatchObject({ id: 'r1', rating: 2, title: 'Export cassé' })
  })

  it('parse des avis collés (Trustpilot / G2 / Capterra) avec détection des étoiles', () => {
    const raw = [
      '2/5\nL’export comptable plante dès que le fichier dépasse deux cents lignes.',
      '★★★★☆\nBon support client mais le temps de chargement sur mobile reste lent.',
      'Trop court',
    ].join('\n\n')
    const parsed = parsePastedReviews(raw)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].rating).toBe(2)
    expect(parsed[1].rating).toBe(4)

    const analyzed = analyzePastedReviews(raw)
    expect(analyzed.reviews).toHaveLength(2)
    expect(analyzed.ignoredShortCount).toBe(1)
  })
})

describe('assemblage du rapport prospect (/rapport/[token])', () => {
  it('masque emails et téléphones dans les verbatims et recompte les avis réellement cités', () => {
    expect(quoteExcerpt('Écrivez-moi sur jean.dupont@client.fr ou au +33 6 12 34 56 78 !')).toBe(
      'Écrivez-moi sur [email] ou au [numéro] !',
    )

    const reviews = [
      { id: 'p1', content: 'Export CSV lent et plante souvent.', rating: 1, title: null, created_at: '2026-10-01T10:00:00Z' },
      { id: 'p2', content: 'Le bouton export CSV mouline 30 secondes.', rating: 2, title: null, created_at: '2026-10-02T10:00:00Z' },
      { id: 'p3', content: 'Interface claire au quotidien.', rating: 5, title: null, created_at: '2026-10-03T10:00:00Z' },
    ]
    const report = assembleReport(reviews, {
      title: 'Synthèse',
      summary: 'Résumé factuel.',
      themes: [{ name: 'Export CSV', count: 99, insight: 'Lenteur sur gros volumes', feedback_ids: ['p1', 'p2'] }],
      recommendations: [
        {
          title: 'Fiabiliser l’export CSV',
          action: 'Passer l’export en tâche asynchrone au-delà de 200 lignes.',
          theme: 'Export CSV',
          rationale: 'Deux clients signalent des blocages.',
          priority: 'high',
          confidence: 'high',
          uncertainty: 'Volume exact non précisé.',
          feedback_ids: ['p1', 'p2', 'id-inexistant'],
        },
      ],
    })

    // Le serveur recompte uniquement les vrais IDs existants (2, jamais le 99 inventé par l'IA)
    expect(report.themes[0].mentions).toBe(2)
    expect(report.problems[0].mentions).toBe(2)
    expect(report.negativeCount).toBe(2)
    expect(reportHook(report, 'App Store').finding).toContain('Fiabiliser l’export CSV')
  })
})

