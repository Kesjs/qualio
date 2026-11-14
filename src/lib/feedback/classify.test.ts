import { afterEach, describe, expect, it, vi } from 'vitest'

const generateContent = vi.hoisted(() => vi.fn())

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(function GoogleGenAI() {
    return { models: { generateContent } }
  }),
  Type: { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING', NUMBER: 'NUMBER', INTEGER: 'INTEGER' },
}))

import { backfillThemesFromSynthesis, classifyPendingFeedback } from './classify'

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

type FakeRow = {
  id: string
  user_id: string
  content: string
  theme?: string | null
  sentiment: string | null
  metadata: Record<string, unknown>
}

function createFakeSupabase(rows: FakeRow[]) {
  const updates: Array<{ id: string; payload: Record<string, unknown> }> = []
  const queryLog: Array<{ mode: 'or' | 'is'; arg: unknown }> = []

  const supabase = {
    rpc: vi.fn(async () => ({ data: true, error: null })),
    from: vi.fn((table: string) => {
      expect(table).toBe('feedback_items')
      return {
        select: vi.fn((columns: string) => {
          if (columns.includes('user_id')) {
            const chain: any = {
              eq: () => chain,
              not: () => chain,
              is: (_col: string, val: unknown) => {
                queryLog.push({ mode: 'is', arg: val })
                return chain
              },
              or: (expr: string) => {
                queryLog.push({ mode: 'or', arg: expr })
                return chain
              },
              order: () => chain,
              limit: async () => ({
                data: rows.filter((row) =>
                  queryLog[queryLog.length - 1]?.mode === 'is'
                    ? row.sentiment === null
                    : row.sentiment === null || !row.theme,
                ),
              }),
            }
            return chain
          }
          if (columns === 'theme') {
            const chain: any = {
              eq: () => chain,
              not: () => chain,
              limit: async () => ({
                data: rows.filter((r) => Boolean(r.theme)).map((r) => ({ theme: r.theme })),
              }),
            }
            return chain
          }
          const chain: any = {
            eq: () => chain,
            in: async (_col: string, ids: string[]) => ({
              data: rows.filter((r) => ids.includes(r.id)),
            }),
          }
          return chain
        }),
        update: vi.fn((payload: Record<string, unknown>) => ({
          eq: (_col1: string, id: string) => ({
            eq: async () => {
              updates.push({ id, payload })
              return { error: null }
            },
          }),
        })),
      }
    }),
  }

  return { supabase: supabase as any, updates, queryLog }
}

describe('classifyPendingFeedback', () => {
  it('batches 25 pending reviews into 2 AI calls and preserves rating-derived sentiment', async () => {
    vi.stubEnv('FEEDBACK_AI_PROVIDER', 'gemini')
    vi.stubEnv('GEMINI_API_KEY', 'test-key')

    const rows: FakeRow[] = Array.from({ length: 25 }, (_, i) => ({
      id: `rev-${i + 1}`,
      user_id: 'user-1',
      content: `Retour utilisateur numéro ${i + 1} sur l’export`,
      theme: null,
      sentiment: i === 0 ? 'negative' : null,
      metadata: { classification_status: 'pending' },
    }))

    generateContent.mockImplementation(async (req: any) => {
      const payload = JSON.parse(req.contents[0].parts[0].text) as { avis: Array<{ id: string }> }
      return {
        text: JSON.stringify({
          items: payload.avis.map((item) => ({
            id: item.id,
            theme: 'Export PDF',
            sentiment: 'positive',
            confidence: 0.9,
          })),
        }),
      }
    })

    const { supabase, updates, queryLog } = createFakeSupabase(rows)
    const result = await classifyPendingFeedback(supabase, 'site-1', { limit: 40, batchSize: 20, concurrency: 1 })

    expect(result).toEqual({ classified: 25, remaining: 0, configured: true })
    expect(generateContent).toHaveBeenCalledTimes(2)
    expect(queryLog[0].mode).toBe('or')

    const firstUpdate = updates.find((u) => u.id === 'rev-1')
    expect(firstUpdate?.payload.sentiment).toBe('negative')
    expect(firstUpdate?.payload.theme).toBe('Export PDF')
    expect((firstUpdate?.payload.metadata as Record<string, unknown>)?.classification_status).toBe('classified')

    const secondUpdate = updates.find((u) => u.id === 'rev-2')
    expect(secondUpdate?.payload.sentiment).toBe('positive')
  })

  it('filters only missing sentiment when onlyMissingSentiment is true', async () => {
    vi.stubEnv('FEEDBACK_AI_PROVIDER', 'gemini')
    vi.stubEnv('GEMINI_API_KEY', 'test-key')

    const rows: FakeRow[] = [
      { id: 'rated-only', user_id: 'user-1', content: 'Déjà noté App Store', theme: null, sentiment: 'positive', metadata: {} },
      { id: 'unrated', user_id: 'user-1', content: 'Avis collé sans note', theme: null, sentiment: null, metadata: {} },
    ]

    generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        items: [{ id: 'unrated', theme: 'Performance', sentiment: 'neutral', confidence: 0.8 }],
      }),
    })

    const { supabase, updates, queryLog } = createFakeSupabase(rows)
    const result = await classifyPendingFeedback(supabase, 'site-1', { limit: 40, batchSize: 20, onlyMissingSentiment: true })

    expect(result).toEqual({ classified: 1, remaining: 0, configured: true })
    expect(queryLog[0]).toEqual({ mode: 'is', arg: null })
    expect(updates.map((u) => u.id)).toEqual(['unrated'])
  })
})

describe('backfillThemesFromSynthesis', () => {
  it('fills missing themes from synthesis citations without overwriting existing themes', async () => {
    const rows: FakeRow[] = [
      { id: 'r1', user_id: 'user-1', content: 'Bug export', theme: null, sentiment: 'negative', metadata: {} },
      { id: 'r2', user_id: 'user-1', content: 'Déjà classé', theme: 'Facturation', sentiment: 'neutral', metadata: {} },
      { id: 'r3', user_id: 'user-1', content: 'Lenteur mobile', theme: null, sentiment: null, metadata: {} },
    ]

    const { supabase, updates } = createFakeSupabase(rows)
    const updatedCount = await backfillThemesFromSynthesis(supabase, 'site-1', {
      title: 'Synthèse test',
      summary: 'Résumé',
      themes: [{ name: 'Export', count: 2, insight: 'Problème export', feedback_ids: ['r1', 'r2'] }],
      recommendations: [
        {
          title: 'Accélérer le mobile',
          action: 'Optimiser la liste',
          theme: 'Performance mobile',
          rationale: 'Plusieurs lenteurs',
          priority: 'high',
          confidence: 'medium',
          uncertainty: 'À confirmer',
          feedback_ids: ['r3'],
        },
      ],
    })

    expect(updatedCount).toBe(2)
    expect(generateContent).not.toHaveBeenCalled()
    expect(updates.find((u) => u.id === 'r1')?.payload).toEqual({
      theme: 'Export',
      metadata: { classification_status: 'classified' },
    })
    expect(updates.find((u) => u.id === 'r2')).toBeUndefined()
    expect(updates.find((u) => u.id === 'r3')?.payload).toEqual({
      theme: 'Performance mobile',
      metadata: {},
    })
  })
})
