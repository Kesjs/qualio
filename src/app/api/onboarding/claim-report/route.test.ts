import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { client, admin, persistRecommendations } = vi.hoisted(() => ({
  client: { auth: { getUser: vi.fn() }, from: vi.fn() },
  admin: { from: vi.fn() },
  persistRecommendations: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: async () => client,
  getSupabaseAdminClient: () => admin,
}))

vi.mock('@/lib/feedback/persist-recommendations', () => ({
  persistRecommendations,
}))

import { GET, POST } from './route'

const SAMPLE_REPORT = {
  title: 'Priorités Alma',
  summary: 'Résumé court',
  reviewCount: 2,
  model: 'gemini-3.8-flash',
  themes: [{ name: 'Export', mentions: 2, insight: 'Lent' }],
  problems: [
    {
      title: 'Accélérer export',
      action: 'Optimiser PDF',
      theme: 'Export',
      rationale: 'Deux retours',
      priority: 'high',
      confidence: 'medium',
      quotes: [{ text: 'Export lent sur mobile', rating: 2 }, { text: 'PDF bloqué', rating: 1 }],
    },
  ],
}

describe('claim-report route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    client.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('GET returns canClaim: false when user already reached project limit', async () => {
    client.from.mockImplementation((table: string) => {
      if (table === 'sites') {
        return {
          select: () => ({
            eq: async () => ({ count: 1 }),
          }),
        }
      }
      throw new Error(`Unexpected client table ${table}`)
    })

    admin.from.mockImplementation((table: string) => {
      if (table === 'acquisition_reports') {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          is: () => chain,
          maybeSingle: async () => ({
            data: {
              subject_name: 'Alma App',
              source_label: 'App Store',
              review_count: 25,
              report: SAMPLE_REPORT,
            },
          }),
        }
        return chain
      }
      if (table === 'billing_subscriptions') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected admin table ${table}`)
    })

    const response = await GET(new NextRequest('http://localhost/api/onboarding/claim-report?token=abcd1234efgh5678'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      found: true,
      subjectName: 'Alma App',
      sourceLabel: 'App Store',
      reviewCount: 25,
      problemCount: 1,
      canClaim: false,
      planLabel: 'Gratuit',
      projectCount: 1,
      projectLimit: 1,
    })
  })

  it('POST rolls back created site, feedback and synthesis when recommendation persistence fails', async () => {
    const deleted: Array<{ table: string; id: string }> = []
    persistRecommendations.mockRejectedValueOnce(new Error('DB constraint failure'))

    client.from.mockImplementation((table: string) => {
      if (table === 'sites') {
        return {
          select: () => ({
            eq: async () => ({ count: 0 }),
          }),
        }
      }
      throw new Error(`Unexpected client table ${table}`)
    })

    admin.from.mockImplementation((table: string) => {
      if (table === 'acquisition_reports') {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          is: () => chain,
          maybeSingle: async () => ({
            data: {
              subject_name: 'Alma App',
              source: 'pasted',
              source_label: 'Avis collés',
              source_url: 'https://alma.app',
              report: SAMPLE_REPORT,
            },
          }),
        }
        return chain
      }
      if (table === 'billing_subscriptions') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null }),
            }),
          }),
        }
      }
      if (table === 'sites') {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: 'site-created', name: 'Alma App' }, error: null }),
            }),
          }),
          delete: () => ({
            eq: (_c1: string, id: string) => ({
              eq: async () => {
                deleted.push({ table: 'sites', id })
                return { error: null }
              },
            }),
          }),
        }
      }
      if (table === 'feedback_items') {
        return {
          insert: () => ({
            select: async () => ({ data: [{ id: 'f1' }, { id: 'f2' }], error: null }),
          }),
          delete: () => ({
            eq: (_c1: string, id: string) => ({
              eq: async () => {
                deleted.push({ table: 'feedback_items', id })
                return { error: null }
              },
            }),
          }),
        }
      }
      if (table === 'feedback_syntheses') {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: 'syn-created' }, error: null }),
            }),
          }),
          delete: () => ({
            eq: (_c1: string, id: string) => ({
              eq: async () => {
                deleted.push({ table: 'feedback_syntheses', id })
                return { error: null }
              },
            }),
          }),
        }
      }
      throw new Error(`Unexpected admin table ${table}`)
    })

    const response = await POST(
      new NextRequest('http://localhost/api/onboarding/claim-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'abcd1234efgh5678' }),
      }),
    )

    expect(response.status).toBe(500)
    expect(deleted).toEqual([
      { table: 'feedback_syntheses', id: 'syn-created' },
      { table: 'feedback_items', id: 'site-created' },
      { table: 'sites', id: 'site-created' },
    ])
  })
})
