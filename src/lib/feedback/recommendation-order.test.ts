import { describe, expect, it } from 'vitest'
import { orderPendingRecommendations } from './recommendation-order'

const item = (id: string, priority: 'high' | 'medium' | 'low', decided_at: string | null = null) => ({ id, priority, decided_at, created_at: '2026-10-13T08:00:00Z' })

describe('weekly recommendation order', () => {
  it('promotes the next recommendation after postponing the first', () => {
    const actions = [item('first', 'high', '2026-10-13T09:00:00Z'), item('next', 'medium')]
    expect(orderPendingRecommendations(actions).map((row) => row.id)).toEqual(['next', 'first'])
    expect(actions[0].id).toBe('first')
  })
  it('keeps highest priority first among recommendations not postponed', () => {
    expect(orderPendingRecommendations([item('low', 'low'), item('high', 'high')])[0].id).toBe('high')
  })
  it('rotates postponed recommendations by their last postponement', () => {
    expect(orderPendingRecommendations([item('newer', 'high', '2026-10-13T10:00:00Z'), item('older', 'low', '2026-10-13T09:00:00Z')]).map((row) => row.id)).toEqual(['older', 'newer'])
  })
})
