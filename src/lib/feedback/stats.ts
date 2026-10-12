export type StatRow = { theme: string | null; sentiment: string | null; created_at: string; content?: string }

export type ThemeStat = {
  name: string
  isUnclassified: boolean
  current: number
  previous: number
  delta: number
  negative: number
  positive: number
  neutral: number
  spark: number[]
  sample: string | null
}

export const UNCLASSIFIED = 'Non classé'
const DAY = 86_400_000

/** Agrège des avis (période courante + période précédente) par thème. */
export function buildThemeStats(rows: StatRow[], days: number, now = Date.now()): ThemeStat[] {
  const currentStart = now - days * DAY
  const bucketSize = (days * DAY) / 7
  const map = new Map<string, ThemeStat>()
  for (const row of rows) {
    const time = new Date(row.created_at).getTime()
    const name = row.theme ?? UNCLASSIFIED
    let stat = map.get(name)
    if (!stat) {
      stat = { name, isUnclassified: !row.theme, current: 0, previous: 0, delta: 0, negative: 0, positive: 0, neutral: 0, spark: Array(7).fill(0), sample: null }
      map.set(name, stat)
    }
    if (time >= currentStart) {
      stat.current += 1
      if (row.sentiment === 'negative') stat.negative += 1
      else if (row.sentiment === 'positive') stat.positive += 1
      else stat.neutral += 1
      const bucket = Math.min(6, Math.floor((time - currentStart) / bucketSize))
      stat.spark[bucket] += 1
      if (!stat.sample && row.content) stat.sample = row.content.slice(0, 160)
    } else {
      stat.previous += 1
    }
  }
  const list = [...map.values()].map((stat) => ({ ...stat, delta: stat.current - stat.previous }))
  return list.filter((stat) => stat.current > 0 || stat.previous > 0).sort((a, b) => {
    if (a.isUnclassified !== b.isUnclassified) return a.isUnclassified ? 1 : -1
    return b.current - a.current
  })
}

/** Série quotidienne sur la période (volume + négatifs). */
export function buildDailySeries(rows: StatRow[], days: number, now = Date.now()) {
  const start = new Date(now - (days - 1) * DAY)
  start.setHours(0, 0, 0, 0)
  const points = Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY)
    return { date: date.toISOString().slice(0, 10), total: 0, negative: 0, positive: 0 }
  })
  const first = start.getTime()
  for (const row of rows) {
    const index = Math.floor((new Date(row.created_at).getTime() - first) / DAY)
    if (index < 0 || index >= days) continue
    points[index].total += 1
    if (row.sentiment === 'negative') points[index].negative += 1
    if (row.sentiment === 'positive') points[index].positive += 1
  }
  return points
}

export function parseDays(value: string | null, fallback = 30) {
  const parsed = Number(value)
  return [7, 30, 90].includes(parsed) ? parsed : fallback
}
