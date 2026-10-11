import { describe, expect, it } from 'vitest'
import { isDuplicateIntakeEvent, isIntakeRateLimited, validateIntakeBody } from './intake-validation'

describe('feedback intake validation', () => {
  it('rejects empty and oversized content', () => {
    expect(validateIntakeBody({ key: 'public', content: ' ' }, 100)).toContain('vide')
    expect(validateIntakeBody({ key: 'public', content: 'a'.repeat(2001) }, 2100)).toContain('2000')
    expect(validateIntakeBody({ key: 'public', content: 'ok' }, 10 * 1024 + 1)).toContain('volumineux')
  })

  it('accepts a normal payload and ignores a filled honeypot', () => {
    expect(validateIntakeBody({ key: 'public', content: 'Un avis utile', authorName: 'A' }, 100)).toBeNull()
    expect(validateIntakeBody({ honeypot: 'bot', key: 'public', content: 'Un avis utile' }, 100)).toBeNull()
  })

  it('applies both rate-limit dimensions and duplicate detection', () => {
    expect(isIntakeRateLimited(10, 0)).toBe(true)
    expect(isIntakeRateLimited(1, 200)).toBe(true)
    expect(isIntakeRateLimited(9, 199)).toBe(false)
    expect(isDuplicateIntakeEvent({ id: 'event' })).toBe(true)
    expect(isDuplicateIntakeEvent(null)).toBe(false)
  })
})
