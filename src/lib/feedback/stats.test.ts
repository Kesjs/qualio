import { describe, expect, it } from 'vitest'
import { buildDailySeries, buildThemeStats, parseDays, UNCLASSIFIED } from './stats'

const NOW = new Date('2026-10-12T12:00:00Z').getTime()
const daysAgo = (days: number) => new Date(NOW - days * 86_400_000).toISOString()

describe('buildThemeStats', () => {
  const rows = [
    { theme: 'Prix', sentiment: 'negative', created_at: daysAgo(1), content: 'Trop cher' },
    { theme: 'Prix', sentiment: 'negative', created_at: daysAgo(3), content: 'Tarif flou' },
    { theme: 'Prix', sentiment: 'positive', created_at: daysAgo(40), content: 'Prix correct' },
    { theme: 'Navigation', sentiment: 'positive', created_at: daysAgo(2), content: 'Menu clair' },
    { theme: null, sentiment: null, created_at: daysAgo(1), content: 'Avis en attente' },
  ]

  it('compte la période courante et précédente par thème', () => {
    const prix = buildThemeStats(rows, 30, NOW).find((theme) => theme.name === 'Prix')
    expect(prix).toMatchObject({ current: 2, previous: 1, delta: 1, negative: 2, positive: 0 })
  })

  it('trie par volume et place « Non classé » en dernier', () => {
    const names = buildThemeStats(rows, 30, NOW).map((theme) => theme.name)
    expect(names).toEqual(['Prix', 'Navigation', UNCLASSIFIED])
  })

  it('répartit la tendance sur 7 intervalles', () => {
    const prix = buildThemeStats(rows, 30, NOW).find((theme) => theme.name === 'Prix')!
    expect(prix.spark).toHaveLength(7)
    expect(prix.spark.reduce((sum, value) => sum + value, 0)).toBe(prix.current)
  })
})

describe('buildDailySeries', () => {
  it('renvoie un point par jour avec volume et avis négatifs', () => {
    const series = buildDailySeries([
      { theme: null, sentiment: 'negative', created_at: daysAgo(0.1) },
      { theme: null, sentiment: 'positive', created_at: daysAgo(0.2) },
    ], 7, NOW)
    expect(series).toHaveLength(7)
    expect(series.reduce((sum, point) => sum + point.total, 0)).toBe(2)
    expect(series.reduce((sum, point) => sum + point.negative, 0)).toBe(1)
  })
})

describe('parseDays', () => {
  it('n’accepte que 7, 30 ou 90 jours', () => {
    expect(parseDays('7')).toBe(7)
    expect(parseDays('90')).toBe(90)
    expect(parseDays('15')).toBe(30)
    expect(parseDays(null)).toBe(30)
  })
})
