import { describe, expect, it } from 'vitest'
import { firstHumanClick, isAutomatedUserAgent } from '@/lib/admin/acquisition-clicks'

const at = (value: string) => new Date(value).getTime()

describe('clics automatiques', () => {
  it('Pixalione : une rafale de 9 clics qui démarre 15 s après la livraison est automatique', () => {
    const delivered = at('2026-11-03T20:51:23Z')
    const clicks = ['20:51:38', '20:51:50', '20:52:10', '20:52:31', '20:53:05', '20:53:20', '20:53:44', '20:54:10', '20:54:45'].map((t) => at(`2026-11-03T${t}Z`))
    expect(firstHumanClick(clicks, delivered)).toBe(null)
  })

  it('Vanksen : un clic 19 s après la livraison est automatique', () => {
    expect(firstHumanClick([at('2026-11-03T20:51:47Z')], at('2026-11-03T20:51:28Z'))).toBe(null)
  })

  it('Nobilito : un clic 8 minutes après la livraison est compté', () => {
    const click = at('2026-11-03T21:05:02Z')
    expect(firstHumanClick([click], at('2026-11-03T20:57:28Z'))).toBe(click)
  })

  it('un clic humain bien après la rafale du filtre est compté', () => {
    const delivered = at('2026-11-03T10:00:00Z')
    const scanner = [at('2026-11-03T10:00:05Z'), at('2026-11-03T10:01:00Z')]
    const human = at('2026-11-03T14:30:00Z')
    expect(firstHumanClick([...scanner, human], delivered)).toBe(human)
  })

  it('renvoie le premier clic humain seulement, pas les suivants', () => {
    const delivered = at('2026-11-03T10:00:00Z')
    const first = at('2026-11-03T11:00:00Z')
    expect(firstHumanClick([at('2026-11-03T11:30:00Z'), first], delivered)).toBe(first)
  })

  it('sans date de livraison, seule la rafale enchaînée est écartée', () => {
    const click = at('2026-11-03T21:05:02Z')
    expect(firstHumanClick([click], null)).toBe(click)
    expect(firstHumanClick([], null)).toBe(null)
  })
})

describe('user-agents automatiques', () => {
  it('reconnaît les robots et les user-agents vides', () => {
    expect(isAutomatedUserAgent('')).toBe(true)
    expect(isAutomatedUserAgent(null)).toBe(true)
    expect(isAutomatedUserAgent('python-requests/2.31')).toBe(true)
    expect(isAutomatedUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true)
    expect(isAutomatedUserAgent('Microsoft Office Protected View SafeLinks')).toBe(true)
  })

  it('laisse passer un vrai navigateur', () => {
    expect(isAutomatedUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36')).toBe(false)
  })
})
