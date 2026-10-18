/** Libellés, formats et petites règles pures de la console admin : aucun appel base, testables directement. */

export const FEEDBACK_STATUSES = ['new', 'in_progress', 'planned', 'done', 'declined', 'archived'] as const
export const FEEDBACK_PRIORITIES = ['low', 'normal', 'high'] as const
export const FEEDBACK_CATEGORIES = ['improvement', 'bug', 'difficulty', 'positive', 'other'] as const
export const EMAIL_STATUSES = ['pending', 'sent', 'failed', 'suppressed'] as const

export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number]
export type FeedbackPriority = (typeof FEEDBACK_PRIORITIES)[number]

/** Statuts qui demandent encore une décision ou une action de l'équipe. */
export const OPEN_FEEDBACK_STATUSES: readonly FeedbackStatus[] = ['new', 'in_progress', 'planned']

export const CATEGORY_LABELS: Record<string, string> = { improvement: 'Amélioration', bug: 'Bug', difficulty: 'Difficulté', positive: 'Positif', other: 'Autre' }
export const STATUS_LABELS: Record<string, string> = { new: 'Nouveau', in_progress: 'En cours', planned: 'Planifié', done: 'Traité', declined: 'Écarté', archived: 'Archivé' }
export const PRIORITY_LABELS: Record<string, string> = { low: 'Basse', normal: 'Normale', high: 'Haute' }
export const EMAIL_STATUS_LABELS: Record<string, string> = { pending: 'En attente', sent: 'Envoyé', failed: 'Échec', suppressed: 'Bloqué' }
export const EMAIL_TYPE_LABELS: Record<string, string> = {
  welcome: 'Bienvenue',
  activation_nudge: 'Relance : activation',
  project_nudge: 'Relance : projet sans avis',
  feedback_request: 'Demande de retour produit',
  decision_reminder: 'Relance : décision en attente',
  weekly_digest: 'Synthèse hebdomadaire',
  calm_digest: 'Synthèse calme',
  free_digest: 'Résumé plan Gratuit',
  alert: 'Alerte de thème',
  limit_reached: 'Limite atteinte',
  upgrade_confirmed: 'Passage Pro confirmé',
  payment_failed: 'Paiement échoué',
  subscription_ended: 'Abonnement terminé',
}

export function labelOf(map: Record<string, string>, key: string) {
  return map[key] ?? key
}

export function optionsOf(map: Record<string, string>, keys: readonly string[]) {
  return keys.map((value) => ({ value, label: labelOf(map, value) }))
}

const TIME_ZONE = 'Africa/Porto-Novo'
const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIME_ZONE })
const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE })
const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE })

function safeDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value: string | null | undefined) {
  const date = safeDate(value)
  return date ? dateFormat.format(date) : '—'
}

export function formatDateTime(value: string | null | undefined) {
  const date = safeDate(value)
  return date ? dateTimeFormat.format(date) : '—'
}

export function formatTime(value: Date | string) {
  const date = typeof value === 'string' ? safeDate(value) : value
  return date ? timeFormat.format(date) : '—'
}

export function excerpt(text: string, max = 160) {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean
}

export function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

export function pageCount(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize))
}

/** Page demandée dans l'URL : entier positif, 1 par défaut. */
export function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  const page = Number.parseInt(raw ?? '', 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

/** Valeur de filtre venue de l'URL : acceptée seulement si elle fait partie de la liste autorisée. */
export function parseFilter<T extends string>(value: string | string[] | undefined, allowed: readonly T[]): T | '' {
  const raw = Array.isArray(value) ? value[0] : value
  return allowed.includes(raw as T) ? (raw as T) : ''
}

export function parseText(value: string | string[] | undefined, max = 120) {
  const raw = Array.isArray(value) ? value[0] : value
  return (raw ?? '').trim().slice(0, max)
}

/** Construit une URL de liste en ignorant les paramètres vides. */
export function listHref(base: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '' || (key === 'page' && Number(value) <= 1)) continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `${base}?${query}` : base
}

/** Neutralise les caractères joker d'un terme injecté dans un filtre ilike. */
export function escapeLike(term: string) {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`)
}
