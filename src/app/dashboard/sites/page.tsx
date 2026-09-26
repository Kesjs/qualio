'use client'

import { useState, useMemo } from 'react'
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
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlayIcon,
  ArrowPathIcon,
  ArrowUpRightIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useSites, SiteWithLastScan } from '@/lib/hooks/useSites'
import { AddSiteModal } from '@/components/dashboard/AddSiteModal'
import { RunScanModal } from '@/components/dashboard/RunScanModal'
import { EmptyState } from '@/components/ui/empty-state'
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

export default function SitesPage() {
  const { data: sites, isLoading, error } = useSites()
  const [search, setSearch] = useState('')
  const [envFilter, setEnvFilter] = useState<'all' | 'production' | 'staging'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [scanModalSite, setScanModalSite] = useState<SiteWithLastScan | null>(null)

  // Quick stats computed from current sites list
  const stats = useMemo(() => {
    if (!sites) return { total: 0, healthy: 0, regression: 0, running: 0, neverScanned: 0 }
    let healthy = 0
    let regression = 0
    let running = 0
    let neverScanned = 0

    for (const site of sites) {
      const st = computeSiteStatus(site)
      if (st === 'healthy') healthy++
      else if (st === 'regression') regression++
      else if (st === 'running' || st === 'queued') running++
      else if (st === 'never_scanned') neverScanned++
    }

    return { total: sites.length, healthy, regression, running, neverScanned }
  }, [sites])

  // Filtered sites
  const filteredSites = useMemo(() => {
    if (!sites) return []
    return sites.filter((site) => {
      // Search filter (name or URL)
      const query = search.trim().toLowerCase()
      const matchesSearch =
        !query ||
        site.url.toLowerCase().includes(query) ||
        (site.name && site.name.toLowerCase().includes(query))

      // Environment filter
      const siteEnv = site.environment || 'production'
      const matchesEnv = envFilter === 'all' || siteEnv === envFilter

      // Status filter
      const status = computeSiteStatus(site)
      const matchesStatus = statusFilter === 'all' || status === statusFilter

      return matchesSearch && matchesEnv && matchesStatus
    })
  }, [sites, search, envFilter, statusFilter])

  const hasActiveFilters = search.trim() !== '' || envFilter !== 'all' || statusFilter !== 'all'

  const resetFilters = () => {
    setSearch('')
    setEnvFilter('all')
    setStatusFilter('all')
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header (Bolder typographic scale + Primary Signal Orange Action) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-sans">
              Environnements & Sites
            </h1>
            {sites && sites.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-foreground/80 border border-border">
                {sites.length} site{sites.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Surveillance continue de vos applications web et déclenchement de diagnostics automatisés Playwright.
          </p>
        </div>

        {/* Primary Action Button with Physical Tap Interaction */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ee6018] hover:bg-[#d95514] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#ee6018]/20 transition-all duration-150 cursor-pointer shrink-0 min-h-[44px]"
        >
          <PlusIcon className="h-4 w-4 stroke-[2.5]" />
          <span>Ajouter un site</span>
        </button>
      </div>

      {/* 2. Operational Summary Bar (Clarify + Distill: Quick status filters) */}
      {sites && sites.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.98] ${
              statusFilter === 'all'
                ? 'bg-card border-foreground/30 shadow-sm ring-1 ring-foreground/10'
                : 'bg-card/50 border-border/80 hover:bg-card hover:border-border'
            }`}
          >
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total configurés
            </div>
            <div className="text-2xl font-black text-foreground mt-1 font-mono tabular-nums">
              {stats.total}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'healthy' ? 'all' : 'healthy')}
            className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.98] ${
              statusFilter === 'healthy'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/30'
                : 'bg-card/50 border-border/80 hover:bg-card hover:border-emerald-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Opérationnels
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono tabular-nums">
              {stats.healthy}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'regression' ? 'all' : 'regression')}
            className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.98] ${
              statusFilter === 'regression'
                ? 'bg-rose-500/10 border-rose-500/50 shadow-sm ring-1 ring-rose-500/30'
                : 'bg-card/50 border-border/80 hover:bg-card hover:border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Régressions
              </span>
              <span className="h-2 w-2 rounded-full bg-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono tabular-nums">
              {stats.regression}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'never_scanned' ? 'all' : 'never_scanned')}
            className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer active:scale-[0.98] ${
              statusFilter === 'never_scanned'
                ? 'bg-amber-500/10 border-amber-500/50 shadow-sm ring-1 ring-amber-500/30'
                : 'bg-card/50 border-border/80 hover:bg-card hover:border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Jamais audités
              </span>
              <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-black text-muted-foreground mt-1 font-mono tabular-nums">
              {stats.neverScanned}
            </div>
          </button>
        </div>
      )}

      {/* 3. Filter Bar (Search + Environment + Status Filter + Reset) */}
      {sites && sites.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou nom de domaine..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#ee6018]/40 transition-all font-sans"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Effacer la recherche"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Environment Filter */}
            <Select value={envFilter} onValueChange={(val: any) => setEnvFilter(val)}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs font-semibold bg-background border-border">
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

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
              <SelectTrigger className="w-full sm:w-[170px] h-9 text-xs font-semibold bg-background border-border">
                <SelectValue placeholder="Statut">
                  {(val) => {
                    const labels: Record<string, string> = {
                      all: 'Tous les statuts',
                      healthy: 'Opérationnel',
                      regression: 'Régression',
                      warning: 'Avertissement',
                      running: 'Scan en direct',
                      never_scanned: 'Jamais audité',
                      scan_failed: 'Échec technique',
                    }
                    return labels[val] || 'Tous les statuts'
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="healthy">Opérationnel</SelectItem>
                <SelectItem value="regression">Régression critique</SelectItem>
                <SelectItem value="warning">Avertissement</SelectItem>
                <SelectItem value="running">Scan en cours</SelectItem>
                <SelectItem value="never_scanned">Jamais audité</SelectItem>
                <SelectItem value="scan_failed">Échec technique</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors cursor-pointer"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Loading State (Harden: Exact Card Skeletons) */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl border border-border/80 bg-card p-6 shadow-xs animate-pulse flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <div className="h-5 w-24 bg-muted rounded-md" />
                    <div className="h-5 w-16 bg-muted rounded-md" />
                  </div>
                  <div className="h-4 w-24 bg-muted/60 rounded" />
                </div>
                <div className="h-6 w-52 bg-muted rounded" />
                <div className="h-4 w-36 bg-muted/50 rounded" />
                <div className="h-14 w-full bg-muted/30 rounded-lg border border-border/40" />
              </div>
              <div className="flex gap-3 border-t border-border/60 pt-4">
                <div className="h-9 w-1/2 bg-muted/70 rounded-lg" />
                <div className="h-9 w-1/2 bg-muted rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Error State (Harden: Clear message + Retry action) */}
      {error && (
        <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs sm:text-sm text-destructive flex items-start gap-3.5">
          <ExclamationCircleIcon className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-foreground">Erreur lors du chargement des environnements</h4>
            <p className="mt-1 text-muted-foreground">
              {error.message || 'Impossible de synchroniser vos sites avec la base de données.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 px-3 py-1.5 rounded-lg bg-background border border-border font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Recharger la page
            </button>
          </div>
        </div>
      )}

      {/* 6. Empty States (Harden & Polish) */}
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

      {/* 7. Sites Grid (Bolder, Animate, Colorize, Clarify, Adapt, Polish) */}
      {!isLoading && !error && filteredSites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSites.map((site) => {
            const status = computeSiteStatus(site)
            const env = site.environment || 'production'
            const lastScan = site.last_scan
            const hostname = getSafeHostname(site.url)

            // Compute relative time
            const lastScanTime = lastScan?.started_at || lastScan?.created_at
            const timeAgoText = lastScanTime
              ? formatDistanceToNow(new Date(lastScanTime), { addSuffix: true, locale: fr })
              : 'Jamais audité'

            // Color-coded accent border on top
            const borderAccentClass = {
              healthy: 'border-t-emerald-500 dark:border-t-emerald-400',
              regression: 'border-t-rose-500 dark:border-t-rose-500',
              warning: 'border-t-amber-500 dark:border-t-amber-400',
              running: 'border-t-sky-500 dark:border-t-sky-400',
              queued: 'border-t-blue-500 dark:border-t-blue-400',
              scan_failed: 'border-t-rose-600 dark:border-t-rose-600',
              never_scanned: 'border-t-border',
            }[status]

            return (
              <div
                key={site.id}
                className={`relative rounded-xl border border-border/80 border-t-2 ${borderAccentClass} bg-card p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-border transition-all duration-200 flex flex-col justify-between group`}
              >
                <div>
                  {/* Card Header: Badges & Relative Timestamp */}
                  <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-border/60">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status Badges with strictly semantic colors */}
                      {status === 'healthy' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>OPÉRATIONNEL</span>
                        </span>
                      )}

                      {status === 'regression' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          <span>RÉGRESSION CRITIQUE</span>
                        </span>
                      )}

                      {status === 'running' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                          </span>
                          <span>SCAN EN DIRECT</span>
                        </span>
                      )}

                      {status === 'queued' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <ClockIcon className="h-3 w-3 text-blue-500" />
                          <span>EN ATTENTE</span>
                        </span>
                      )}

                      {status === 'warning' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <ExclamationTriangleIcon className="h-3 w-3 text-amber-500" />
                          <span>AVERTISSEMENTS</span>
                        </span>
                      )}

                      {status === 'scan_failed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <ExclamationCircleIcon className="h-3 w-3 text-rose-500" />
                          <span>ÉCHEC TECHNIQUE</span>
                        </span>
                      )}

                      {status === 'never_scanned' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-muted text-muted-foreground border border-border">
                          <span>JAMAIS AUDITÉ</span>
                        </span>
                      )}

                      {/* Environment Tag */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          env === 'production'
                            ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}
                      >
                        {env}
                      </span>
                    </div>

                    {/* Time-ago timestamp */}
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium shrink-0">
                      <ClockIcon className="h-3.5 w-3.5" />
                      <span>{timeAgoText}</span>
                    </div>
                  </div>

                  {/* Main Identity: Site Name + Domain Link */}
                  <div className="mt-4">
                    <h3 className="text-base sm:text-lg font-black text-foreground group-hover:text-[#ee6018] transition-colors leading-tight">
                      {site.name || hostname}
                    </h3>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-mono mt-1 transition-colors group/link"
                    >
                      <span className="truncate max-w-[280px] sm:max-w-md">{site.url}</span>
                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 shrink-0 opacity-70 group-hover/link:opacity-100" />
                    </a>
                  </div>

                  {/* Operational In-Progress Wave (Animate + Clarify) */}
                  {status === 'running' && (
                    <div className="mt-4 p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                      <div className="flex items-center justify-between text-xs font-bold text-sky-700 dark:text-sky-300 mb-2">
                        <span className="flex items-center gap-2">
                          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin text-sky-500" />
                          <span>Audit Playwright en cours...</span>
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-wider text-sky-600 dark:text-sky-400">
                          Temps réel
                        </span>
                      </div>
                      <div className="w-full bg-sky-500/20 h-2 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full rounded-full w-3/4 animate-pulse transition-all duration-300" />
                      </div>
                    </div>
                  )}

                  {/* Critical Alert Callout (Bolder + Colorize) */}
                  {status === 'regression' && (
                    <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-rose-700 dark:text-rose-300 block">
                          {lastScan?.critical_count ?? 1} régression(s) bloquante(s) détectée(s)
                        </span>
                        <p className="text-rose-600/90 dark:text-rose-400/90 mt-0.5 leading-relaxed">
                          Échecs sur les parcours critiques ou formulaires. Ouvrez le diagnostic pour corriger.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Warning Callout */}
                  {status === 'warning' && (
                    <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                      <ExclamationCircleIcon className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-amber-700 dark:text-amber-300 block">
                          {lastScan?.major_count ?? 0} anomalie(s) non bloquante(s)
                        </span>
                        <p className="text-amber-600/90 dark:text-amber-400/90 mt-0.5">
                          Des vérifications secondaires ou temps de réponse nécessitent votre attention.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Metrics Row (Bolder + Clarify: Couverture & Taux de succès) */}
                  {status !== 'never_scanned' && lastScan && (
                    <div className="mt-4 grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Couverture
                        </span>
                        <span className="font-black text-foreground font-mono text-sm mt-0.5 block tabular-nums">
                          {lastScan.pages_discovered ?? 0} URL{((lastScan.pages_discovered ?? 0) > 1) ? 's' : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Conformité
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-black text-foreground font-mono text-sm tabular-nums">
                            {lastScan.checks_passed ?? 0}/{lastScan.checks_total ?? 0}
                          </span>
                          {lastScan.checks_total ? (
                            <span className="text-[11px] font-bold text-muted-foreground font-mono">
                              ({Math.round(((lastScan.checks_passed ?? 0) / (lastScan.checks_total || 1)) * 100)}%)
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Never Scanned Notice */}
                  {status === 'never_scanned' && (
                    <div className="mt-4 p-3.5 rounded-xl bg-muted/30 border border-dashed border-border text-xs text-muted-foreground flex items-center gap-2.5">
                      <SparklesIcon className="h-4 w-4 text-[#ee6018] shrink-0" />
                      <span>Aucun diagnostic exécuté. Lancez un premier run pour établir la référence QA.</span>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions (Adapt + Animate: 44px min-touch target) */}
                <div className="mt-5 pt-4 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {status === 'never_scanned' ? (
                    <button
                      type="button"
                      onClick={() => setScanModalSite(site)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#ee6018] hover:bg-[#d95514] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-xs transition-all duration-150 cursor-pointer min-h-[44px]"
                    >
                      <PlayIcon className="h-4 w-4 fill-current" />
                      <span>Lancer le premier scan</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={status === 'running'}
                        onClick={() => setScanModalSite(site)}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-border bg-background hover:bg-muted/80 active:scale-[0.98] text-xs font-bold text-foreground disabled:opacity-50 transition-all duration-150 cursor-pointer min-h-[44px]"
                      >
                        {status === 'running' ? (
                          <>
                            <ArrowPathIcon className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            <span>Scan en cours...</span>
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-3.5 w-3.5 text-muted-foreground fill-current" />
                            <span>Re-tester</span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/dashboard/sites/${site.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-foreground text-background hover:opacity-90 active:scale-[0.98] text-xs font-bold transition-all duration-150 min-h-[44px]"
                      >
                        <span>Workspace</span>
                        <ArrowUpRightIcon className="h-3.5 w-3.5 opacity-80" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <AddSiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(siteId) => {
          const newlyCreated = sites?.find((s) => s.id === siteId)
          if (newlyCreated) {
            setScanModalSite(newlyCreated)
          }
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
