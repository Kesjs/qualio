'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckIcon, ChevronRightIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

type FeedbackItem = {
  id: string
  content: string
  source: string
  theme: string | null
  sentiment: string | null
  confidence: number | null
  status: 'open' | 'reviewed' | 'archived'
  created_at: string
  author_name: string | null
  source_url?: string | null
}

type StatusFilter = 'all' | FeedbackItem['status']

const statusLabels: Record<StatusFilter, string> = {
  all: 'Tous',
  open: 'À examiner',
  reviewed: 'Examinés',
  archived: 'Archivés',
}

const sourceLabels: Record<string, string> = {
  manual: 'Ajout manuel',
  widget: 'Widget',
  public_link: 'Source externe',
  csv: 'Import CSV',
}

const themeOptions = ['Navigation', 'Fiabilité', 'Performance', 'Conversion', 'Prix']

async function fetchFeedback(siteId?: string) {
  if (!siteId) return [] as FeedbackItem[]
  const response = await fetch(`/api/feedback?siteId=${encodeURIComponent(siteId)}`)
  if (!response.ok) throw new Error('Impossible de charger les avis')
  return response.json() as Promise<FeedbackItem[]>
}

export function FeedbackInbox({ siteId }: { siteId?: string }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const { data: feedback = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['feedback-inbox', siteId],
    queryFn: () => fetchFeedback(siteId),
    enabled: Boolean(siteId),
  })

  const sources = useMemo(() => Array.from(new Set(feedback.map((item) => item.source))), [feedback])
  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('fr-FR')
    return feedback.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesSource = sourceFilter === 'all' || item.source === sourceFilter
      const matchesSearch = !normalizedSearch || [item.content, item.author_name, item.theme, sourceLabels[item.source] ?? item.source].filter(Boolean).join(' ').toLocaleLowerCase('fr-FR').includes(normalizedSearch)
      return matchesStatus && matchesSource && matchesSearch
    })
  }, [feedback, search, sourceFilter, statusFilter])

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0]

  async function updateSelected(updates: { status?: FeedbackItem['status']; theme?: string | null }) {
    if (!selected) return
    setIsUpdating(true)
    setActionError(null)
    try {
      const response = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, ...updates }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error ?? 'Impossible de mettre à jour cet avis.')
      await refetch()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Impossible de mettre à jour cet avis.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]">
      <div className="border-b border-gray-200/80 px-5 py-5 dark:border-white/[0.08]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ee6018]">Boîte de réception</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-gray-950 dark:text-white">Tous les avis, au même endroit.</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Traitez chaque avis, puis classez-le pour faire émerger les tendances.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block sm:min-w-64">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <span className="sr-only">Rechercher un avis</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un avis" className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ee6018] dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white" />
            </label>
            <label className="relative">
              <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <span className="sr-only">Filtrer par source</span>
              <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-8 text-xs text-gray-700 outline-none focus:border-[#ee6018] dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-200 sm:w-auto">
                <option value="all">Toutes les sources</option>
                {sources.map((source) => <option key={source} value={source}>{sourceLabels[source] ?? source}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Filtrer les avis par statut">
          {(Object.keys(statusLabels) as StatusFilter[]).map((status) => <button key={status} type="button" role="tab" aria-selected={statusFilter === status} onClick={() => setStatusFilter(status)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${statusFilter === status ? 'border-gray-950 bg-gray-950 text-white dark:border-white dark:bg-white dark:text-gray-950' : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900 dark:border-white/[0.1] dark:text-zinc-400 dark:hover:border-white/30 dark:hover:text-white'}`}>{statusLabels[status]}{status !== 'all' ? ` · ${feedback.filter((item) => item.status === status).length}` : ` · ${feedback.length}`}</button>)}
        </div>
      </div>

      {isLoading && <p className="px-5 py-10 text-sm text-gray-500">Chargement des avis…</p>}
      {isError && <p className="px-5 py-10 text-sm text-rose-600">Impossible de charger les avis. Actualisez la page et réessayez.</p>}
      {!isLoading && !isError && <div className="grid xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,.75fr)]">
        <div className="min-h-[420px] divide-y divide-gray-100 dark:divide-white/[0.06]">
          {filtered.length === 0 ? <div className="px-5 py-12"><p className="text-sm font-semibold text-gray-900 dark:text-white">Aucun avis dans cette vue.</p><p className="mt-1 max-w-md text-sm leading-6 text-gray-500 dark:text-zinc-400">Essayez un autre filtre ou attendez un nouvel avis depuis votre widget.</p></div> : filtered.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`flex w-full items-start gap-3 px-5 py-4 text-left transition ${selected?.id === item.id ? 'bg-orange-50/60 dark:bg-[#ee6018]/[0.08]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.025]'}`}><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.status === 'open' ? 'bg-[#ee6018]' : item.status === 'reviewed' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-600'}`} /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-zinc-500"><span>{sourceLabels[item.source] ?? item.source}</span><span>·</span><span>{formatDate(item.created_at)}</span></span><span className="mt-1 block line-clamp-2 text-sm font-semibold leading-5 text-gray-900 dark:text-zinc-100">{item.content}</span><span className="mt-1 block text-xs text-gray-500 dark:text-zinc-500">{item.theme ?? 'À classer'} · {statusLabels[item.status]}</span></span><ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-gray-300 dark:text-zinc-600" /></button>)}
        </div>
        <aside className="border-t border-gray-200/80 bg-[#fbfcfb] p-5 dark:border-white/[0.08] dark:bg-[#151b17] xl:border-l xl:border-t-0">
          {selected ? <div><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Avis sélectionné</p><p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{sourceLabels[selected.source] ?? selected.source} · {formatDate(selected.created_at)}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${selected.status === 'open' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300' : selected.status === 'reviewed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-zinc-300'}`}>{statusLabels[selected.status]}</span></div><blockquote className="mt-5 text-lg font-semibold leading-7 tracking-[-0.02em] text-gray-950 dark:text-white">“{selected.content}”</blockquote><dl className="mt-6 divide-y divide-gray-200/80 border-y border-gray-200/80 text-xs dark:divide-white/[0.08] dark:border-white/[0.08]"><Detail label="Auteur" value={selected.author_name ?? 'Anonyme'} /><Detail label="Sentiment" value={selected.sentiment === 'positive' ? 'Positif' : selected.sentiment === 'negative' ? 'Négatif' : 'Neutre'} /><Detail label="Thème" value={selected.theme ?? 'À classer'} /><Detail label="Confiance" value={selected.confidence ? `${Math.round(selected.confidence * 100)} %` : 'Non calculée'} /></dl><div className="mt-5"><p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Classer cet avis</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" disabled={isUpdating} onClick={() => updateSelected({ theme: null })} className={`rounded-md border px-2.5 py-1.5 text-xs transition ${!selected.theme ? 'border-gray-950 bg-gray-950 text-white dark:border-white dark:bg-white dark:text-gray-950' : 'border-gray-200 text-gray-600 hover:border-gray-400 dark:border-white/[0.1] dark:text-zinc-300'}`}>À classer</button>{themeOptions.map((theme) => <button key={theme} type="button" disabled={isUpdating} onClick={() => updateSelected({ theme })} className={`rounded-md border px-2.5 py-1.5 text-xs transition ${selected.theme === theme ? 'border-[#ee6018] bg-orange-50 text-[#a94416] dark:border-[#ee6018] dark:bg-[#ee6018]/10 dark:text-orange-200' : 'border-gray-200 text-gray-600 hover:border-gray-400 dark:border-white/[0.1] dark:text-zinc-300'}`}>{theme}</button>)}</div></div><div className="mt-6 flex flex-wrap gap-2"><button type="button" disabled={isUpdating} onClick={() => updateSelected({ status: selected.status === 'open' ? 'reviewed' : 'open' })} className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-gray-800 disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-gray-950 dark:hover:bg-zinc-200"><CheckIcon className="h-4 w-4" />{selected.status === 'open' ? 'Marquer comme examiné' : 'Remettre à examiner'}</button>{selected.status !== 'archived' && <button type="button" disabled={isUpdating} onClick={() => updateSelected({ status: 'archived' })} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-400 dark:border-white/[0.1] dark:text-zinc-300">Archiver</button>}{selected.status === 'archived' && <button type="button" disabled={isUpdating} onClick={() => updateSelected({ status: 'open' })} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-400 dark:border-white/[0.1] dark:text-zinc-300">Rouvrir</button>}</div>{actionError && <p role="alert" className="mt-3 text-xs text-rose-600">{actionError}</p>}</div> : <div className="flex min-h-[360px] items-center justify-center text-center"><div><p className="text-sm font-semibold text-gray-900 dark:text-white">Sélectionnez un avis</p><p className="mt-1 text-xs leading-5 text-gray-500 dark:text-zinc-400">Son contenu, sa source et ses actions apparaîtront ici.</p></div></div>}
        </aside>
      </div>}
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 py-3"><dt className="text-gray-500 dark:text-zinc-500">{label}</dt><dd className="text-right font-semibold text-gray-900 dark:text-zinc-100">{value}</dd></div>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value))
}
