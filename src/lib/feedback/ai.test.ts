import { describe, expect, it } from 'vitest'
import { cleanSynthesisResult } from './ai'

describe('feedback synthesis validation', () => {
  const ids = new Set(['a', 'b', 'c'])
  const base = { title: 'Synthèse', summary: 'Résumé', themes: [{ name: 'Onboarding', count: 99, insight: 'Signal', feedback_ids: ['a', 'invented'] }], recommendations: [{ title: 'Raccourcir', action: 'Raccourcir le parcours', theme: 'Onboarding', rationale: 'Deux avis concordent', priority: 'high', confidence: 'medium', uncertainty: 'Il manque des avis quantitatifs.', feedback_ids: ['a', 'b'] }] }

  it('removes invented ids and recalculates theme counts', () => {
    const result = cleanSynthesisResult(base, ids)
    expect(result?.themes[0].feedback_ids).toEqual(['a'])
    expect(result?.themes[0].count).toBe(1)
  })

  it('drops a recommendation sourced by fewer than two real avis', () => {
    const result = cleanSynthesisResult({ ...base, recommendations: [{ ...base.recommendations[0], feedback_ids: ['a', 'invented'] }] }, ids)
    expect(result?.recommendations).toHaveLength(0)
  })

  it('returns null for invalid JSON-shaped output', () => {
    expect(cleanSynthesisResult({ title: '', summary: '', themes: [], recommendations: [] }, ids)).toBeNull()
  })
})
