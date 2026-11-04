import type { NextRequest } from 'next/server'

const SEARCH_WINDOW_MS = 10 * 60 * 1000 // 10 min
const MAX_SEARCHES_PER_IP = 15

const AUDIT_WINDOW_MS = 60 * 60 * 1000 // 1 heure
const MAX_AUDITS_PER_IP = 3
const MAX_GLOBAL_AUDITS_PER_HOUR = 40

const searchBuckets = new Map<string, number[]>()
const auditBuckets = new Map<string, number[]>()
let globalAuditTimestamps: number[] = []

/** Extrait uniquement l'IP ajoutée par l'infrastructure Vercel (jamais un en-tête client arbitraire). */
export function getTrustedClientIp(request: NextRequest): string {
  const vercelIp = request.headers.get('x-vercel-forwarded-for')
  if (vercelIp) return vercelIp.split(',')[0].trim()
  if (process.env.VERCEL === '1') {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
  }
  return 'local'
}

function pruneWindow(timestamps: number[], now: number, windowMs: number): number[] {
  return timestamps.filter((t) => now - t < windowMs)
}

export function consumeAppSearchQuota(ip: string, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
  const recent = pruneWindow(searchBuckets.get(ip) ?? [], now, SEARCH_WINDOW_MS)
  if (recent.length >= MAX_SEARCHES_PER_IP) {
    searchBuckets.set(ip, recent)
    const oldest = recent[0] ?? now
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((SEARCH_WINDOW_MS - (now - oldest)) / 1000)) }
  }
  recent.push(now)
  searchBuckets.set(ip, recent)
  return { allowed: true, retryAfterSec: 0 }
}

export function consumeMiniAuditQuota(ip: string, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
  globalAuditTimestamps = pruneWindow(globalAuditTimestamps, now, AUDIT_WINDOW_MS)
  if (globalAuditTimestamps.length >= MAX_GLOBAL_AUDITS_PER_HOUR) {
    const oldest = globalAuditTimestamps[0] ?? now
    return { allowed: false, retryAfterSec: Math.max(60, Math.ceil((AUDIT_WINDOW_MS - (now - oldest)) / 1000)) }
  }

  const recent = pruneWindow(auditBuckets.get(ip) ?? [], now, AUDIT_WINDOW_MS)
  if (recent.length >= MAX_AUDITS_PER_IP) {
    auditBuckets.set(ip, recent)
    const oldest = recent[0] ?? now
    return { allowed: false, retryAfterSec: Math.max(60, Math.ceil((AUDIT_WINDOW_MS - (now - oldest)) / 1000)) }
  }

  recent.push(now)
  auditBuckets.set(ip, recent)
  globalAuditTimestamps.push(now)
  return { allowed: true, retryAfterSec: 0 }
}

/** Utilitaire de test uniquement. */
export function resetMiniAuditQuotasForTests() {
  searchBuckets.clear()
  auditBuckets.clear()
  globalAuditTimestamps = []
}

