'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { CheckIcon, ChevronRightIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useActiveSite } from '@/lib/hooks/useActiveSite'
import type { Site } from '@/lib/hooks/useSites'
import { card, dangerButton, EmptyState, ErrorState, focusRing, inputClass, PageHeader, primaryButton, secondaryButton, Skeleton } from '@/components/dashboard/ui'

const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) : 'Date inconnue'

export default function ProjectsPage() {
  const { sites, activeSite, isLoading, error, refetch } = useActiveSite()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [confirming, setConfirming] = useState<Site | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  function select(site: Site) {
    try { window.localStorage.setItem('qualio:selected-site', site.id) } catch { /* stockage indisponible */ }
    window.dispatchEvent(new CustomEvent('qualio:project-changed', { detail: { siteId: site.id } }))
    setMessage({ tone: 'ok', text: `${site.name || site.url || 'Projet'} est maintenant le projet actif.` })
  }

  async function save(site: Site) {
    const name = draft.trim()
    if (!name) return setMessage({ tone: 'error', text: 'Le nom du projet ne peut pas être vide.' })
    setBusy(site.id)
    const response = await fetch(`/api/sites/${site.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    const body = await response.json().catch(() => ({}))
    setBusy(null)
    if (!response.ok) return setMessage({ tone: 'error', text: body.error || 'Impossible de renommer le projet.' })
    await queryClient.invalidateQueries({ queryKey: ['sites'] })
    setEditing(null)
    setMessage({ tone: 'ok', text: 'Projet renommé.' })
  }

  async function remove(site: Site) {
    setBusy(site.id)
    const response = await fetch(`/api/sites/${site.id}`, { method: 'DELETE' })
    const body = await response.json().catch(() => ({}))
    setBusy(null)
    if (!response.ok) return setMessage({ tone: 'error', text: body.error || 'Impossible de supprimer le projet.' })
    if (activeSite?.id === site.id) {
      try { window.localStorage.removeItem('qualio:selected-site') } catch { /* stockage indisponible */ }
      window.dispatchEvent(new CustomEvent('qualio:project-changed'))
    }
    await queryClient.invalidateQueries({ queryKey: ['sites'] })
    setConfirming(null)
    setMessage({ tone: 'ok', text: 'Projet supprimé.' })
  }

  return <div className="space-y-6 pb-16">
    <nav aria-label="Fil d’Ariane" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400">
      <Link href="/dashboard/settings" className={`rounded px-1.5 py-1 hover:text-gray-950 dark:hover:text-white ${focusRing}`}>Réglages</Link>
      <ChevronRightIcon className="h-4 w-4 text-gray-400 dark:text-zinc-600" aria-hidden />
      <span aria-current="page" className="px-1.5 py-1 font-medium text-gray-900 dark:text-zinc-100">Projets</span>
    </nav>
    <PageHeader eyebrow="Réglages · Projets" title="Gérer vos projets" description="Identifiez, ouvrez, renommez ou supprimez les espaces de travail de votre compte." />
    {message && <p role={message.tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${message.tone === 'error' ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200' : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100'}`}>{message.text}</p>}
    {isLoading && <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>}
    {error && <ErrorState message="Impossible de charger vos projets." onRetry={() => refetch()} />}
    {!isLoading && !error && !sites?.length && <EmptyState title="Aucun projet" body="Créez votre premier projet depuis le sélecteur en haut du dashboard." href="/onboarding" label="Créer un projet" />}
    <div className="grid gap-4 lg:grid-cols-2">
      {sites?.map((site) => <article key={site.id} className={`${card} p-5`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {editing === site.id ? <div className="flex gap-2"><input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void save(site); if (event.key === 'Escape') setEditing(null) }} className={inputClass} aria-label="Nom du projet" /><button type="button" disabled={busy === site.id} onClick={() => void save(site)} className={`${primaryButton} px-3`} aria-label="Enregistrer"><CheckIcon className="h-4 w-4" /></button></div> : <h2 className="truncate text-lg font-semibold text-gray-950 dark:text-white">{site.name || site.url || 'Projet sans nom'}</h2>}
            <p className="mt-1 truncate text-sm text-gray-500 dark:text-zinc-400">{site.url || 'Aucune URL renseignée'}</p>
          </div>
          {activeSite?.id === site.id && <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-800 dark:bg-orange-500/10 dark:text-orange-300">Actif</span>}
        </div>
        <p className="mt-4 text-xs text-gray-500 dark:text-zinc-500">Créé le {dateLabel(site.created_at)}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {activeSite?.id !== site.id && <button type="button" onClick={() => select(site)} className={`${secondaryButton} ${focusRing}`}>Ouvrir</button>}
          <button type="button" onClick={() => { setEditing(site.id); setDraft(site.name || '') }} className={`${secondaryButton} ${focusRing}`}><PencilSquareIcon className="h-4 w-4" /> Renommer</button>
          <button type="button" onClick={() => setConfirming(site)} className={`${dangerButton} ${focusRing}`}><TrashIcon className="h-4 w-4" /> Supprimer</button>
        </div>
      </article>)}
    </div>
    {confirming && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirming(null) }}><div role="dialog" aria-modal="true" aria-labelledby="delete-project-title" className={`${card} w-full max-w-md p-6 shadow-2xl`}><h2 id="delete-project-title" className="text-lg font-semibold text-gray-950 dark:text-white">Supprimer ce projet ?</h2><p className="mt-2 text-sm leading-6 text-gray-500 dark:text-zinc-400">Cette action supprime ses avis et sa configuration. Elle ne peut pas être annulée.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConfirming(null)} className={secondaryButton}>Annuler</button><button type="button" disabled={busy === confirming.id} onClick={() => void remove(confirming)} className={dangerButton}>Supprimer définitivement</button></div></div></div>}
  </div>
}
