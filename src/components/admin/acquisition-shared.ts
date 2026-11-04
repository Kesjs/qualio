import { FOCUS } from '@/components/admin/ui'

export type Tab = 'queue' | 'drafts' | 'tracking'
export type Notify = (kind: 'success' | 'error' | 'info', text: string, go?: Tab) => void
export const FOLLOW_UP_AFTER_DAYS = 4

export type ReportTarget = {
  companyId: string | null
  companyName: string
  domain?: string
  appStoreUrl?: string | null
  externalSource?: { label: string; url: string } | null
}

export const BTN_SMALL = `inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.05] px-3 text-xs font-semibold text-gray-800 dark:text-zinc-200 transition-all duration-150 hover:bg-gray-100 dark:hover:bg-white/[0.09] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55 ${FOCUS}`
export const BTN_SMALL_ACCENT = `inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[#ee6018]/45 bg-[#ee6018]/[0.08] px-3 text-xs font-semibold text-[#c2410c] dark:text-[#ffb08a] transition-all duration-150 hover:bg-[#ee6018]/[0.15] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55 ${FOCUS}`
export const CHECKBOX = `h-4 w-4 shrink-0 rounded accent-[#c2410c] ${FOCUS}`

export async function postJson(url: string, body: unknown, timeoutMs = 90_000): Promise<{ ok: boolean; data: Record<string, any> }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, data }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return { ok: false, data: { error: 'L’opération a dépassé le délai autorisé. Réessaie avec moins d’éléments.' } }
    }
    return { ok: false, data: { error: 'Connexion au serveur interrompue. Vérifie le réseau puis réessaie.' } }
  }
}

export const plural = (count: number, one: string, many: string) => `${count} ${count > 1 ? many : one}`
