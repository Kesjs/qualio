import { describe, expect, it } from 'vitest'
import { BILLING_PLANS, resolvePlan } from './plans'

describe('billing plans', () => {
  const now = Date.parse('2026-10-11T12:00:00.000Z')

  it('exposes only the decided free and pro offers', () => {
    expect(Object.keys(BILLING_PLANS)).toEqual(['free', 'pro'])
    expect(BILLING_PLANS.pro.priceEur).toBe(19)
  })

  it('keeps an unexpired trial as pro', () => {
    expect(resolvePlan({ plan: 'pro', status: 'trialing', source: 'trial', trial_ends_at: '2026-10-20T00:00:00.000Z' }, now)).toBe('pro')
  })

  it('expires a Qualio trial but not a real Stripe period', () => {
    expect(resolvePlan({ plan: 'pro', status: 'trialing', source: 'trial', trial_ends_at: '2026-10-01T00:00:00.000Z' }, now)).toBe('free')
    expect(resolvePlan({ plan: 'pro', status: 'trialing', source: 'stripe', trial_ends_at: '2026-10-01T00:00:00.000Z' }, now)).toBe('pro')
  })

  it('expires manual access by its period end', () => {
    expect(resolvePlan({ plan: 'pro', status: 'active', source: 'manual', current_period_end: '2026-10-10T00:00:00.000Z' }, now)).toBe('free')
    expect(resolvePlan({ plan: 'pro', status: 'active', source: 'manual', current_period_end: '2026-10-20T00:00:00.000Z' }, now)).toBe('pro')
  })
})
