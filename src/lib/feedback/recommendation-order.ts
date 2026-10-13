import type { ActionItem } from './types'

/** An open recommendation with decided_at was postponed, not accepted. */
export function orderPendingRecommendations<T extends Pick<ActionItem, 'priority' | 'created_at'> & { decided_at?: string | null }>(items: T[]) {
  const priorities = { high: 0, medium: 1, low: 2 }
  return [...items].sort((a, b) => {
    const postponed = Number(Boolean(a.decided_at)) - Number(Boolean(b.decided_at))
    if (postponed) return postponed
    if (a.decided_at && b.decided_at) return Date.parse(a.decided_at) - Date.parse(b.decided_at)
    return (priorities[a.priority ?? 'medium'] - priorities[b.priority ?? 'medium']) || Date.parse(b.created_at) - Date.parse(a.created_at)
  })
}
