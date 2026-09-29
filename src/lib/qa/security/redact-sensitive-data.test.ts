import { describe, expect, it } from 'vitest'
import { REDACTED, redactSensitiveData } from './redact-sensitive-data'

describe('redactSensitiveData', () => {
  it('redacts nested secret fields without mutating safe fields', () => {
    const result = redactSensitiveData({
      headers: { Authorization: 'Bearer secret-token', cookie: 'session=abc', accept: 'application/json' },
      body: { password: 'hunter2', profile: { name: 'Qualio' } },
    }) as Record<string, unknown>
    expect(result).toEqual({
      headers: { Authorization: REDACTED, cookie: REDACTED, accept: 'application/json' },
      body: { password: REDACTED, profile: { name: 'Qualio' } },
    })
  })

  it('redacts sensitive URL parameters', () => {
    const result = redactSensitiveData('https://example.com/callback?access_token=abc&next=%2Fdashboard')
    expect(result).toContain('access_token=%5BREDACTED%5D')
    expect(result).toContain('next=%2Fdashboard')
    expect(result).not.toContain('abc')
  })
})
