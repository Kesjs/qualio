import { afterEach, describe, expect, it } from 'vitest'
import { BILLING_PLANS, getIntervalFromPriceId, getPlanFromPriceId, getPriceId, isBillingInterval, nextSynthesisAt, resolvePlan } from './plans'

describe('billing plans', () => {
  const now = Date.parse('2026-10-13T12:00:00.000Z')
  const saved = { month: process.env.STRIPE_PRICE_PRO, year: process.env.STRIPE_PRICE_PRO_ANNUAL }

  afterEach(() => {
    if (saved.month === undefined) delete process.env.STRIPE_PRICE_PRO; else process.env.STRIPE_PRICE_PRO = saved.month
    if (saved.year === undefined) delete process.env.STRIPE_PRICE_PRO_ANNUAL; else process.env.STRIPE_PRICE_PRO_ANNUAL = saved.year
  })

  it('exposes only the decided free and pro offers', () => {
    expect(Object.keys(BILLING_PLANS)).toEqual(['free', 'pro'])
    expect(BILLING_PLANS.pro.priceEur).toBe(19)
    expect(BILLING_PLANS.pro.annualPriceEur).toBe(190)
  })

  it('applies the limits written in the document', () => {
    expect(BILLING_PLANS.free).toMatchObject({ projects: 1, feedbackPerProject: 50, synthesisCooldownHours: 336, widget: false })
    expect(BILLING_PLANS.pro).toMatchObject({ projects: 5, feedbackPerProject: 2000, synthesisCooldownHours: 24, widget: true })
  })

  it('has no trial: no subscription means free', () => {
    expect(resolvePlan(null, now)).toBe('free')
    expect(resolvePlan({ plan: 'pro', status: 'canceled', source: 'stripe' }, now)).toBe('free')
    expect(resolvePlan({ plan: 'pro', status: 'active', source: 'stripe' }, now)).toBe('pro')
  })

  it('expires manual access by its period end', () => {
    expect(resolvePlan({ plan: 'pro', status: 'active', source: 'manual', current_period_end: '2026-10-10T00:00:00.000Z' }, now)).toBe('free')
    expect(resolvePlan({ plan: 'pro', status: 'active', source: 'manual', current_period_end: '2026-10-20T00:00:00.000Z' }, now)).toBe('pro')
  })

  it('reads monthly and annual Stripe prices', () => {
    process.env.STRIPE_PRICE_PRO = 'price_month'
    process.env.STRIPE_PRICE_PRO_ANNUAL = 'price_year'
    expect(getPriceId('pro', 'month')).toBe('price_month')
    expect(getPriceId('pro', 'year')).toBe('price_year')
    expect(getPlanFromPriceId('price_month')).toBe('pro')
    expect(getPlanFromPriceId('price_year')).toBe('pro')
    expect(getPlanFromPriceId('price_other')).toBe('free')
    expect(getIntervalFromPriceId('price_year')).toBe('year')
    expect(getIntervalFromPriceId('price_month')).toBe('month')
    expect(getIntervalFromPriceId('price_other')).toBeNull()
  })

  it('validates the billing interval', () => {
    expect(isBillingInterval('month')).toBe(true)
    expect(isBillingInterval('year')).toBe(true)
    expect(isBillingInterval('week')).toBe(false)
  })

  it('computes the next possible synthesis', () => {
    expect(nextSynthesisAt('free', null, now)).toBeNull()
    expect(nextSynthesisAt('free', '2026-10-10T12:00:00.000Z', now)).toBe('2026-10-24T12:00:00.000Z')
    expect(nextSynthesisAt('free', '2026-09-20T12:00:00.000Z', now)).toBeNull()
    expect(nextSynthesisAt('pro', '2026-10-13T06:00:00.000Z', now)).toBe('2026-10-14T06:00:00.000Z')
    expect(nextSynthesisAt('pro', '2026-10-12T06:00:00.000Z', now)).toBeNull()
  })
})
