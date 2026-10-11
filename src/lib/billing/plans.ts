/** Source unique des plans : landing, pricing et quotas serveur. */
export const BILLING_PLANS = {
  free: { label: 'Gratuit', priceEur: 0, projects: 1, monthlySyntheses: 1, priceEnv: null },
  essential: { label: 'Essentiel', priceEur: 9, projects: 1, monthlySyntheses: 4, priceEnv: 'STRIPE_PRICE_ESSENTIAL' },
  pro: { label: 'Pro', priceEur: 29, projects: 5, monthlySyntheses: 12, priceEnv: 'STRIPE_PRICE_PRO' },
} as const

export type PaidPlan = Exclude<keyof typeof BILLING_PLANS, 'free'>

export function isPaidPlan(value: unknown): value is PaidPlan {
  return value === 'essential' || value === 'pro'
}

export function normalizePlan(value: unknown) {
  const key = String(value ?? '').toLocaleLowerCase('fr-FR')
  if (key === 'essential' || key === 'essentiel') return 'essential' as const
  if (key === 'pro') return 'pro' as const
  return 'free' as const
}

export function resolvePlan(subscription: { plan?: unknown; status?: unknown } | null | undefined) {
  const active = subscription?.status === 'active' || subscription?.status === 'trialing'
  return active ? normalizePlan(subscription?.plan) : 'free' as const
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
