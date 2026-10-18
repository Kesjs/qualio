import { PRIORITY_LABELS, type ActionItem } from '@/lib/feedback/types'

export type TaskReview = { content: string; created_at?: string | null; source?: string | null }

const CONFIDENCE_LABELS = { high: 'élevée', medium: 'moyenne', low: 'faible' } as const

/** Une recommandation devient une tâche : titre, raison, avis cités, priorité. Texte brut, prêt à coller. */
export function buildTaskText(action: Pick<ActionItem, 'title' | 'action' | 'description' | 'rationale' | 'priority' | 'confidence' | 'theme' | 'feedback_ids'>, reviews: TaskReview[] = []): string {
  const detail = action.action ?? action.description
  const lines = [`Tâche : ${action.title}`]
  if (detail) lines.push('', detail)
  if (action.rationale) lines.push('', `Pourquoi : ${action.rationale}`)
  lines.push('', `Priorité : ${PRIORITY_LABELS[action.priority ?? 'medium']}`)
  if (action.confidence && action.confidence in CONFIDENCE_LABELS) lines.push(`Confiance : ${CONFIDENCE_LABELS[action.confidence]}`)
  if (action.theme) lines.push(`Thème : ${action.theme}`)
  lines.push(`Avis à l’appui : ${action.feedback_ids.length}`)
  if (reviews.length) {
    lines.push('', 'Avis cités :')
    for (const review of reviews) lines.push(`- « ${review.content.replace(/\s+/g, ' ').trim()} »`)
  }
  lines.push('', 'Envoyé depuis Qualio.')
  return lines.join('\n')
}

/** Lien mailto: objet et texte préremplis, ouvert dans la messagerie de la personne (aucun envoi par Qualio). */
export function buildMailto(action: Parameters<typeof buildTaskText>[0], reviews: TaskReview[] = []): string {
  const subject = `Tâche : ${action.title}`.slice(0, 120)
  let body = buildTaskText(action, reviews)
  // Les clients de messagerie tronquent les liens trop longs : on garde l'essentiel sous ~1 600 caractères.
  if (body.length > 1600) body = `${body.slice(0, 1580).trimEnd()}…\n\nEnvoyé depuis Qualio.`
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function csvCell(value: unknown) {
  let text = value == null ? '' : String(value)
  // Neutralise les formules de tableur (=, +, -, @) dans les cellules venant des avis.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n;\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export const TASK_CSV_HEADER = ['titre', 'action', 'raison', 'priorité', 'confiance', 'thème', 'statut', 'nombre_avis', 'avis_cités', 'proposée_le', 'décidée_le'] as const

const STATUS_LABELS: Record<ActionItem['status'], string> = { open: 'À décider', accepted: 'Acceptée', done: 'Faite', dismissed: 'Écartée' }

export function buildTasksCsv(rows: Array<{ action: ActionItem; reviews: TaskReview[] }>): string {
  const lines = rows.map(({ action, reviews }) => [
    action.title,
    action.action ?? action.description ?? '',
    action.rationale ?? '',
    PRIORITY_LABELS[action.priority ?? 'medium'],
    action.confidence ? CONFIDENCE_LABELS[action.confidence] : '',
    action.theme ?? '',
    STATUS_LABELS[action.status],
    action.feedback_ids.length,
    reviews.map((review) => review.content.replace(/\s+/g, ' ').trim()).join(' | '),
    action.created_at.slice(0, 10),
    action.decided_at ? action.decided_at.slice(0, 10) : '',
  ].map(csvCell).join(','))
  return `\uFEFF${[TASK_CSV_HEADER.join(','), ...lines].join('\n')}`
}
