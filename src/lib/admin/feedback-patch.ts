import { FEEDBACK_PRIORITIES, FEEDBACK_STATUSES } from '@/lib/admin/format'

const UUID = /^[0-9a-f-]{36}$/i
export const ADMIN_NOTE_MAX = 2000

export type FeedbackChanges = { status?: string; priority?: string; admin_note?: string | null }
export type FeedbackPatch = { ok: true; id: string; changes: FeedbackChanges } | { ok: false; error: string }

/** Valide la modification d'un retour produit venue de la console : statut, priorité, note interne. */
export function parseFeedbackPatch(body: unknown): FeedbackPatch {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Requête invalide.' }
  const input = body as { id?: unknown; status?: unknown; priority?: unknown; adminNote?: unknown }
  if (typeof input.id !== 'string' || !UUID.test(input.id)) return { ok: false, error: 'Retour invalide.' }
  const changes: FeedbackChanges = {}
  if (input.status !== undefined) {
    if (typeof input.status !== 'string' || !(FEEDBACK_STATUSES as readonly string[]).includes(input.status)) return { ok: false, error: 'Statut invalide.' }
    changes.status = input.status
  }
  if (input.priority !== undefined) {
    if (typeof input.priority !== 'string' || !(FEEDBACK_PRIORITIES as readonly string[]).includes(input.priority)) return { ok: false, error: 'Priorité invalide.' }
    changes.priority = input.priority
  }
  if (input.adminNote !== undefined) {
    if (typeof input.adminNote !== 'string') return { ok: false, error: 'Note invalide.' }
    const note = input.adminNote.trim()
    if (note.length > ADMIN_NOTE_MAX) return { ok: false, error: `La note est trop longue (${ADMIN_NOTE_MAX} caractères au plus).` }
    changes.admin_note = note || null
  }
  if (Object.keys(changes).length === 0) return { ok: false, error: 'Aucune modification à enregistrer.' }
  return { ok: true, id: input.id, changes }
}
