/** Source unique des offres, prix et limites vérifiées côté serveur (doc, chapitre 2). */
export const BILLING_PLANS = {
  free: {
    label: 'Gratuit',
    priceEur: 0,
    annualPriceEur: null,
    priceEnv: null,
    annualPriceEnv: null,
    projects: 1,
    /** Avis conservés (non archivés) par projet. */
    feedbackPerProject: 50,
    /** Quota de synthèses manuelles par projet sur une fenêtre glissante. */
    synthesisQuota: { count: 2, windowDays: 30 },
    synthesisCooldownHours: 0,
    /** Le widget sert de point d'entrée au Gratuit ; l'analyse reste limitée par le quota. */
    widget: true,
    // Texte affiché sur la landing et la page tarifs (doc 4.2). Les limites réellement appliquées sont les champs ci-dessus.
    features: ['1 projet', '50 avis analysés', '2 synthèses manuelles sur 30 jours', 'Widget, import CSV et saisie manuelle', 'Avis reçus conservés en attente', 'Partage de tâches : copie, e-mail, CSV'],
  },
  pro: {
    label: 'Pro',
    priceEur: 19,
    annualPriceEur: 190,
    priceEnv: 'STRIPE_PRICE_PRO',
    annualPriceEnv: 'STRIPE_PRICE_PRO_ANNUAL',
    projects: 5,
    feedbackPerProject: 2000,
    synthesisQuota: null,
    // 1 synthèse manuelle par jour et par projet, en plus de la synthèse automatique hebdomadaire.
    synthesisCooldownHours: 24,
    widget: true,
    features: ['5 projets', '2 000 avis par projet', 'Synthèse automatique chaque semaine', 'Analyse des avis reçus en attente', 'Email du lundi', 'Historique des décisions', 'Évolution des avis 14 jours après vos décisions', 'Partage de tâches par lien et PDF'],
  },
  agency: {
    label: 'Agence',
    priceEur: 49,
    annualPriceEur: 490,
    priceEnv: 'STRIPE_PRICE_AGENCY',
    annualPriceEnv: 'STRIPE_PRICE_AGENCY_ANNUAL',
    projects: 15,
    feedbackPerProject: 10000,
    /** L'Agence garde au moins la cadence Pro, avec ses capacités multi-clients. */
    synthesisQuota: null,
    synthesisCooldownHours: 24,
    widget: true,
    features: [
      '15 projets clients',
      '10 000 avis par projet',
      'Synthèse automatique chaque semaine',
      '1 synthèse manuelle par jour et par projet',
      'Widget sur 15 sites',
      'Partage de tâches par lien et PDF',
      'Rapport client partageable par lien',
      'Export CSV des avis',
      'Support prioritaire',
    ],
  },
} as const

/** Avis du widget reçus au-delà de la limite du plan, conservés mais non analysés (plafond anti-abus). */
export const LOCKED_FEEDBACK_MAX = 100

export type PaidPlan = Exclude<keyof typeof BILLING_PLANS, 'free'>
export type PlanId = keyof typeof BILLING_PLANS
export type BillingInterval = 'month' | 'year'

export type SubscriptionForPlan = {
  plan?: unknown
  status?: unknown
  source?: unknown
  current_period_end?: string | null
}

export function isPaidPlan(value: unknown): value is PaidPlan {
  return value === 'pro' || value === 'agency'
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === 'month' || value === 'year'
}

function isExpired(value: string | null | undefined, now = Date.now()) {
  if (!value) return false
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) && timestamp < now
}

/**
 * Plan réellement appliqué. Il n'y a plus d'essai Pro : sans abonnement, c'est Gratuit.
 * « trialing » reste toléré uniquement pour un abonnement Stripe (essai créé à la main dans Stripe).
 */
export function resolvePlan(subscription: SubscriptionForPlan | null | undefined, now = Date.now()): PlanId {
  if (!subscription) return 'free'
  const status = String(subscription.status ?? '')
  if (!['active', 'trialing'].includes(status)) return 'free'

  const source = String(subscription.source ?? 'stripe')
  if (source === 'manual' && isExpired(subscription.current_period_end, now)) return 'free'
  if (subscription.plan === 'agency') return 'agency'
  if (subscription.plan === 'pro') return 'pro'
  return 'free'
}

export function getPriceId(plan: PaidPlan, interval: BillingInterval = 'month') {
  const envKey = interval === 'year' ? BILLING_PLANS[plan].annualPriceEnv : BILLING_PLANS[plan].priceEnv
  return envKey ? process.env[envKey] ?? '' : ''
}

export function getPlanFromPriceId(priceId: string | null | undefined) {
  if (!priceId) return 'free' as const
  if (priceId === process.env.STRIPE_PRICE_AGENCY || priceId === process.env.STRIPE_PRICE_AGENCY_ANNUAL) return 'agency' as const
  if (priceId === process.env.STRIPE_PRICE_PRO || priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) return 'pro' as const
  return 'free' as const
}

export function getIntervalFromPriceId(priceId: string | null | undefined): BillingInterval | null {
  if (!priceId) return null
  if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL || priceId === process.env.STRIPE_PRICE_AGENCY_ANNUAL) return 'year'
  if (priceId === process.env.STRIPE_PRICE_PRO || priceId === process.env.STRIPE_PRICE_AGENCY) return 'month'
  return null
}

/** Date à partir de laquelle une nouvelle synthèse manuelle est possible (null = dès maintenant). */
export function nextSynthesisAt(plan: PlanId, lastManualSynthesisAt: string | null | undefined, now = Date.now()): string | null {
  if (!lastManualSynthesisAt) return null
  const cooldown = BILLING_PLANS[plan].synthesisCooldownHours
  if (cooldown <= 0) return null
  const last = Date.parse(lastManualSynthesisAt)
  if (!Number.isFinite(last)) return null
  const next = last + cooldown * 3600_000
  return next > now ? new Date(next).toISOString() : null
}
