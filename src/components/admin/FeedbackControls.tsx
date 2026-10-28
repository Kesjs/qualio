'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BTN_PRIMARY, FIELD } from '@/components/admin/ui'
import { AdminSelect } from '@/components/admin/AdminSelect'
import { FEEDBACK_PRIORITIES, FEEDBACK_STATUSES, PRIORITY_LABELS, STATUS_LABELS, labelOf, optionsOf } from '@/lib/admin/format'
import { ADMIN_NOTE_MAX } from '@/lib/admin/feedback-patch'

type Props = { feedbackId: string; status: string; priority: string; adminNote: string | null }
type Change = { status?: string; priority?: string; adminNote?: string }

/**
 * Décider d'un retour : statut et priorité s'enregistrent dès le choix, la note avec un bouton.
 * Un changement échoué revient à la valeur précédente ; chaque résultat est annoncé aux lecteurs d'écran.
 */
export function FeedbackControls({ feedbackId, status, priority, adminNote }: Props) {
  const router = useRouter()
  const uid = useId()
  const [current, setCurrent] = useState({ status, priority })
  const [savedNote, setSavedNote] = useState(adminNote ?? '')
  const [note, setNote] = useState(adminNote ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const changed = useRef(false)

  // Si la ligne disparaît de la liste après l'enregistrement (filtre actif), le focus revient au contenu plutôt que de se perdre.
  useEffect(() => () => {
    if (changed.current && (!document.activeElement || document.activeElement === document.body)) document.getElementById('admin-contenu')?.focus()
  }, [])

  async function save(change: Change, okText: string, rollback: () => void): Promise<boolean> {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/feedback', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: feedbackId, ...change }) })
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) throw new Error(body?.error ?? 'Enregistrement impossible.')
      changed.current = true
      setMessage({ kind: 'ok', text: okText })
      router.refresh()
      return true
    } catch (error) {
      rollback()
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Enregistrement impossible.' })
      return false
    } finally {
      setBusy(false)
    }
  }

  function changeStatus(next: string) {
    const previous = current.status
    setCurrent((value) => ({ ...value, status: next }))
    void save({ status: next }, `Statut : ${labelOf(STATUS_LABELS, next)}.`, () => setCurrent((value) => ({ ...value, status: previous })))
  }

  function changePriority(next: string) {
    const previous = current.priority
    setCurrent((value) => ({ ...value, priority: next }))
    void save({ priority: next }, `Priorité : ${labelOf(PRIORITY_LABELS, next)}.`, () => setCurrent((value) => ({ ...value, priority: previous })))
  }

  function saveNote() {
    const text = note.trim()
    void save({ adminNote: text }, text ? 'Note enregistrée.' : 'Note supprimée.', () => undefined).then((ok) => { if (ok) setSavedNote(text) })
  }

  const noteDirty = note.trim() !== savedNote.trim()
  return (
    <div className="mt-4 border-t border-gray-200/80 dark:border-white/[0.08] pt-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
        <div>
          <label htmlFor={`${uid}-statut`} className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-zinc-300">Statut</label>
          <AdminSelect
            id={`${uid}-statut`}
            value={current.status}
            disabled={busy}
            onChange={changeStatus}
            options={optionsOf(STATUS_LABELS, FEEDBACK_STATUSES)}
          />
        </div>
        <div>
          <label htmlFor={`${uid}-priorite`} className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-zinc-300">Priorité</label>
          <AdminSelect
            id={`${uid}-priorite`}
            value={current.priority}
            disabled={busy}
            onChange={changePriority}
            options={optionsOf(PRIORITY_LABELS, FEEDBACK_PRIORITIES)}
          />
        </div>
      </div>
      <div className="mt-3">
        <label htmlFor={`${uid}-note`} className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-zinc-300">Note interne <span className="font-normal text-gray-500 dark:text-zinc-400">(jamais visible par l’utilisateur)</span></label>
        <textarea
          id={`${uid}-note`}
          value={note}
          rows={2}
          maxLength={ADMIN_NOTE_MAX}
          onChange={(event) => setNote(event.target.value)}
          onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && noteDirty && !busy) { event.preventDefault(); saveNote() } }}
          aria-describedby={`${uid}-aide`}
          className={`${FIELD} py-2 leading-6`}
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy || !noteDirty} onClick={saveNote} className={BTN_PRIMARY}>Enregistrer la note</button>
          <span id={`${uid}-aide`} className="text-xs text-gray-500 dark:text-zinc-400">Ctrl ou ⌘ + Entrée pour enregistrer.</span>
        </div>
      </div>
      <p role={message?.kind === 'error' ? 'alert' : 'status'} className={`mt-3 min-h-5 text-sm ${message?.kind === 'error' ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{busy ? 'Enregistrement…' : message?.text}</p>
    </div>
  )
}
