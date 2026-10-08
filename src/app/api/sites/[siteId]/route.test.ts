import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { client, query } = vi.hoisted(() => {
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), single: vi.fn() }
  const client = { auth: { getUser: vi.fn() }, from: vi.fn() }
  return { client, query }
})

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: async () => client,
  getSupabaseAdminClient: vi.fn(),
}))

import { GET } from './route'

describe('site detail on the deployed scan schema', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    client.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner' } } })
    client.from.mockReturnValue(query)
    query.select.mockImplementation((columns: string) => {
      // Simulate PostgREST validating the deployed schema before reading rows.
      query.single.mockResolvedValue(columns.includes('monitor_triggered')
        ? { data: null, error: { code: '42703', message: 'column scans.monitor_triggered does not exist' } }
        : { data: { id: 'site', scans: [] }, error: null })
      return query
    })
    query.eq.mockReturnValue(query)
    query.order.mockReturnValue(query)
  })

  it('returns the site with a schema that has no monitor_triggered column', async () => {
    const response = await GET(new NextRequest('http://localhost/api/sites/site'), { params: Promise.resolve({ siteId: 'site' }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: 'site', scans: [] })
    expect(query.eq).toHaveBeenCalledWith('id', 'site')
    expect(query.eq).toHaveBeenCalledWith('user_id', 'owner')
  })

  it('rejects unauthenticated requests before querying sites', async () => {
    client.auth.getUser.mockResolvedValue({ data: { user: null } })
    const response = await GET(new NextRequest('http://localhost/api/sites/site'), { params: Promise.resolve({ siteId: 'site' }) })
    expect(response.status).toBe(401)
    expect(client.from).not.toHaveBeenCalled()
  })
})
