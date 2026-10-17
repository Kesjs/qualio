/** Règles d'envoi pures : elles n'appellent aucune base, donc elles se testent directement. */

export const MARKETING_TYPES = ['weekly_digest', 'calm_digest', 'free_digest', 'alert', 'welcome', 'activation_nudge', 'feedback_request'] as const
export const WEEKLY_MARKETING_CAP = 3
export const FREE_DIGEST_MONTHLY_CAP = 2
export const FREE_DIGEST_MIN_NEW = 3

export function isMarketingType(type: string) {
  return (MARKETING_TYPES as readonly string[]).includes(type)
}

/** Email du lundi du plan Gratuit : seulement s'il reste une synthèse, assez d'avis, et moins de 2 emails ce mois-ci. */
export function shouldSendFreeDigest(input: { newCount: number; synthesesLeft: number; sentLast30Days: number; digestEnabled: boolean }) {
  return input.digestEnabled && input.newCount >= FREE_DIGEST_MIN_NEW && input.synthesesLeft > 0 && input.sentLast30Days < FREE_DIGEST_MONTHLY_CAP
}

/** Semaine ISO (ex. 2026-W42) : clé d'idempotence des emails hebdomadaires. */
export function isoWeekKey(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = start.getUTCDay() || 7
  start.setUTCDate(start.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(start.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((start.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${start.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
