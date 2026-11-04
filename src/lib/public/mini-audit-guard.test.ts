import { beforeEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import {
  consumeAppSearchQuota,
  consumeMiniAuditQuota,
  getTrustedClientIp,
  resetMiniAuditQuotasForTests,
} from './mini-audit-guard'

describe('mini-audit-guard', () => {
  beforeEach(() => {
    resetMiniAuditQuotasForTests()
  })

  it('ne fait confiance qu’à x-vercel-forwarded-for hors environnement Vercel', () => {
    const spoofed = new NextRequest('https://tryqualio.pro/api/public/mini-audit', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })
    expect(getTrustedClientIp(spoofed)).toBe('local')

    const vercelReq = new NextRequest('https://tryqualio.pro/api/public/mini-audit', {
      headers: { 'x-vercel-forwarded-for': '82.64.10.22, 10.0.0.1' },
    })
    expect(getTrustedClientIp(vercelReq)).toBe('82.64.10.22')
  })

  it('limite les mini-audits à 3 par heure et par IP puis rouvre la fenêtre après 1 h', () => {
    const t0 = 1_700_000_000_000
    expect(consumeMiniAuditQuota('82.64.10.22', t0).allowed).toBe(true)
    expect(consumeMiniAuditQuota('82.64.10.22', t0 + 1_000).allowed).toBe(true)
    expect(consumeMiniAuditQuota('82.64.10.22', t0 + 2_000).allowed).toBe(true)

    const blocked = consumeMiniAuditQuota('82.64.10.22', t0 + 3_000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSec).toBeGreaterThan(3500)

    // Une autre IP n'est pas bloquée
    expect(consumeMiniAuditQuota('91.160.1.9', t0 + 3_000).allowed).toBe(true)

    // Après expiration de la fenêtre d'1 heure, l'IP peut à nouveau lancer un audit
    expect(consumeMiniAuditQuota('82.64.10.22', t0 + 60 * 60 * 1000 + 1).allowed).toBe(true)
  })

  it('limite les recherches App Store publiques à 15 sur 10 minutes par IP', () => {
    const t0 = 1_700_000_000_000
    for (let i = 0; i < 15; i += 1) {
      expect(consumeAppSearchQuota('82.64.10.22', t0 + i * 100).allowed).toBe(true)
    }
    expect(consumeAppSearchQuota('82.64.10.22', t0 + 2_000).allowed).toBe(false)
    expect(consumeAppSearchQuota('82.64.10.22', t0 + 10 * 60 * 1000 + 1).allowed).toBe(true)
  })
})

