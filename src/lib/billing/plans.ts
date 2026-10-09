export const BILLING_PLANS = {
  free: { label: 'Gratuit', monthlySyntheses: 1, priceEnv: null },
  essential: { label: 'Essentiel', monthlySyntheses: 4, priceEnv: 'STRIPE_PRICE_ESSENTIAL' },
  pro: { label: 'Pro', monthlySyntheses: 12, priceEnv: 'STRIPE_PRICE_PRO' },
} as const

export type PaidPlan = Exclude<keyof typeof BILLING_PLANS, 'free'>

export function isPaidPlan(value: unknown): value is PaidPlan {
  return value === 'essential' || value === 'pro'
}

export function getPriceId(plan: PaidPlan) {
  const envKey = BILLING_PLANS[plan].priceEnv
  return envKey ? process.env[envKey] ?? '' : ''
}

export function getPlanFromPriceId(priceId: string | null | undefined) {
  if (priceId && priceId === process.env.STRIPE_PRICE_PRO) return 'pro' as const
  if (priceId && priceId === process.env.STRIPE_PRICE_ESSENTIAL) return 'essential' as const
  return 'free' as const
}
