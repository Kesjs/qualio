/**
 * Effet d'une décision : compare le nombre d'avis sur le thème dans les 14 jours avant et les 14 jours
 * après la décision. C'est une tendance, pas une preuve de causalité.
 */
export const EFFECT_WINDOW_MS = 14 * 86_400_000
export const EFFECT_MIN_COUNT = 3

export type Effect =
  | { locked: true; label: string }
  | { locked: false; beforeCount: number; afterCount: number; changePercent: number | null; label: string; concluded: boolean }

export function computeEffect(input: { beforeCount: number; afterCount: number; decidedAt: string; now?: number }): Effect {
  const now = input.now ?? Date.now()
  const decided = Date.parse(input.decidedAt)
  const { beforeCount, afterCount } = input
  if (!Number.isFinite(decided) || now - decided < EFFECT_WINDOW_MS) {
    return { locked: false, beforeCount, afterCount, changePercent: null, label: 'Trop tôt pour conclure (il faut 14 jours après la décision)', concluded: false }
  }
  if (beforeCount < EFFECT_MIN_COUNT) {
    return { locked: false, beforeCount, afterCount, changePercent: null, label: `Pas assez d’avis avant la décision pour comparer (${beforeCount} sur 14 jours)`, concluded: false }
  }
  const changePercent = Math.round(((afterCount - beforeCount) / beforeCount) * 100)
  return {
    locked: false,
    beforeCount,
    afterCount,
    changePercent,
    label: `${beforeCount} avis les 14 jours avant → ${afterCount} les 14 jours après`,
    concluded: true,
  }
}

export function lockedEffect(): Effect {
  return { locked: true, label: 'Effet mesuré avec Pro' }
}
