/**
 * Effet d'une décision : compare le nombre d'avis sur le thème dans les 14 jours avant et les 14 jours
 * après la décision. C'est une tendance, pas une preuve de causalité.
 */
export const EFFECT_WINDOW_MS = 14 * 86_400_000
export const EFFECT_MIN_COUNT = 3

export type Effect =
  | { locked: true; label: string }
  | { locked: false; beforeCount: number; afterCount: number; changePercent: number | null; label: string; concluded: boolean; remainingDays?: number | null }

/** Jours restants avant que l'effet soit mesurable (14 jours après la décision), ou null si la décision est invalide. */
export function remainingEffectDays(decidedAt: string, now = Date.now()): number | null {
  const decided = Date.parse(decidedAt)
  if (!Number.isFinite(decided)) return null
  return Math.max(0, Math.ceil((decided + EFFECT_WINDOW_MS - now) / 86_400_000))
}

export function computeEffect(input: { beforeCount: number; afterCount: number; decidedAt: string; now?: number }): Effect {
  const now = input.now ?? Date.now()
  const decided = Date.parse(input.decidedAt)
  const { beforeCount, afterCount } = input
  if (!Number.isFinite(decided)) {
    return { locked: false, beforeCount, afterCount, changePercent: null, label: 'Trop tôt pour conclure (il faut 14 jours après la décision)', concluded: false, remainingDays: null }
  }
  if (now - decided < EFFECT_WINDOW_MS) {
    const remainingDays = remainingEffectDays(input.decidedAt, now) ?? 14
    return { locked: false, beforeCount, afterCount, changePercent: null, label: `résultat dans ${remainingDays} jour${remainingDays > 1 ? 's' : ''}`, concluded: false, remainingDays }
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

/** Phrase courte de l'effet, pour l'email du lundi et les partages (aucune promesse de causalité). */
export function effectSummary(effect: Effect | null | undefined): string | null {
  if (!effect) return null
  if (effect.locked) return 'Effet mesuré avec Pro'
  if (effect.concluded && effect.changePercent != null) {
    return `${effect.beforeCount} avis avant → ${effect.afterCount} après (${effect.changePercent > 0 ? '+' : ''}${effect.changePercent} %)`
  }
  if (effect.remainingDays != null && effect.remainingDays > 0) return `effet mesuré dans ${effect.remainingDays} jour${effect.remainingDays > 1 ? 's' : ''}`
  return effect.label
}
