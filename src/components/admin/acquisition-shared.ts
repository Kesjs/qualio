import { FOCUS } from '@/components/admin/ui'

export type Tab = 'queue' | 'drafts' | 'tracking'
export type Notify = (kind: 'success' | 'error' | 'info', text: string, go?: Tab) => void
export const FOLLOW_UP_AFTER_DAYS = 3

export const BTN_SMALL = `inline-flex min-h-10 items-center justify-center rounded-lg border border-white/20 px-3 text-xs font-semibold text-stone-200 transition-colors hover:bg-white/[0.08] disabled:opacity-60 ${FOCUS}`
export const BTN_SMALL_ACCENT = `inline-flex min-h-10 items-center justify-center rounded-lg border border-[#ee6018]/60 px-3 text-xs font-semibold text-[#ffb08a] transition-colors hover:bg-[#ee6018]/10 disabled:opacity-60 ${FOCUS}`
export const CHECKBOX = `h-5 w-5 shrink-0 rounded accent-[#c2410c] ${FOCUS}`

export async function postJson(url: string, body: unknown): Promise<{ ok: boolean; data: Record<string, any> }> {
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, data }
  } catch {
    return { ok: false, data: { error: 'Qualio ne parvient pas à joindre son serveur. Vérifie la connexion puis réessaie.' } }
  }
}

export const plural = (count: number, one: string, many: string) => `${count} ${count > 1 ? many : one}`
