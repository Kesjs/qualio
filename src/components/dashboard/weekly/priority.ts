import type { ActionItem } from '@/lib/feedback/types'

/** Seul tableau des couleurs de priorité (doc 3.9) : la couleur ne sert qu'à la priorité et aux alertes. */
export const PRIORITY = {
  high: { label: 'Priorité haute', rank: 0, chip: 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300', dot: 'bg-rose-600' },
  medium: { label: 'Priorité moyenne', rank: 1, chip: 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-300', dot: 'bg-amber-500' },
  low: { label: 'Priorité basse', rank: 2, chip: 'bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-zinc-300', dot: 'bg-gray-400' },
} as const

export type Priority = keyof typeof PRIORITY

export function priorityOf(value: ActionItem['priority']): Priority {
  return value ?? 'medium'
}

/** Recommandations à décider : par priorité, puis celles mises « Plus tard » à la fin, dans l'ordre où elles ont été reportées. */
export function orderRecommendations(actions: ActionItem[], postponedIds: string[]): ActionItem[] {
  const open = actions.filter((action) => action.status === 'open')
  const rank = (action: ActionItem) => PRIORITY[priorityOf(action.priority)].rank
  const active = open
    .map((action, index) => ({ action, index }))
    .filter(({ action }) => !postponedIds.includes(action.id))
    .sort((a, b) => rank(a.action) - rank(b.action) || a.index - b.index)
    .map(({ action }) => action)
  const later = postponedIds.map((id) => open.find((action) => action.id === id)).filter((action): action is ActionItem => Boolean(action))
  return [...active, ...later]
}
