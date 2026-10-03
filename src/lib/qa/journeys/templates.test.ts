import { describe, expect, it } from 'vitest'
import { getJourneyCoverage, getJourneyTemplates } from './templates'

describe('journey templates', () => {
  it('provides P0 templates for supported verticals', () => {
    expect(getJourneyTemplates('saas').some((template) => template.name === 'Connexion' && template.priority === 'P0')).toBe(true)
    expect(getJourneyTemplates('ecommerce').some((template) => template.name === 'Recherche produit')).toBe(true)
  })

  it('keeps the Master Prompt vertical library complete', () => {
    const required = {
      saas: ['saas-login', 'saas-signup', 'saas-create-core', 'saas-forgot-password', 'saas-upgrade', 'saas-invite'],
      ecommerce: ['ecommerce-search', 'ecommerce-product', 'ecommerce-cart', 'ecommerce-payment', 'ecommerce-promo', 'ecommerce-tracking'],
      booking: ['booking-availability', 'booking-complete', 'booking-cancel'],
      marketing: ['marketing-contact', 'marketing-primary-cta', 'marketing-calendar', 'marketing-legal'],
      media: ['media-search', 'media-reading', 'media-newsletter', 'media-pagination'],
      marketplace: ['marketplace-search', 'marketplace-product', 'marketplace-contact', 'marketplace-payment'],
      other: ['other-primary-cta'],
    } as const

    for (const [vertical, ids] of Object.entries(required)) {
      expect(getJourneyTemplates(vertical as keyof typeof required).map((template) => template.id)).toEqual(expect.arrayContaining([...ids]))
    }
  })

  it('calculates missing critical journeys', () => {
    const login = getJourneyTemplates('saas').find((template) => template.name === 'Connexion')!
    const coverage = getJourneyCoverage([login], 'saas')
    expect(coverage.configured).toBe(1)
    expect(coverage.total).toBe(3)
    expect(coverage.missing.map((template) => template.name)).toContain('Inscription')
  })
})
