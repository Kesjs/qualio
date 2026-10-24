import { afterEach, describe, expect, it, vi } from 'vitest'

const generateContent = vi.hoisted(() => vi.fn())

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(function GoogleGenAI() { return { models: { generateContent } } }),
  Type: { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING', INTEGER: 'INTEGER' },
}))

import { cleanSynthesisResult, generateFeedbackSynthesis } from './ai'

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

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

  it('keeps a synthesis that has valid recommendations but no theme', () => {
    const result = cleanSynthesisResult({ ...base, themes: [] }, ids)
    expect(result?.recommendations).toHaveLength(1)
    expect(result?.themes).toHaveLength(0)
  })

  it('returns null for invalid JSON-shaped output', () => {
    expect(cleanSynthesisResult({ title: '', summary: '', themes: [], recommendations: [] }, ids)).toBeNull()
  })

  it('falls back when the configured Gemini model is temporarily unavailable', async () => {
    vi.stubEnv('FEEDBACK_AI_PROVIDER', 'gemini')
    vi.stubEnv('GEMINI_API_KEY', 'test-key')
    vi.stubEnv('GEMINI_FEEDBACK_MODEL', 'gemini-3.8-flash')
    generateContent
      .mockRejectedValueOnce(new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}'))
      .mockResolvedValueOnce({
        text: JSON.stringify({
          title: 'Synthèse',
          summary: 'Résumé',
          themes: [{ name: 'Onboarding', insight: 'Signal', feedback_ids: ['a', 'b'] }],
          recommendations: [{ title: 'Raccourcir', action: 'Raccourcir le parcours', theme: 'Onboarding', rationale: 'Deux avis concordent', priority: 'high', confidence: 'medium', uncertainty: 'À confirmer.', feedback_ids: ['a', 'b'] }],
        }),
        usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 },
      })

    const result = await generateFeedbackSynthesis([
      { id: 'a', content: 'Premier avis', created_at: new Date().toISOString() },
      { id: 'b', content: 'Deuxième avis', created_at: new Date().toISOString() },
      { id: 'c', content: 'Troisième avis', created_at: new Date().toISOString() },
    ])

    expect(generateContent).toHaveBeenCalledTimes(2)
    expect(generateContent.mock.calls[0][0].model).toBe('gemini-3.8-flash')
    expect(generateContent.mock.calls[1][0].model).toBe('gemini-3.6-flash')
    expect(result?._meta?.model).toBe('gemini-3.6-flash')
  })
})
