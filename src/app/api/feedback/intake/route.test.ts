import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { admin, query } = vi.hoisted(() => {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }
  const admin = { from: vi.fn() }
  return { admin, query }
})

vi.mock('@/lib/supabase/server', () => ({ getSupabaseAdminClient: () => admin }))

import { POST } from './route'

describe('public feedback intake', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    admin.from.mockReturnValue(query)
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
  })

  it('rejects an invalid public key', async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: null })
    const response = await POST(new NextRequest('http://localhost/api/feedback/intake', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: 'invented', content: 'Un avis' }) }))
    expect(response.status).toBe(403)
  })

  it('rejects a disabled public key', async () => {
    query.maybeSingle.mockResolvedValue({ data: { site_id: 'site', user_id: 'user', active: false }, error: null })
    const response = await POST(new NextRequest('http://localhost/api/feedback/intake', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: 'disabled', content: 'Un avis' }) }))
    expect(response.status).toBe(403)
  })

  it('rejects empty content before querying the database', async () => {
    const response = await POST(new NextRequest('http://localhost/api/feedback/intake', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: 'public', content: ' ' }) }))
    expect(response.status).toBe(400)
    expect(admin.from).not.toHaveBeenCalled()
  })
})
