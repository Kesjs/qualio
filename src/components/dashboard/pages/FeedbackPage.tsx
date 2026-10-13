'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArchiveBoxIcon, ArrowUturnLeftIcon, MagnifyingGlassIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useActions, useDashboardMutations, useFeedbackList, useThemes, type FeedbackFilters } from '@/lib/hooks/useDashboard'
import { formatDate, sourceLabels, timeAgo, type FeedbackItem } from '@/lib/feedback/types'
import { useProjectAccess, READ_ONLY_TEXT } from '@/components/dashboard/useProjectAccess'
import { Banner } from '@/components/dashboard/weekly/bricks'
import { card, dangerButton, EmptyState, ErrorState, focusRing, inputClass, PageHeader, pressable, primaryButton, secondaryButton, SentimentBadge, SentimentDot, selectClass, SidePanel, Skeleton, UsageMeter } from '@/components/dashboard/ui'

type Filters = Omit<FeedbackFilters, 'q'>
const EMPTY_FILTERS: Filters = { status: 'open', theme: '', sentiment: '', source: '', days: 0, page: 0 }

export function FeedbackPage() {
  return <Suspense fallback={<Skeleton className="h-96" />}><FeedbackInner /></Suspense>
}

function FeedbackInner() {
  const params = useSearchParams()
  const access = useProjectAccess()
  const project = access.activeSite
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [debounced, setDebounced] = useState(search.trim())
  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, theme: params.get('theme') ?? '' })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => { const timer = setTimeout(() => setDebounced(search.trim()), 250); return () => clearTimeout(timer) }, [search])
  useEffect(() => { setFilters((current) => ({ ...current, page: 0 })); setSelectedIds(new Set()); setOpenId(null) }, [debounced, project?.id])

  const query = useMemo<FeedbackFilters>(() => ({ ...filters, q: debounced }), [filters, debounced])
  const { data, isLoading, isError, isFetching, refetch } = useFeedbackList(query)
  const { data: themeData } = useThemes()
  const { data: actions } = useActions()
  const { updateFeedback, deleteFeedback } = useDashboardMutations()

  const items = useMemo(() => data?.items ?? [], [data?.items])
  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? 50
  const themeNames = (themeData?.themes ?? []).filter((theme) => !theme.isUnclassified).map((theme) => theme.name)
  const opened = items.find((item) => item.id === openId) ?? null
  const related = opened ? (actions ?? []).filter((action) => action.feedback_ids?.includes(opened.id)) : []
  const filtered = Boolean(debounced || filters.theme || filters.sentiment || filters.source || filters.days)

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? (value as number) : 0 }))
    setSelectedIds(new Set())
  }
  const resetFilters = () => { setSearch(''); setDebounced(''); setFilters({ ...EMPTY_FILTERS }); setSelectedIds(new Set()) }

  const archive = useCallback((ids: string[], status: 'open' | 'archived') => {
    updateFeedback.mutate({ ids, status })
    setSelectedIds(new Set())
    if (status === 'archived') setOpenId(null)
  }, [updateFeedback])

  const remove = useCallback((ids: string[]) => {
    const message = ids.length > 1 ? `Supprimer définitivement ${ids.length} avis ? Cette action est irréversible.` : 'Supprimer définitivement cet avis ? Cette action est irréversible.'
    if (!window.confirm(message)) return
    deleteFeedback.mutate(ids, { onSuccess: () => { setSelectedIds(new Set()); setOpenId(null) } })
  }, [deleteFeedback])

  // Raccourcis clavier : j/k naviguer, e archiver, Échap fermer.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, select, [contenteditable], [role="dialog"]') || event.metaKey || event.ctrlKey || event.altKey) return
      const index = items.findIndex((item) => item.id === openId)
      if (event.key === 'j' && items.length) { event.preventDefault(); setOpenId(items[Math.min(items.length - 1, index + 1)].id) }
      else if (event.key === 'k' && items.length) { event.preventDefault(); setOpenId(items[Math.max(0, index - 1)].id) }
      else if (event.key === 'e' && opened) { event.preventDefault(); archive([opened.id], opened.status === 'archived' ? 'open' : 'archived') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items, openId, opened, archive])

  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id))
  const toggle = (id: string) => setSelectedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })

  return (
    <div className="space-y-5 pb-16">
      <PageHeader
        eyebrow="Avis"
        title="Tous vos avis"
        description="Recherchez, filtrez et corrigez le thème d’un avis. Les nouveaux avis sont classés automatiquement."
        actions={<Link href="/dashboard/collection" className={primaryButton}>Ajouter des avis</Link>}
      />

      {access.readOnly && <Banner tone="info" action={access.isFree ? <Link href="/pricing" className={primaryButton}>Passer à Pro</Link> : undefined}>{READ_ONLY_TEXT}</Banner>}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un avis ou un auteur…" aria-label="Rechercher" className={`${inputClass} pl-9 text-sm`} />
        </div>
        <div role="group" aria-label="Statut" className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 dark:border-white/[0.1] dark:bg-transparent">
          {([['open', 'Nouveaux'], ['archived', 'Archivés'], ['all', 'Tous']] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filters.status === value} onClick={() => setFilter('status', value)} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition duration-150 ${focusRing} ${filters.status === value ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950' : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'}`}>{label}</button>
          ))}
        </div>
        <select aria-label="Thème" value={filters.theme} onChange={(event) => setFilter('theme', event.target.value)} className={selectClass}>
          <option value="">Tous les thèmes</option>{themeNames.map((name) => <option key={name} value={name}>{name}</option>)}<option value="__none__">Non classé</option>
        </select>
        <select aria-label="Sentiment" value={filters.sentiment} onChange={(event) => setFilter('sentiment', event.target.value)} className={selectClass}>
          <option value="">Tous sentiments</option><option value="positive">Positif</option><option value="neutral">Neutre</option><option value="negative">Négatif</option>
        </select>
        <select aria-label="Source" value={filters.source} onChange={(event) => setFilter('source', event.target.value)} className={selectClass}>
          <option value="">Toutes sources</option>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select aria-label="Période" value={filters.days} onChange={(event) => setFilter('days', Number(event.target.value))} className={selectClass}>
          <option value={0}>Toute la période</option><option value={7}>7 jours</option><option value={30}>30 jours</option><option value={90}>90 jours</option>
        </select>
        {access.site && <div className="ml-auto"><UsageMeter used={access.site.feedback} limit={access.site.feedbackLimit} label="avis" /></div>}
      </div>

      {selectedIds.size > 0 && (
        <div role="region" aria-label="Actions groupées" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <span className="text-sm font-semibold text-gray-800 dark:text-zinc-200">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
          <div className="flex flex-wrap gap-2">
            {filters.status !== 'archived'
              ? <button type="button" onClick={() => archive([...selectedIds], 'archived')} className={secondaryButton}><ArchiveBoxIcon className="h-4 w-4" aria-hidden />Archiver</button>
              : <button type="button" onClick={() => archive([...selectedIds], 'open')} className={secondaryButton}><ArrowUturnLeftIcon className="h-4 w-4" aria-hidden />Restaurer</button>}
            <button type="button" onClick={() => remove([...selectedIds])} className={dangerButton}><TrashIcon className="h-4 w-4" aria-hidden />Supprimer</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2" role="status" aria-label="Chargement des avis">{[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-16" />)}</div>
      ) : isError ? (
        <ErrorState message="Impossible de charger les avis." onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        filtered
          ? <EmptyState title="Aucun avis ne correspond" body="Modifiez ou retirez un filtre pour élargir la recherche." label="Effacer les filtres" onClick={resetFilters} />
          : filters.status === 'archived'
            ? <EmptyState title="Aucun avis archivé" body="Les avis que vous archivez apparaissent ici et peuvent être restaurés." />
            : <EmptyState title="Aucun avis pour l’instant" body="Ajoutez vos premiers avis par import CSV, par saisie ou avec le widget." href="/dashboard/collection" label="Ajouter des avis" />
      ) : (
        <section className={`${card} overflow-hidden transition-opacity duration-150 ${isFetching ? 'opacity-70' : ''}`} aria-label="Liste des avis">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-2.5 dark:border-white/[0.06]">
            <input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? new Set() : new Set(items.map((item) => item.id)))} aria-label="Tout sélectionner" className="h-4 w-4 accent-gray-950 dark:accent-white" />
            <span className="font-mono text-xs text-gray-500 dark:text-zinc-400">{total} avis · <kbd>j</kbd>/<kbd>k</kbd> naviguer · <kbd>e</kbd> archiver</span>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {items.map((item) => (
              <li key={item.id} className={`flex items-start gap-3 px-5 py-3.5 transition-colors duration-150 ${openId === item.id ? 'bg-gray-50 dark:bg-white/[0.05]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.025]'}`}>
                <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggle(item.id)} aria-label="Sélectionner cet avis" className="mt-1 h-4 w-4 accent-gray-950 dark:accent-white" />
                <button type="button" onClick={() => setOpenId(item.id)} className={`min-w-0 flex-1 rounded-md text-left ${pressable} ${focusRing}`}>
                  <span className="line-clamp-2 block text-sm leading-5 text-gray-900 dark:text-zinc-100">{item.content}</span>
                  <span className="mt-1 block font-mono text-[11px] text-gray-500 dark:text-zinc-500">{item.author_name ?? 'Anonyme'} · {sourceLabels[item.source] ?? item.source} · {timeAgo(item.created_at)}{item.metadata?.is_example ? ' · Exemple' : ''}</span>
                </button>
                <ThemeSelect item={item} themes={themeNames} />
                <span className="mt-1.5 hidden shrink-0 sm:block"><SentimentDot sentiment={item.sentiment} /></span>
              </li>
            ))}
          </ul>
          {total > pageSize && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 font-mono text-xs text-gray-500 dark:border-white/[0.06] dark:text-zinc-400">
              <span>{filters.page * pageSize + 1}–{Math.min(total, (filters.page + 1) * pageSize)} sur {total}</span>
              <div className="flex gap-2">
                <button type="button" disabled={filters.page === 0} onClick={() => setFilter('page', filters.page - 1)} className={secondaryButton}>Précédent</button>
                <button type="button" disabled={(filters.page + 1) * pageSize >= total} onClick={() => setFilter('page', filters.page + 1)} className={secondaryButton}>Suivant</button>
              </div>
            </div>
          )}
        </section>
      )}

      {opened && (
        <SidePanel label="Détail de l’avis" onClose={() => setOpenId(null)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-zinc-400">{sourceLabels[opened.source] ?? opened.source}</p>
              <p className="mt-1 font-mono text-xs text-gray-500 dark:text-zinc-400">{formatDate(opened.created_at)} · {timeAgo(opened.created_at)}</p>
            </div>
            <button type="button" onClick={() => setOpenId(null)} aria-label="Fermer" className={`rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white ${pressable} ${focusRing}`}><XMarkIcon className="h-5 w-5" aria-hidden /></button>
          </div>
          <p className="mt-5 whitespace-pre-wrap text-base leading-7 text-gray-950 dark:text-white">{opened.content}</p>
          <dl className="mt-6 space-y-3 text-sm">
            <Row label="Auteur">{opened.author_name ?? 'Anonyme'}</Row>
            {opened.author_email && <Row label="Email">{opened.author_email}</Row>}
            {opened.source_url && <Row label="Page"><span className="font-mono text-xs">{opened.source_url}</span></Row>}
            <Row label="Sentiment"><SentimentBadge sentiment={opened.sentiment} /></Row>
            <Row label="Thème"><ThemeSelect item={opened} themes={themeNames} /></Row>
          </dl>
          <section className="mt-7 border-t border-gray-100 pt-5 dark:border-white/[0.06]" aria-label="Recommandations liées">
            <h2 className="text-sm font-semibold text-gray-950 dark:text-white">Recommandations qui s’appuient sur cet avis</h2>
            {related.length === 0
              ? <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">Aucune recommandation ne cite cet avis pour l’instant.</p>
              : <ul className="mt-3 space-y-2">{related.map((action) => <li key={action.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800 dark:bg-white/[0.04] dark:text-zinc-200">{action.title}</li>)}</ul>}
          </section>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => archive([opened.id], opened.status === 'archived' ? 'open' : 'archived')} className={secondaryButton}>
              {opened.status === 'archived' ? <><ArrowUturnLeftIcon className="h-4 w-4" aria-hidden />Restaurer</> : <><ArchiveBoxIcon className="h-4 w-4" aria-hidden />Archiver</>}
            </button>
            <button type="button" onClick={() => remove([opened.id])} className={dangerButton}><TrashIcon className="h-4 w-4" aria-hidden />Supprimer</button>
          </div>
        </SidePanel>
      )}
    </div>
  )
}

function ThemeSelect({ item, themes }: { item: FeedbackItem; themes: string[] }) {
  const { updateFeedback } = useDashboardMutations()
  const options = item.theme && !themes.includes(item.theme) ? [item.theme, ...themes] : themes
  function change(value: string) {
    if (value === '__new__') {
      const name = window.prompt('Nom du nouveau thème')?.trim()
      if (name) updateFeedback.mutate({ ids: [item.id], theme: name })
      return
    }
    updateFeedback.mutate({ ids: [item.id], theme: value || null })
  }
  return (
    <select aria-label="Thème de l’avis" value={item.theme ?? ''} onChange={(event) => change(event.target.value)} className={`h-8 w-36 shrink-0 rounded-md border border-transparent bg-gray-100 px-2 text-xs font-medium text-gray-700 outline-none hover:border-gray-300 focus:border-gray-950 dark:bg-white/[0.06] dark:text-zinc-300 dark:focus:border-white ${focusRing}`}>
      <option value="">Non classé</option>{options.map((name) => <option key={name} value={name}>{name}</option>)}<option value="__new__">+ Nouveau thème…</option>
    </select>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4"><dt className="text-xs text-gray-500 dark:text-zinc-400">{label}</dt><dd className="min-w-0 truncate text-right text-gray-900 dark:text-zinc-100">{children}</dd></div>
}
