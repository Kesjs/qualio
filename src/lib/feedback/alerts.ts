/** Alerte « thème négatif qui monte » : au moins 5 avis négatifs cette semaine, et au moins le double de la semaine précédente. */
export const ALERT_MIN_NEGATIVE = 5

export function isNegativeSpike(current: number, previous: number) {
  return current >= ALERT_MIN_NEGATIVE && current >= previous * 2
}

/** Le thème le plus marqué parmi ceux qui dépassent le seuil, ou null. */
export function pickNegativeSpike(themes: Array<{ theme: string; current: number; previous: number }>) {
  const spikes = themes.filter((item) => isNegativeSpike(item.current, item.previous))
  if (!spikes.length) return null
  return spikes.sort((a, b) => b.current - a.current)[0]
}
