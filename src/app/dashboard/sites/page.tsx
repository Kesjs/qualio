'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GlobeAltIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlayIcon,
  ArrowPathIcon,
  ArrowUpRightIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useSites, SiteWithLastScan } from '@/lib/hooks/useSites'
import { AddSiteModal } from '@/components/dashboard/AddSiteModal'
import { RunScanModal } from '@/components/dashboard/RunScanModal'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/Pagination'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

type SiteStatus =
  | 'never_scanned'
  | 'queued'
  | 'running'
  | 'healthy'
  | 'warning'
  | 'regression'
  | 'scan_failed'

function computeSiteStatus(site: SiteWithLastScan): SiteStatus {
  const lastScan = site.last_scan
  if (!lastScan) return 'never_scanned'

  const s = lastScan.status
  if (['running', 'crawling', 'discovering', 'auditing', 'browser_testing'].includes(s)) {
    return 'running'
  }
  if (s === 'created') return 'queued'
  if (['failed', 'blocked'].includes(s)) return 'scan_failed'

  if ((lastScan.critical_count ?? 0) > 0) return 'regression'
  if ((lastScan.major_count ?? 0) > 0 || (lastScan.checks_warning ?? 0) > 0) return 'warning'
  if (s === 'completed') return 'healthy'

  return 'never_scanned'
}

function getSafeHostname(urlStr: string): string {
  try {
    const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`)
    return parsed.hostname
  } catch {
    return urlStr
  }
}

function getStatusMeta(status: SiteStatus) {
  const meta: Record<SiteStatus, { label: string; dot: string; text: string; surface: string }> = {
    healthy: { label: 'Opérationnel', dot: 'bg-emerald-400', text: 'text-emerald-300', surface: 'bg-emerald-400/10 border-emerald-400/20' },
    regression: { label: 'Régression critique', dot: 'bg-rose-400', text: 'text-rose-300', surface: 'bg-rose-400/10 border-rose-400/20' },
    warning: { label: 'À surveiller', dot: 'bg-amber-400', text: 'text-amber-300', surface: 'bg-amber-400/10 border-amber-400/20' },
    running: { label: 'Scan en cours', dot: 'bg-sky-400', text: 'text-sky-300', surface: 'bg-sky-400/10 border-sky-400/20' },
    queued: { label: 'En attente', dot: 'bg-sky-400', text: 'text-sky-300', surface: 'bg-sky-400/10 border-sky-400/20' },
    scan_failed: { label: 'Échec technique', dot: 'bg-rose-400', text: 'text-rose-300', surface: 'bg-rose-400/10 border-rose-400/20' },
    never_scanned: { label: 'Non audité', dot: 'bg-zinc-500', text: 'text-zinc-400', surface: 'bg-white/[0.04] border-white/[0.08]' },
  }
  return meta[status]
}

export default function SitesPage() {
  const { data: sites, isLoading, error } = useSites()
  const [search, setSearch] = useState('')
  const [envFilter, setEnvFilter] = useState<'all' | 'production' | 'staging'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [scanModalSite, setScanModalSite] = useState<SiteWithLastScan | null>(null)

  // Status counts for filter chips
  const counts = useMemo(() => {
    if (!sites) return { all: 0, healthy: 0, regression: 0, warning: 0, running: 0, never: 0 }
    let healthy = 0
    let regression = 0
    let warning = 0
    let running = 0
    let never = 0

    for (const site of sites) {
      const st = computeSiteStatus(site)
      if (st === 'healthy') healthy++
      else if (st === 'regression') regression++
      else if (st === 'warning') warning++
      else if (st === 'running' || st === 'queued') running++
      else if (st === 'never_scanned') never++
    }

    return { all: sites.length, healthy, regression, warning, running, never }
  }, [sites])

  // Filtered sites
  const filteredSites = useMemo(() => {
    if (!sites) return []
    return sites.filter((site) => {
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        site.url.toLowerCase().includes(query) ||
        (site.name && site.name.toLowerCase().includes(query))

      const siteEnv = site.environment || 'production'
      const matchesEnv = envFilter === 'all' || siteEnv === envFilter

      const status = computeSiteStatus(site)
      const matchesStatus = statusFilter === 'all' || status === statusFilter

      return matchesSearch && matchesEnv && matchesStatus
    })
  }, [sites, search, envFilter, statusFilter])

  const hasActiveFilters = search.trim() !== '' || envFilter !== 'all' || statusFilter !== 'all'

  useEffect(() => {
    setPage(1)
  }, [search, envFilter, statusFilter])

  const paginatedSites = filteredSites.slice((page - 1) * pageSize, page * pageSize)

  const resetFilters = () => {
    setSearch('')
    setEnvFilter('all')
    setStatusFilter('all')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header (Clean, authoritative SaaS layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100 font-sans">
              Sites
            </h1>
            {sites && sites.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200/80 dark:bg-white/[0.06] dark:text-zinc-300 dark:border-white/[0.08]">
                {sites.length} site{sites.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Surveillance continue de vos environnements web.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#ee6018] hover:bg-[#d95514] active:scale-[0.98] text-white text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Ajouter un site</span>
        </button>
      </div>

      {sites && sites.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]">
          {[
            { label: 'Sites surveillés', value: counts.all, tone: 'text-zinc-100' },
            { label: 'Régressions', value: counts.regression, tone: counts.regression > 0 ? 'text-rose-300' : 'text-zinc-100' },
            { label: 'Opérationnels', value: counts.healthy, tone: 'text-emerald-300' },
            { label: 'À auditer', value: counts.never, tone: 'text-zinc-100' },
          ].map((item, index) => (
            <div key={item.label} className={`px-4 py-3 ${index > 0 ? 'border-l border-gray-200/80 dark:border-white/[0.08]' : ''}`}>
              <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-zinc-500">{item.label}</p>
              <p className={`mt-1 text-xl font-semibold tabular-nums ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* 2. Filter & Search Toolbar */}
      {sites && sites.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-gray-200/80 dark:bg-[#181B21] dark:border-white/[0.08]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou nom de domaine..."
              className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-gray-50/80 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ee6018] focus:border-[#ee6018] dark:bg-[#111216] dark:border-white/[0.08] dark:text-zinc-100 dark:placeholder:text-zinc-500 transition-all font-sans"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                title="Effacer la recherche"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Quick status pill buttons */}
            <div className="hidden lg:flex items-center gap-1.5 border-r border-gray-200/80 dark:border-white/[0.08] pr-2.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  statusFilter === 'all'
                      ? 'bg-gray-900 text-white dark:bg-white/[0.10] dark:text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/[0.06]'
                }`}
              >
                Tous ({counts.all})
              </button>
              {counts.regression > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 'regression' ? 'all' : 'regression')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    statusFilter === 'regression'
                      ? 'bg-rose-500/20 text-rose-200'
                      : 'text-rose-300 bg-rose-500/10 hover:bg-rose-500/15'
                  }`}
                >
                  Régressions ({counts.regression})
                </button>
              )}
              {counts.healthy > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 'healthy' ? 'all' : 'healthy')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    statusFilter === 'healthy'
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : 'text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15'
                  }`}
                >
                  Sains ({counts.healthy})
                </button>
              )}
            </div>

            {/* Environment Filter */}
            <Select value={envFilter} onValueChange={(val: any) => setEnvFilter(val)}>
              <SelectTrigger className="w-full sm:w-[155px] h-8 text-xs font-medium bg-white border-gray-200 dark:bg-[#111216] dark:border-white/[0.08]">
                <SelectValue placeholder="Environnement">
                  {(val) => {
                    if (val === 'production') return 'Production'
                    if (val === 'staging') return 'Staging'
                    return 'Tous les envs'
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">Tous les environnements</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter for small screens or detailed status */}
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
              <SelectTrigger className="w-full sm:w-[165px] h-8 text-xs font-medium bg-white border-gray-200 dark:bg-[#111216] dark:border-white/[0.08]">
                <SelectValue placeholder="Statut">
                  {(val) => {
                    const labels: Record<string, string> = {
                      all: 'Statut: Tous',
                      healthy: 'Statut: Opérationnel',
                      regression: 'Statut: Régression',
                      warning: 'Statut: Avertissement',
                      running: 'Statut: En direct',
                      never_scanned: 'Statut: Non audité',
                      scan_failed: 'Statut: Échec',
                    }
                    return labels[val] || 'Statut: Tous'
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="healthy">Opérationnel (Sain)</SelectItem>
                <SelectItem value="regression">Régression critique</SelectItem>
                <SelectItem value="warning">Avertissement</SelectItem>
                <SelectItem value="running">Scan en cours</SelectItem>
                <SelectItem value="never_scanned">Non audité</SelectItem>
                <SelectItem value="scan_failed">Échec technique</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Loading State (Faithful Elevated Skeletons) */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-60 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:bg-[#16181E] dark:border-white/[0.08] animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <div className="h-5 w-24 bg-gray-200/60 dark:bg-white/[0.06] rounded-md" />
                    <div className="h-5 w-16 bg-gray-200/60 dark:bg-white/[0.06] rounded-md" />
                  </div>
                  <div className="h-4 w-24 bg-gray-100 dark:bg-white/[0.04] rounded" />
                </div>
                <div className="h-6 w-48 bg-gray-200/80 dark:bg-white/[0.08] rounded" />
                <div className="h-4 w-36 bg-gray-100 dark:bg-white/[0.04] rounded" />
              </div>
              <div className="flex gap-3 border-t border-gray-100 dark:border-white/[0.06] pt-4">
                <div className="h-9 w-1/2 bg-gray-100 dark:bg-white/[0.04] rounded-xl" />
                <div className="h-9 w-1/2 bg-gray-200/80 dark:bg-white/[0.08] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 flex items-start gap-3">
          <ExclamationCircleIcon className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-rose-900 dark:text-rose-200">Erreur de chargement</h4>
            <p className="mt-0.5">{error.message || 'Impossible de joindre la base de données.'}</p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 dark:bg-rose-500/20 dark:border-rose-500/30 text-xs font-medium cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* 5. Empty States */}
      {!isLoading && !error && sites && sites.length === 0 && (
        <EmptyState
          title="Aucun site surveillé pour le moment"
          message="Ajoutez votre premier site web ou application pour lancer une analyse Playwright et obtenir un diagnostic chirurgical de votre interface."
          actionLabel="Ajouter un premier site"
          actionIcon={PlusIcon}
          onActionClick={() => setIsAddModalOpen(true)}
          mainIcon={GlobeAltIcon}
          iconVariant="orange"
          className="my-8"
        />
      )}

      {!isLoading && !error && sites && sites.length > 0 && filteredSites.length === 0 && (
        <EmptyState
          title="Aucun site correspondant"
          message="Aucun environnement ne correspond à vos filtres actuels. Modifiez votre recherche ou réinitialisez les critères."
          actionLabel="Réinitialiser tous les filtres"
          actionIcon={ArrowPathIcon}
          onActionClick={resetFilters}
          mainIcon={MagnifyingGlassIcon}
          iconVariant="neutral"
          className="my-8"
        />
      )}

      {/* 6. Compact site list: one calm row per environment, stacked on mobile. */}
      {!isLoading && !error && filteredSites.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]">
          <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_148px_150px_220px] gap-4 border-b border-gray-200/80 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:border-white/[0.07] dark:text-zinc-500">
            <span>Site</span><span>Statut</span><span>Conformité</span><span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-gray-200/80 dark:divide-white/[0.07]">
            {paginatedSites.map((site) => {
              const status = computeSiteStatus(site)
              const meta = getStatusMeta(status)
              const env = site.environment || 'production'
              const lastScan = site.last_scan
              const hostname = getSafeHostname(site.url)
              const lastScanTime = lastScan?.started_at || lastScan?.created_at
              const timeAgoText = lastScanTime
                ? formatDistanceToNow(new Date(lastScanTime), { addSuffix: true, locale: fr })
                : 'Jamais audité'
              const total = lastScan?.checks_total ?? 0
              const passed = lastScan?.checks_passed ?? 0
              const rate = total ? Math.round((passed / total) * 100) : 0
              const rateColor = rate === 100 ? 'text-emerald-400' : rate >= 70 ? 'text-amber-400' : 'text-rose-400'

              return (
                <div key={`compact-${site.id}`} className="grid grid-cols-1 items-center gap-3 px-4 py-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.025] lg:grid-cols-[minmax(0,1fr)_148px_150px_220px] lg:gap-4 lg:py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300">
                      <GlobeAltIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">{site.name || hostname}</h3>
                        <span className={`hidden shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:inline-flex lg:hidden ${meta.surface} ${meta.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}
                        </span>
                      </div>
                      <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                        <a href={site.url} target="_blank" rel="noreferrer" className="truncate font-mono hover:text-gray-800 dark:hover:text-zinc-300">{hostname}</a>
                        <span className="hidden text-gray-300 dark:text-zinc-700 sm:inline">·</span>
                        <span className="hidden uppercase tracking-wide sm:inline">{env}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between lg:block">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-zinc-500 lg:hidden">Statut</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.surface} ${meta.text}`}><span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}</span>
                  </div>
                  <div className="flex items-center justify-between lg:block">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-zinc-500 lg:hidden">Conformité</span>
                    {status === 'never_scanned' ? <span className="text-xs text-gray-500 dark:text-zinc-500">Jamais audité</span> : (
                      <div className="text-right lg:text-left"><div className="flex items-baseline justify-end gap-1.5 lg:justify-start"><span className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{passed}/{total}</span><span className={`text-xs font-semibold ${rateColor}`}>{rate}%</span></div><p className="mt-0.5 text-[11px] text-gray-500 dark:text-zinc-500">{lastScan?.pages_discovered ?? 0} URL · {timeAgoText}</p></div>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-gray-200/80 pt-3 dark:border-white/[0.07] lg:border-t-0 lg:pt-0">
                    <button type="button" disabled={status === 'running'} onClick={() => setScanModalSite(site)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.09] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:bg-white/[0.08]">
                      {status === 'running' ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> : <PlayIcon className="h-3 w-3 fill-current" />}{status === 'never_scanned' ? 'Lancer le scan' : status === 'running' ? 'En cours' : 'Re-tester'}
                    </button>
                    <Link href={`/dashboard/sites/${site.id}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#ee6018] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#d95514]">Détails<ArrowUpRightIcon className="h-3.5 w-3.5 opacity-80" /></Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legacy card layout retained as a safe fallback while the compact list is validated. */}
      {!isLoading && !error && filteredSites.length > 0 && (
        <div className="hidden space-y-3">
          {paginatedSites.map((site) => {
            const status = computeSiteStatus(site)
            const env = site.environment || 'production'
            const lastScan = site.last_scan
            const hostname = getSafeHostname(site.url)

            const lastScanTime = lastScan?.started_at || lastScan?.created_at
            const timeAgoText = lastScanTime
              ? formatDistanceToNow(new Date(lastScanTime), { addSuffix: true, locale: fr })
              : 'Jamais audité'

            const complianceRate = lastScan?.checks_total
              ? Math.round(((lastScan.checks_passed ?? 0) / lastScan.checks_total) * 100)
              : 0

            return (
              <div
                key={site.id}
                className="relative rounded-xl border border-gray-200/90 bg-white p-4 sm:p-5 shadow-none hover:border-gray-300 dark:bg-[#181B21] dark:border-white/[0.08] dark:hover:border-white/20 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Meta Row: Status Pill + Env Pill + Time-ago */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100 dark:border-white/[0.06]">
                    <div className="flex flex-wrap items-center gap-2">
                      {status === 'healthy' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>Opérationnel</span>
                        </span>
                      )}

                      {status === 'regression' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <span>Régression critique</span>
                        </span>
                      )}

                      {status === 'running' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/70 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                          </span>
                          <span>Scan en direct</span>
                        </span>
                      )}

                      {status === 'queued' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25">
                          <ClockIcon className="h-3 w-3 text-blue-500" />
                          <span>En attente</span>
                        </span>
                      )}

                      {status === 'warning' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25">
                          <ExclamationTriangleIcon className="h-3 w-3 text-amber-500" />
                          <span>Avertissement</span>
                        </span>
                      )}

                      {status === 'scan_failed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25">
                          <ExclamationCircleIcon className="h-3 w-3 text-rose-500" />
                          <span>Échec d'exécution</span>
                        </span>
                      )}

                      {status === 'never_scanned' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200/60 dark:bg-white/[0.06] dark:text-zinc-400 dark:border-white/[0.08]">
                          <span>Non audité</span>
                        </span>
                      )}

                      {/* Environment Tag */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          env === 'production'
                            ? 'bg-white/[0.05] text-zinc-400 border border-white/[0.10] dark:bg-white/[0.05] dark:text-zinc-400 dark:border-white/[0.10]'
                            : 'bg-gray-100 text-gray-600 border border-gray-200/60 dark:bg-white/[0.06] dark:text-zinc-400 dark:border-white/[0.08]'
                        }`}
                      >
                        {env}
                      </span>
                    </div>

                    {/* Relative timestamp */}
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-zinc-500 font-medium shrink-0">
                      <ClockIcon className="h-3 w-3" />
                      <span>{timeAgoText}</span>
                    </div>
                  </div>

                  {/* Main Identity: Favicon/Icon + Title + Domain link */}
                  <div className="mt-3 flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-white/[0.05] border border-gray-200/70 dark:border-white/[0.08] flex items-center justify-center shrink-0 text-gray-600 dark:text-zinc-300">
                      <GlobeAltIcon className="h-4.5 w-4.5 stroke-[1.8]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold text-gray-900 dark:text-zinc-100 group-hover:text-[#ee6018] dark:group-hover:text-[#ff7836] transition-colors leading-snug truncate">
                        {site.name || hostname}
                      </h3>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 font-mono mt-0.5 transition-colors group/link"
                      >
                        <span className="truncate max-w-[260px] sm:max-w-xs">{site.url}</span>
                        <ArrowTopRightOnSquareIcon className="h-3 w-3 shrink-0 opacity-70 group-hover/link:opacity-100" />
                      </a>
                    </div>
                  </div>

                  {/* Running state progress block */}
                  {status === 'running' && (
                    <div className="mt-3 p-2.5 rounded-lg bg-sky-50/70 border border-sky-100 dark:bg-sky-400/[0.08] dark:border-sky-400/20">
                      <div className="flex items-center justify-between text-xs font-semibold text-sky-800 dark:text-sky-300 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin text-sky-600 dark:text-sky-400" />
                          <span>Audit Playwright en cours...</span>
                        </span>
                        <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400 font-semibold uppercase">
                          En direct
                        </span>
                      </div>
                      <div className="w-full bg-sky-200/60 dark:bg-sky-950/60 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full rounded-full w-2/3 animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Regression Alert Banner (Sleek, Not Heavy) */}
                  {status === 'regression' && (
                    <div className="mt-3 p-2.5 rounded-lg bg-rose-50/60 border border-rose-200/60 dark:bg-rose-400/[0.08] dark:border-rose-400/20 flex items-start gap-2.5">
                      <ExclamationTriangleIcon className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-semibold text-rose-900 dark:text-rose-200 block">
                          {lastScan?.critical_count ?? 1} régression(s) bloquante(s)
                        </span>
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 leading-relaxed">
                          Échecs sur les formulaires ou boutons clés. Ouvrez le diagnostic pour corriger.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Warning Banner */}
                  {status === 'warning' && (
                    <div className="mt-3 p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 dark:bg-amber-400/[0.08] dark:border-amber-400/20 flex items-start gap-2.5">
                      <ExclamationCircleIcon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-semibold text-amber-900 dark:text-amber-200 block">
                          {lastScan?.major_count ?? 0} anomalie(s) mineure(s)
                        </span>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                          Des vérifications secondaires nécessitent votre attention.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Clean Metrics Row (No nested wireframe boxes!) */}
                  {status !== 'never_scanned' && lastScan && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                          Couverture
                        </span>
                        <span className="font-bold text-gray-900 dark:text-zinc-200 mt-0.5 block">
                          {lastScan.pages_discovered ?? 0} URL{((lastScan.pages_discovered ?? 0) > 1) ? 's' : ''}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                          Conformité
                        </span>
                        <div className="flex items-center justify-end gap-2 mt-0.5">
                          <span className="font-bold text-gray-900 dark:text-zinc-200">
                            {lastScan.checks_passed ?? 0} / {lastScan.checks_total ?? 0}
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              complianceRate === 100
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : complianceRate >= 70
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            ({complianceRate}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Never Scanned Notice */}
                  {status === 'never_scanned' && (
                    <div className="mt-3 p-2.5 rounded-lg bg-gray-50/70 border border-gray-100 dark:bg-white/[0.03] dark:border-white/[0.05] text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                      <SparklesIcon className="h-4 w-4 text-[#ee6018] shrink-0" />
                      <span>Aucun diagnostic exécuté pour cet environnement.</span>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions (Sleek Buttons) */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center gap-2.5">
                  {status === 'never_scanned' ? (
                    <button
                      type="button"
                      onClick={() => setScanModalSite(site)}
                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#ee6018] hover:bg-[#d95514] active:scale-[0.98] text-white text-xs font-semibold transition-all duration-150 cursor-pointer"
                    >
                      <PlayIcon className="h-3.5 w-3.5 fill-current" />
                      <span>Lancer le premier scan</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={status === 'running'}
                        onClick={() => setScanModalSite(site)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-gray-200/90 bg-gray-50/80 hover:bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-xs font-semibold text-gray-700 dark:text-zinc-300 disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        {status === 'running' ? (
                          <>
                            <ArrowPathIcon className="h-3.5 w-3.5 animate-spin text-gray-400" />
                            <span>En cours...</span>
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-3 w-3 text-gray-500 dark:text-zinc-400 fill-current" />
                            <span>Re-tester</span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/dashboard/sites/${site.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xs font-semibold hover:bg-gray-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all"
                      >
                        <span>Voir le détail</span>
                        <ArrowUpRightIcon className="h-3.5 w-3.5 opacity-70" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!isLoading && !error && filteredSites.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredSites.length}
          onPageChange={setPage}
          label="sites"
        />
      )}

      {/* Modals */}
      <AddSiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newSite) => {
          setScanModalSite({ ...newSite, last_scan: null })
        }}
      />

      <RunScanModal
        isOpen={!!scanModalSite}
        onClose={() => setScanModalSite(null)}
        site={scanModalSite}
      />
    </div>
  )
}
