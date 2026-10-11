import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { client, query } = vi.hoisted(() => {
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), maybeSingle: vi.fn(), update: vi.fn() }
  const client = { auth: { getUser: vi.fn() }, from: vi.fn() }
  return { client, query }
})

vi.mock('@/lib/supabase/server', () => ({ getSupabaseServerClient: async () => client }))

import { PATCH } from './route'

describe('feedback recommendations PATCH', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    client.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-a' } } })
    client.from.mockReturnValue(query)
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query); query.order.mockReturnValue(query); query.update.mockReturnValue(query)
  })

  it('rejects an invalid status before writing', async () => {
    const response = await PATCH(new NextRequest('http://localhost/api/feedback/recommendations', { method: 'PATCH', body: JSON.stringify({ id: 'rec', siteId: 'site', status: 'unknown' }) }))
    expect(response.status).toBe(400)
    expect(query.update).not.toHaveBeenCalled()
  })

  it('does not let a user update another user project', async () => {
    query.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const response = await PATCH(new NextRequest('http://localhost/api/feedback/recommendations', { method: 'PATCH', body: JSON.stringify({ id: 'rec', siteId: 'other-site', status: 'accepted' }) }))
    expect(response.status).toBe(404)
    expect(query.update).not.toHaveBeenCalled()
  })

  it('updates an owned recommendation to a valid status', async () => {
    query.maybeSingle.mockResolvedValueOnce({ data: { id: 'site' }, error: null }).mockResolvedValueOnce({ data: { id: 'rec', status: 'accepted' }, error: null })
    const response = await PATCH(new NextRequest('http://localhost/api/feedback/recommendations', { method: 'PATCH', body: JSON.stringify({ id: 'rec', siteId: 'site', status: 'accepted' }) }))
    expect(response.status).toBe(200)
    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'accepted', decided_at: expect.any(String) }))
  })
})
