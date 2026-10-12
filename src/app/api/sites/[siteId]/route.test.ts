import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { client, query } = vi.hoisted(() => {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(), update: vi.fn(), delete: vi.fn() }
  const client = { auth: { getUser: vi.fn() }, from: vi.fn() }
  return { client, query }
})

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: async () => client,
  getSupabaseAdminClient: vi.fn(() => client),
}))

import { GET } from './route'

describe('site detail', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    client.auth.getUser.mockResolvedValue({ data: { user: { id: 'owner' } } })
    client.from.mockReturnValue(query)
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.maybeSingle.mockResolvedValue({ data: { id: 'site', name: 'Mon projet', url: null }, error: null })
  })

  it('returns only the feedback project fields', async () => {
    const response = await GET(new NextRequest('http://localhost/api/sites/site'), { params: Promise.resolve({ siteId: 'site' }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: 'site', name: 'Mon projet', url: null })
    expect(query.select).toHaveBeenCalledWith('id, user_id, url, name, onboarding_method, created_at, updated_at')
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
