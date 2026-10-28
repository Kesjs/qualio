'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FIELD, FOCUS } from '@/components/admin/ui'

type Published = { quote: string; name: string; role: string } | null

const BUTTON = `min-h-11 rounded-lg px-4 text-sm font-semibold disabled:opacity-50 ${FOCUS}`

/** Publier un retour positif sur la landing : citation fidèle, nom et rôle validés avec la personne. */
export function TestimonialControl({ feedbackId, message, suggestedName, suggestedRole, published }: { feedbackId: string; message: string; suggestedName: string | null; suggestedRole: string | null; published: Published }) {
  const router = useRouter()
  const uid = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const quoteRef = useRef<HTMLTextAreaElement>(null)
  const [open, setOpen] = useState(false)
  const [quote, setQuote] = useState(published?.quote ?? message)
  const [name, setName] = useState(published?.name ?? suggestedName ?? '')
  const [role, setRole] = useState(published?.role ?? suggestedRole ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => { if (open) quoteRef.current?.focus() }, [open])

  function close() {
    setOpen(false)
    toggleRef.current?.focus()
  }

  async function call(init: RequestInit, successText: string, url = '/api/admin/testimonials') {
    setBusy(true); setError(null); setDone(null)
    try {
      const response = await fetch(url, init)
      const body = await response.json().catch(() => null) as { error?: string } | null
      if (!response.ok) throw new Error(body?.error ?? 'Action impossible.')
      setDone(successText)
      close()
      router.refresh()
    } catch (err) { setError(err instanceof Error ? err.message : 'Action impossible.') } finally { setBusy(false) }
  }

  return (
    <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{published ? 'Publié sur la landing' : 'Témoignage public autorisé par son auteur'}</p>
        <div className="flex flex-wrap gap-2">
          <button ref={toggleRef} type="button" aria-expanded={open} aria-controls={`${uid}-panneau`} onClick={() => setOpen((value) => !value)} className={`${BUTTON} border border-gray-300 dark:border-white/[0.16] text-gray-900 dark:text-[#eeeeee] hover:bg-gray-100 dark:hover:bg-white/[0.08]`}>{open ? 'Fermer' : published ? 'Modifier' : 'Publier sur la landing'}</button>
          {published && <button type="button" disabled={busy} onClick={() => { if (window.confirm('Retirer ce témoignage de la landing ?')) void call({ method: 'DELETE' }, 'Témoignage retiré de la landing.', `/api/admin/testimonials?feedbackId=${encodeURIComponent(feedbackId)}`) }} className={`${BUTTON} border border-red-400/40 text-red-700 dark:text-red-300 hover:bg-red-500/10`}>Retirer</button>}
        </div>
      </div>
      <p role="status" className="mt-2 min-h-5 text-sm text-emerald-800 dark:text-emerald-200">{done}</p>
      {open && (
        <div id={`${uid}-panneau`} className="mt-3 space-y-3" onKeyDown={(event) => { if (event.key === 'Escape') close() }}>
          <div>
            <label htmlFor={`${uid}-citation`} className="mb-1.5 block text-xs font-semibold text-gray-800 dark:text-zinc-200">Citation affichée <span className="font-normal text-gray-500 dark:text-zinc-400">(restez fidèle au message, raccourcissez sans changer le sens)</span></label>
            <textarea id={`${uid}-citation`} ref={quoteRef} value={quote} onChange={(event) => setQuote(event.target.value)} rows={4} maxLength={600} aria-describedby={`${uid}-compteur`} className={`${FIELD} py-2 leading-6`} />
            <p id={`${uid}-compteur`} className="mt-1 text-xs text-gray-500 dark:text-zinc-400"><span className="font-mono">{quote.trim().length}</span> / 600 caractères, 10 au minimum</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-nom`} className="mb-1.5 block text-xs font-semibold text-gray-800 dark:text-zinc-200">Nom affiché</label>
              <input id={`${uid}-nom`} value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required className={FIELD} placeholder="Prénom N." />
            </div>
            <div>
              <label htmlFor={`${uid}-role`} className="mb-1.5 block text-xs font-semibold text-gray-800 dark:text-zinc-200">Rôle ou activité</label>
              <input id={`${uid}-role`} value={role} onChange={(event) => setRole(event.target.value)} maxLength={120} className={FIELD} placeholder="Fondatrice, boutique en ligne" />
            </div>
          </div>
          <p className="text-xs leading-5 text-gray-600 dark:text-zinc-300">Confirmez avec la personne, par écrit, le nom et le rôle affichés avant de publier.</p>
          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
          <button type="button" disabled={busy || !name.trim() || quote.trim().length < 10} onClick={() => void call({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ feedbackId, quote, name, role }) }, published ? 'Témoignage mis à jour.' : 'Témoignage publié.')} className={`${BUTTON} bg-white text-gray-950 hover:bg-zinc-200`}>{busy ? 'Enregistrement…' : published ? 'Mettre à jour' : 'Publier'}</button>
        </div>
      )}
    </div>
  )
}
