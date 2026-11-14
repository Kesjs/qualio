import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { client, admin } = vi.hoisted(() => ({
  client: { auth: { getUser: vi.fn() }, from: vi.fn() },
  admin: { from: vi.fn() },
}))

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: async () => client,
  getSupabaseAdminClient: () => admin,
}))

import { GET } from './route'

describe('billing status route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    client.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('exposes hasCompletedOnboarding: true when at least one site completed onboarding', async () => {
    client.from.mockImplementation((table: string) => {
      if (table === 'billing_subscriptions') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: { plan: 'pro', status: 'active', source: 'stripe', current_period_end: null },
              }),
            }),
          }),
        }
      }
      if (table === 'sites') {
        return {
          select: () => ({
            eq: async () => ({
              data: [
                { id: 's1', created_at: '2026-10-01T00:00:00Z', onboarding_completed_at: '2026-10-01T01:00:00Z' },
                { id: 's2', created_at: '2026-10-02T00:00:00Z', onboarding_completed_at: null },
              ],
            }),
          }),
        }
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const response = await GET(new NextRequest('http://localhost/api/billing/status'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.hasCompletedOnboarding).toBe(true)
    expect(body.usage.projects).toBe(2)
    expect(body.plan).toBe('pro')
  })

  it('exposes hasCompletedOnboarding: false when no site completed onboarding', async () => {
    client.from.mockImplementation((table: string) => {
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
          select: () => ({
            eq: async () => ({
              data: [{ id: 's1', created_at: '2026-10-01T00:00:00Z', onboarding_completed_at: null }],
            }),
          }),
        }
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const response = await GET(new NextRequest('http://localhost/api/billing/status'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.hasCompletedOnboarding).toBe(false)
    expect(body.limits.widget).toBe(true)
  })
})
