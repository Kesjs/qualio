import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { db, items, recommendation } = vi.hoisted(() => {
  const items: Record<string, any> = { select: vi.fn(), eq: vi.fn(), order: vi.fn(), range: vi.fn(), neq: vi.fn(), in: vi.fn() }
  const recommendation: Record<string, any> = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }
  return { db: { from: vi.fn() }, items, recommendation }
})
vi.mock('@/lib/supabase/auth', () => ({ getAuthedContext: async () => ({ supabase: db, userId: 'owner' }) }))
import { GET } from './route'

describe('source feedback filtering', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    db.from.mockImplementation((table: string) => table === 'feedback_recommendations' ? recommendation : items)
    for (const method of ['select', 'eq', 'order', 'range', 'neq']) items[method].mockReturnValue(items)
    recommendation.select.mockReturnValue(recommendation)
    recommendation.eq.mockReturnValue(recommendation)
    items.in.mockResolvedValue({ data: [{ id: 'proof', status: 'archived' }], count: 1, error: null })
  })
  it('loads only the source IDs of the owned recommendation and includes archived evidence', async () => {
    recommendation.maybeSingle.mockResolvedValue({ data: { feedback_ids: ['proof'] }, error: null })
    const response = await GET(new NextRequest('http://localhost/api/feedback/list?siteId=site&recommendation=rec&status=all'))
    expect(response.status).toBe(200)
    expect(items.in).toHaveBeenCalledWith('id', ['proof'])
    expect(items.neq).not.toHaveBeenCalled()
    expect(recommendation.eq).toHaveBeenCalledWith('site_id', 'site')
    expect(recommendation.eq).toHaveBeenCalledWith('user_id', 'owner')
    expect((await response.json()).items[0].id).toBe('proof')
  })
  it('does not expose source IDs for a missing or unowned recommendation', async () => {
    recommendation.maybeSingle.mockResolvedValue({ data: null, error: null })
    const response = await GET(new NextRequest('http://localhost/api/feedback/list?siteId=site&recommendation=other'))
    expect(response.status).toBe(404)
    expect(items.in).not.toHaveBeenCalled()
  })
  it('includes archived feedback when the all status is selected', async () => {
    const response = await GET(new NextRequest('http://localhost/api/feedback/list?siteId=site&status=all'))
    expect(response.status).toBe(200)
    expect(items.neq).not.toHaveBeenCalled()
    expect(items.eq).toHaveBeenCalledWith('user_id', 'owner')
    expect(items.eq).toHaveBeenCalledWith('site_id', 'site')
  })
  it('returns no feedback for a recommendation without cited feedback', async () => {
    recommendation.maybeSingle.mockResolvedValue({ data: { feedback_ids: [] }, error: null })
    const response = await GET(new NextRequest('http://localhost/api/feedback/list?siteId=site&recommendation=empty'))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ items: [], total: 0 })
    expect(items.select).not.toHaveBeenCalled()
  })
  it('reports a failed recommendation lookup instead of returning unrelated feedback', async () => {
    recommendation.maybeSingle.mockResolvedValue({ data: null, error: { message: 'Unavailable' } })
    const response = await GET(new NextRequest('http://localhost/api/feedback/list?siteId=site&recommendation=rec'))
    expect(response.status).toBe(500)
    expect(items.select).not.toHaveBeenCalled()
  })
})
