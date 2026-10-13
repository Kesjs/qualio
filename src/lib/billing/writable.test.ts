import { describe, expect, it } from 'vitest'
import { writableSiteIds } from './writable'

const sites = [
  { id: 'recent', created_at: '2026-10-10T10:00:00Z' },
  { id: 'oldest', created_at: '2026-01-01T10:00:00Z' },
  { id: 'middle', created_at: '2026-05-01T10:00:00Z' },
]

describe('writableSiteIds', () => {
  it('garde les projets les plus anciens, dans la limite du plan', () => {
    expect(writableSiteIds(sites, 1)).toEqual(['oldest'])
    expect(writableSiteIds(sites, 2)).toEqual(['oldest', 'middle'])
  })

  it('garde tout quand la limite couvre tous les projets', () => {
    expect(writableSiteIds(sites, 5)).toHaveLength(3)
    expect(writableSiteIds([], 1)).toEqual([])
  })
})
