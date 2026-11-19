import { describe, expect, it } from 'vitest'
import { filterAppStoreBatch, parseAppStoreWebReviews, type AppStoreApp } from '@/lib/admin/acquisition-reviews'

const makeApp = (overrides: Partial<AppStoreApp>): AppStoreApp => ({
  id: '1',
  name: 'App',
  seller: 'Seller',
  icon: null,
  rating: 4.0,
  ratingCount: 100,
  url: 'https://apps.apple.com/fr/app/id1',
  sellerUrl: 'https://example-app.fr',
  ...overrides,
})

describe('filterAppStoreBatch', () => {
  it('garde uniquement les apps entre 3.4 et 4.4 avec domaine éditeur valide et dédoublonne par domaine', () => {
    const apps: AppStoreApp[] = [
      makeApp({ id: '1', name: 'Trop bien notée', rating: 4.8, sellerUrl: 'https://perfect.fr' }),
      makeApp({ id: '2', name: 'Trop mal notée', rating: 2.9, sellerUrl: 'https://bad.fr' }),
      makeApp({ id: '3', name: 'Cible 1', rating: 3.4, ratingCount: 50, sellerUrl: 'https://www.cible1.fr/contact' }),
      makeApp({ id: '4', name: 'Doublon même éditeur', rating: 4.1, ratingCount: 80, sellerUrl: 'https://cible1.fr/autre-app' }),
      makeApp({ id: '5', name: 'Réseau social', rating: 3.9, sellerUrl: 'https://linkedin.com/company/x' }),
      makeApp({ id: '6', name: 'Peu de notes', rating: 4.0, ratingCount: 5, sellerUrl: 'https://small.fr' }),
      makeApp({ id: '7', name: 'Cible 2', rating: 4.4, ratingCount: 25, sellerUrl: 'https://cible2.com' }),
    ]

    const filtered = filterAppStoreBatch(apps, { minRating: 3.4, maxRating: 4.4, minRatingCount: 20, limit: 20 })
    expect(filtered.map((a) => a.id)).toEqual(['3', '7'])
    expect(filtered[0].publisherDomain).toBe('cible1.fr')
    expect(filtered[1].publisherDomain).toBe('cible2.com')
  })
})

describe('parseAppStoreWebReviews', () => {
  it('extrait les avis depuis serialized-server-data', () => {
    const html = `<html><body><script type="application/json" id="serialized-server-data">${JSON.stringify({
      data: [
        {
          $kind: 'Review',
          id: '991',
          title: 'Bug export',
          contents: 'L export PDF plante depuis la mise à jour',
          rating: 2,
          date: '2026-10-01T10:00:00.000Z',
        },
      ],
    })}</script></body></html>`

    const reviews = parseAppStoreWebReviews(html)
    expect(reviews).toHaveLength(1)
    expect(reviews[0]).toMatchObject({
      id: '991',
      title: 'Bug export',
      content: 'L export PDF plante depuis la mise à jour',
      rating: 2,
    })
  })
})
