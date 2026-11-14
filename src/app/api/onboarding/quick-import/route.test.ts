import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { client, admin, getUserPlan, getFeedbackCapacity, isSiteWritable, fetchAppStoreReviews, insertSelect } = vi.hoisted(() => ({
  client: { auth: { getUser: vi.fn() }, from: vi.fn() },
  admin: { from: vi.fn() },
  getUserPlan: vi.fn(),
  getFeedbackCapacity: vi.fn(),
  isSiteWritable: vi.fn(),
  fetchAppStoreReviews: vi.fn(),
  insertSelect: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: async () => client,
  getSupabaseAdminClient: () => admin,
}))

vi.mock('@/lib/billing/limits', () => ({
  getUserPlan,
  getFeedbackCapacity,
  isSiteWritable,
  READ_ONLY_MESSAGE: 'Projet en lecture seule.',
}))

vi.mock('@/lib/admin/acquisition-reviews', async () => {
  const actual = await vi.importActual<typeof import('@/lib/admin/acquisition-reviews')>('@/lib/admin/acquisition-reviews')
  return {
    ...actual,
    fetchAppStoreReviews,
  }
})

import { POST } from './route'

describe('onboarding quick-import route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    client.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    getUserPlan.mockResolvedValue('free')
    isSiteWritable.mockResolvedValue(true)
    getFeedbackCapacity.mockResolvedValue({ limit: 50, used: 0, remaining: 50 })

    client.from.mockImplementation((table: string) => {
      if (table === 'sites') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: { id: 'site-1' } }),
              }),
            }),
          }),
        }
      }
      if (table === 'feedback_items') {
        return {
          insert: (rows: unknown[]) => ({
            select: async () => insertSelect(rows),
          }),
        }
      }
      throw new Error(`Unexpected table ${table}`)
    })

    admin.from.mockImplementation((table: string) => {
      if (table === 'sites') {
        return {
          update: () => ({
            eq: () => ({
              eq: async () => ({ error: null }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected admin table ${table}`)
    })

    insertSelect.mockImplementation((rows: unknown[]) => ({
      data: rows.map((_, i) => ({ id: `f-${i}`, site_id: 'site-1', content: 'avis' })),
      error: null,
    }))
  })

  it('caps App Store onboarding imports to 15 reviews so Free users keep capacity', async () => {
    const fiftyReviews = Array.from({ length: 50 }, (_, i) => ({
      id: `rev-${i}`,
      title: `Titre ${i}`,
      content: `Un avis client assez long numéro ${i}`,
      rating: 4,
      created_at: '2026-11-14T00:00:00Z',
    }))
    fetchAppStoreReviews.mockResolvedValueOnce(fiftyReviews)

    const response = await POST(
      new NextRequest('http://localhost/api/onboarding/quick-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: 'site-1', source: 'app_store', appId: '123456789', country: 'fr' }),
      }),
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.imported).toBe(15)
    expect(body.overflow).toBe(35)
    expect(body.limit).toBe(50)
    expect(body.onboardingLimit).toBe(15)
    expect(body.onboardingMethod).toBe('import')
    expect(insertSelect).toHaveBeenCalledTimes(1)
    expect(insertSelect.mock.calls[0][0]).toHaveLength(15)
  })

  it('caps pasted onboarding imports to 15 reviews even when more are pasted', async () => {
    const pasted = Array.from(
      { length: 24 },
      (_, i) => `Voici un retour utilisateur complet et détaillé numéro ${i + 1}.`,
    ).join('\n\n')

    const response = await POST(
      new NextRequest('http://localhost/api/onboarding/quick-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: 'site-1', source: 'pasted', text: pasted }),
      }),
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.imported).toBe(15)
    expect(body.overflow).toBe(9)
    expect(insertSelect.mock.calls[0][0]).toHaveLength(15)
  })
})
