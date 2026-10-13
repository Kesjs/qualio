export type UsageLevel = 'ok' | 'warn' | 'full'

/** Doc 2.4 : barre neutre sous 80 %, orange dès 80 %, rouge à 100 %. */
export function getUsageLevel(used: number, limit: number): UsageLevel {
  if (limit <= 0) return 'ok'
  const ratio = used / limit
  if (ratio >= 1) return 'full'
  if (ratio >= 0.8) return 'warn'
  return 'ok'
}
