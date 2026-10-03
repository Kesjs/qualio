import { describe, expect, it } from 'vitest'
import { getJourneyCoverage, getJourneyTemplates } from './templates'

describe('journey templates', () => {
  it('provides P0 templates for supported verticals', () => {
    expect(getJourneyTemplates('saas').some((template) => template.name === 'Connexion' && template.priority === 'P0')).toBe(true)
    expect(getJourneyTemplates('ecommerce').some((template) => template.name === 'Recherche produit')).toBe(true)
  })

  it('calculates missing critical journeys', () => {
    const login = getJourneyTemplates('saas').find((template) => template.name === 'Connexion')!
    const coverage = getJourneyCoverage([login], 'saas')
    expect(coverage.configured).toBe(1)
    expect(coverage.total).toBe(2)
    expect(coverage.missing.map((template) => template.name)).toContain('Inscription')
  })
})
