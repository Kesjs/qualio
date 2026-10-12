'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArchiveBoxIcon, ArrowUturnLeftIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useActiveSite } from '@/lib/hooks/useActiveSite'
import { useDashboardMutations, useFeedbackList, useThemes, type FeedbackFilters } from '@/lib/hooks/useDashboard'
import { formatDate, sourceLabels, timeAgo, type FeedbackItem } from '@/lib/feedback/types'
import { card, EmptyState, ErrorState, PageHeader, secondaryButton, SentimentBadge, Skeleton } from '@/components/dashboard/ui'

const selectClass = 'h-9 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 outline-none focus:border-[#ee6018] dark:border-white/[0.1] dark:bg-[#16181E] dark:text-zinc-200'

export function FeedbackPage() {
  return <Suspense fallback={<Skeleton className="h-96" />}><FeedbackInner /></Suspense>
}

function FeedbackInner() {
  const params = useSearchParams()
  const { activeSite: project } = useActiveSite()
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [debounced, setDebounced] = useState(search)
  const [filters, setFilters] = useState<Omit<FeedbackFilters, 'q'>>({ status: 'open', theme: params.get('theme') ?? '', sentiment: '', source: '', days: 0, page: 0 })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => { const timer = setTimeout(() => setDebounced(search.trim()), 250); return () => clearTimeout(timer) }, [search])
  useEffect(() => { setFilters((current) => ({ ...current, page: 0 })); setSelectedIds(new Set()); setOpenId(null) }, [debounced, project?.id])

  const query = useMemo<FeedbackFilters>(() => ({ ...filters, q: debounced }), [filters, debounced])
  const { data, isLoading, isError, isFetching, refetch } = useFeedbackList(query)
  const { data: themeData } = useThemes()
  const { updateFeedback } = useDashboardMutations()

  const items = useMemo(() => data?.items ?? [], [data?.items])
  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? 50
  const themeNames = (themeData?.themes ?? []).filter((theme) => !theme.isUnclassified).map((theme) => theme.name)
  const opened = items.find((item) => item.id === openId) ?? null
  const set = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => { setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? (value as number) : 0 })); setSelectedIds(new Set()) }

  const archive = useCallback((ids: string[], status: 'open' | 'archived') => { updateFeedback.mutate({ ids, status }); setSelectedIds(new Set()); if (status === 'archived') setOpenId(null) }, [updateFeedback])

  // Raccourcis clavier : j/k naviguer, e archiver, Échap fermer.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable]') || event.metaKey || event.ctrlKey || event.altKey) return
      const index = items.findIndex((item) => item.id === openId)
      if (event.key === 'j' && items.length) { event.preventDefault(); setOpenId(items[Math.min(items.length - 1, index + 1)].id) }
      else if (event.key === 'k' && items.length) { event.preventDefault(); setOpenId(items[Math.max(0, index - 1)].id) }
      else if (event.key === 'e' && opened) { event.preventDefault(); archive([opened.id], opened.status === 'archived' ? 'open' : 'archived') }
      else if (event.key === 'Escape') setOpenId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items, openId, opened, archive])

  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id))
  const toggle = (id: string) => setSelectedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })

  return (
    <div className="space-y-5 pb-16">
      <PageHeader eyebrow="Avis" title="Tous vos avis" description="Recherchez, filtrez et corrigez le thème d’un avis. Les nouveaux avis sont classés automatiquement." />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un avis ou un auteur…" aria-label="Rechercher" className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#ee6018] dark:border-white/[0.1] dark:bg-[#16181E] dark:text-white" />
        </div>
        <div role="group" aria-label="Statut" className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 dark:border-white/[0.1] dark:bg-transparent">
          {([['open', 'Nouveaux'], ['archived', 'Archivés'], ['all', 'Tous']] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filters.status === value} onClick={() => set('status', value)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${filters.status === value ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950' : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'}`}>{label}</button>
          ))}
        </div>
        <select aria-label="Thème" value={filters.theme} onChange={(event) => set('theme', event.target.value)} className={selectClass}>
          <option value="">Tous les thèmes</option>{themeNames.map((name) => <option key={name} value={name}>{name}</option>)}<option value="__none__">Non classé</option>
        </select>
        <select aria-label="Sentiment" value={filters.sentiment} onChange={(event) => set('sentiment', event.target.value)} className={selectClass}>
          <option value="">Tous sentiments</option><option value="positive">Positif</option><option value="neutral">Neutre</option><option value="negative">Négatif</option>
        </select>
        <select aria-label="Source" value={filters.source} onChange={(event) => set('source', event.target.value)} className={selectClass}>
          <option value="">Toutes sources</option>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select aria-label="Période" value={filters.days} onChange={(event) => set('days', Number(event.target.value))} className={selectClass}>
          <option value={0}>Toute la période</option><option value={7}>7 jours</option><option value={30}>30 jours</option><option value={90}>90 jours</option>
        </select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/70 px-4 py-2.5 dark:border-orange-500/20 dark:bg-orange-500/[0.08]">
          <span className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
          <div className="flex gap-2">
            {filters.status !== 'archived' && <button type="button" onClick={() => archive([...selectedIds], 'archived')} className={secondaryButton}><ArchiveBoxIcon className="h-4 w-4" />Archiver</button>}
            {filters.status === 'archived' && <button type="button" onClick={() => archive([...selectedIds], 'open')} className={secondaryButton}><ArrowUturnLeftIcon className="h-4 w-4" />Restaurer</button>}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-16" />)}</div>
      ) : isError ? (
        <ErrorState message="Impossible de charger les avis." onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title={debounced || filters.theme || filters.sentiment || filters.source || filters.days ? 'Aucun avis ne correspond' : filters.status === 'archived' ? 'Aucun avis archivé' : 'Aucun avis pour le moment'} body={debounced || filters.theme ? 'Modifiez ou retirez un filtre pour élargir la recherche.' : 'Connectez une source pour recevoir vos premiers avis.'} href="/dashboard/collection" label="Gérer la collecte" />
      ) : (
        <section className={`${card} overflow-hidden ${isFetching ? 'opacity-80' : ''}`}>
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-2.5 dark:border-white/[0.06]">
            <input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? new Set() : new Set(items.map((item) => item.id)))} aria-label="Tout sélectionner" className="h-4 w-4 accent-[#ee6018]" />
            <span className="text-xs text-gray-500 dark:text-zinc-400">{total} avis · <kbd className="font-mono">j</kbd>/<kbd className="font-mono">k</kbd> naviguer · <kbd className="font-mono">e</kbd> archiver</span>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {items.map((item) => (
              <li key={item.id} className={`flex items-start gap-3 px-5 py-3.5 transition ${openId === item.id ? 'bg-orange-50/50 dark:bg-orange-500/[0.06]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.025]'}`}>
                <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggle(item.id)} aria-label="Sélectionner cet avis" className="mt-1 h-4 w-4 accent-[#ee6018]" />
                <button type="button" onClick={() => setOpenId(item.id)} className="min-w-0 flex-1 text-left">
                  <span className="line-clamp-2 block text-sm leading-5 text-gray-900 dark:text-zinc-100">{item.content}</span>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-zinc-500">{item.author_name ?? 'Anonyme'} · {sourceLabels[item.source] ?? item.source} · {timeAgo(item.created_at)}{item.metadata?.is_example ? ' · Exemple' : ''}</span>
                </button>
                <ThemeSelect item={item} themes={themeNames} />
                <span className="hidden w-16 shrink-0 sm:block"><SentimentBadge sentiment={item.sentiment} /></span>
              </li>
            ))}
          </ul>
          {total > pageSize && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-xs text-gray-500 dark:border-white/[0.06] dark:text-zinc-400">
              <span>{filters.page * pageSize + 1}–{Math.min(total, (filters.page + 1) * pageSize)} sur {total}</span>
              <div className="flex gap-2">
                <button type="button" disabled={filters.page === 0} onClick={() => set('page', filters.page - 1)} className={secondaryButton}>Précédent</button>
                <button type="button" disabled={(filters.page + 1) * pageSize >= total} onClick={() => set('page', filters.page + 1)} className={secondaryButton}>Suivant</button>
              </div>
            </div>
          )}
        </section>
      )}
      {opened && <DetailPanel item={opened} themes={themeNames} onClose={() => setOpenId(null)} onArchive={() => archive([opened.id], opened.status === 'archived' ? 'open' : 'archived')} />}
    </div>
  )
}

function ThemeSelect({ item, themes }: { item: FeedbackItem; themes: string[] }) {
  const { mutate } = useDashboardMutations().updateFeedback
  const options = item.theme && !themes.includes(item.theme) ? [item.theme, ...themes] : themes
  function change(value: string) {
    if (value === '__new__') {
      const name = window.prompt('Nom du nouveau thème')?.trim()
      if (name) mutate({ ids: [item.id], theme: name })
      return
    }
    mutate({ ids: [item.id], theme: value || null })
  }
  return (
    <select aria-label="Thème de l’avis" value={item.theme ?? ''} onChange={(event) => change(event.target.value)} className="mt-0.5 h-8 w-32 shrink-0 rounded-md border border-transparent bg-gray-100 px-2 text-xs font-medium text-gray-700 outline-none hover:border-gray-300 focus:border-[#ee6018] dark:bg-white/[0.06] dark:text-zinc-300">
      <option value="">Non classé</option>{options.map((name) => <option key={name} value={name}>{name}</option>)}<option value="__new__">+ Nouveau thème…</option>
    </select>
  )
}

function DetailPanel({ item, themes, onClose, onArchive }: { item: FeedbackItem; themes: string[]; onClose: () => void; onArchive: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-gray-900/30 backdrop-blur-[2px] dark:bg-black/60" onClick={onClose} />
      <aside role="dialog" aria-label="Détail de l’avis" className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#111216]">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c95720] dark:text-orange-300">{sourceLabels[item.source] ?? item.source}</p><p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{formatDate(item.created_at)} · {timeAgo(item.created_at)}</p></div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-gray-950 dark:text-white">{item.content}</p>
        <dl className="mt-6 space-y-3 text-sm">
          <Row label="Auteur">{item.author_name ?? 'Anonyme'}</Row>
          {item.author_email && <Row label="Email">{item.author_email}</Row>}
          {item.source_url && <Row label="Page">{item.source_url}</Row>}
          <Row label="Sentiment"><SentimentBadge sentiment={item.sentiment} /></Row>
          <Row label="Thème"><ThemeSelect item={item} themes={themes} /></Row>
        </dl>
        <button type="button" onClick={onArchive} className={`${secondaryButton} mt-8`}>{item.status === 'archived' ? <><ArrowUturnLeftIcon className="h-4 w-4" />Restaurer</> : <><ArchiveBoxIcon className="h-4 w-4" />Archiver</>}</button>
      </aside>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4"><dt className="text-xs text-gray-500 dark:text-zinc-400">{label}</dt><dd className="min-w-0 truncate text-right text-gray-900 dark:text-zinc-100">{children}</dd></div>
}
