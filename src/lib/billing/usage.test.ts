import { describe, expect, it } from 'vitest'
import { getUsageLevel } from './usage'

describe('getUsageLevel', () => {
  it('suit les seuils du doc 2.4', () => {
    expect(getUsageLevel(10, 50)).toBe('ok')
    expect(getUsageLevel(40, 50)).toBe('warn')
    expect(getUsageLevel(50, 50)).toBe('full')
    expect(getUsageLevel(60, 50)).toBe('full')
    expect(getUsageLevel(5, 0)).toBe('ok')
  })
})
