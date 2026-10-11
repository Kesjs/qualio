/** Source unique des offres, prix et limites vérifiées côté serveur. */
export const BILLING_PLANS = {
  free: {
    label: 'Gratuit',
    priceEur: 0,
    projects: 1,
    monthlySyntheses: 1,
    monthlyFeedback: 500,
    priceEnv: null,
    features: ['1 projet', '1 synthèse par mois', 'Vos avis conservés', 'Import CSV et widget'],
  },
  pro: {
    label: 'Pro',
    priceEur: 19,
    projects: 5,
    monthlySyntheses: 12,
    monthlyFeedback: 5000,
    priceEnv: 'STRIPE_PRICE_PRO',
    features: ['14 jours d’essai sans carte', 'Synthèse automatique chaque semaine', 'Email du lundi', 'Suivi des recommandations', 'Jusqu’à 5 projets'],
  },
} as const

export const PRO_TRIAL_DAYS = 14
export type PaidPlan = Exclude<keyof typeof BILLING_PLANS, 'free'>
export type PlanId = keyof typeof BILLING_PLANS

export type SubscriptionForPlan = {
  plan?: unknown
  status?: unknown
  source?: unknown
  trial_ends_at?: string | null
  current_period_end?: string | null
}

export function isPaidPlan(value: unknown): value is PaidPlan {
  return value === 'pro'
}

function isExpired(value: string | null | undefined, now = Date.now()) {
  if (!value) return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp < now
}

export function resolvePlan(subscription: SubscriptionForPlan | null | undefined, now = Date.now()): PlanId {
  if (!subscription) return 'free'
  const status = String(subscription.status ?? '')
  if (!['active', 'trialing'].includes(status)) return 'free'

  const source = String(subscription.source ?? 'stripe')
  if (source === 'trial' && isExpired(subscription.trial_ends_at, now)) return 'free'
  if (source === 'manual' && isExpired(subscription.current_period_end, now)) return 'free'
  return subscription.plan === 'pro' ? 'pro' : 'free'
}

export function getPriceId(plan: PaidPlan) {
  const envKey = BILLING_PLANS[plan].priceEnv
  return envKey ? process.env[envKey] ?? '' : ''
}

export function getPlanFromPriceId(priceId: string | null | undefined) {
  if (priceId && priceId === process.env.STRIPE_PRICE_PRO) return 'pro' as const
  return 'free' as const
}
