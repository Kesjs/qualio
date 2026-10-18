import { describe, expect, it } from 'vitest'
import { computeEffect, effectSummary, remainingEffectDays } from './effect'

const day = 86_400_000
const now = Date.parse('2026-10-18T12:00:00.000Z')

describe('effet d’une décision', () => {
  it('avant 14 jours : annonce le nombre de jours restants', () => {
    const decidedAt = new Date(now - 4 * day).toISOString()
    const effect = computeEffect({ beforeCount: 8, afterCount: 2, decidedAt, now })
    expect(effect).toMatchObject({ concluded: false, remainingDays: 10, label: 'résultat dans 10 jours' })
    expect(effectSummary(effect)).toBe('effet mesuré dans 10 jours')
  })

  it('le jour de la décision : 14 jours', () => {
    expect(remainingEffectDays(new Date(now).toISOString(), now)).toBe(14)
  })

  it('après 14 jours : compare avant et après', () => {
    const decidedAt = new Date(now - 15 * day).toISOString()
    const effect = computeEffect({ beforeCount: 10, afterCount: 4, decidedAt, now })
    expect(effect).toMatchObject({ concluded: true, changePercent: -60 })
    expect(effectSummary(effect)).toBe('10 avis avant → 4 après (-60 %)')
  })

  it('pas assez d’avis avant : ne conclut pas', () => {
    const decidedAt = new Date(now - 20 * day).toISOString()
    expect(computeEffect({ beforeCount: 1, afterCount: 0, decidedAt, now })).toMatchObject({ concluded: false })
  })

  it('Gratuit : l’effet est annoncé comme mesuré avec Pro', () => {
    expect(effectSummary({ locked: true, label: 'Effet mesuré avec Pro' })).toBe('Effet mesuré avec Pro')
    expect(effectSummary(null)).toBeNull()
  })
})
