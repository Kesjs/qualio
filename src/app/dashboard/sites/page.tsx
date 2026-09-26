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
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  SignalIcon,
  ArrowUpRightIcon,
  ExclamationCircleIcon,
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

export default function SitesPage() {
  const { data: sites, isLoading, error } = useSites()
  const [search, setSearch] = useState('')
  const [envFilter, setEnvFilter] = useState<'all' | 'production' | 'staging'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [scanModalSite, setScanModalSite] = useState<SiteWithLastScan | null>(null)

  // Filtered sites
  const filteredSites = useMemo(() => {
    if (!sites) return []
    return sites.filter((site) => {
      // Search filter
      const matchesSearch =
        site.url.toLowerCase().includes(search.toLowerCase()) ||
        (site.name && site.name.toLowerCase().includes(search.toLowerCase()))

      // Environment filter
      const siteEnv = site.environment || 'production'
      const matchesEnv = envFilter === 'all' || siteEnv === envFilter

      // Status filter
      const status = computeSiteStatus(site)
      const matchesStatus = statusFilter === 'all' || status === statusFilter

      return matchesSearch && matchesEnv && matchesStatus
    })
  }, [sites, search, envFilter, statusFilter])

  return (
    <div className="space-y-7">
      {/* 1. Header (Wireframe: Title + Description + Search / Action Bar) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans">
              Sites
            </h1>
            {sites && sites.length > 0 && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200/60 dark:bg-[#16181E] dark:text-zinc-300 dark:border-white/[0.08]">
                {sites.length} configuré{sites.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Gérez vos environnements Web et déclenchez des tests QA automatisés en continu.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#ee6018] text-white text-xs font-semibold shadow-sm shadow-[#ee6018]/25 hover:bg-[#d95514] transition-all cursor-pointer shrink-0"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Ajouter un site</span>
        </button>
      </div>

      {/* 2. Filter Bar (Search + Environment + Status Filter) */}
      {sites && sites.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:bg-[#16181E] dark:border-white/[0.08]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un site par nom ou URL..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-gray-50/80 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ee6018] dark:bg-[#111216] dark:border-white/[0.08] dark:text-white dark:placeholder:text-zinc-500 transition-all font-sans"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Environment Filter */}
            <Select value={envFilter} onValueChange={(val: any) => setEnvFilter(val)}>
              <SelectTrigger className="w-[175px] h-8 text-xs font-medium bg-white border-gray-200 dark:bg-[#111216] dark:border-white/[0.08]">
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
              <SelectTrigger className="w-[175px] h-8 text-xs font-medium bg-white border-gray-200 dark:bg-[#111216] dark:border-white/[0.08]">
                <SelectValue placeholder="Statut">
                  {(val) => {
                    const labels: Record<string, string> = {
                      all: 'Statut: Tous',
                      healthy: 'Statut: Sain',
                      regression: 'Statut: Régression',
                      warning: 'Statut: Warning',
                      running: 'Statut: En cours',
                      never_scanned: 'Statut: Non scanné',
                      scan_failed: 'Statut: Échec',
                    }
                    return labels[val] || 'Statut: Tous'
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">Statut: Tous</SelectItem>
                <SelectItem value="healthy">Healthy (Sain)</SelectItem>
                <SelectItem value="regression">Régression</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="running">En cours</SelectItem>
                <SelectItem value="never_scanned">Non scanné</SelectItem>
                <SelectItem value="scan_failed">Échec</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* 3. Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-56 rounded-xl border border-gray-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:bg-[#16181E] dark:border-white/[0.08] space-y-4 animate-pulse flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-gray-200/60 dark:bg-white/[0.06] rounded-md" />
                    <div className="h-5 w-20 bg-gray-200/60 dark:bg-white/[0.06] rounded-md" />
                  </div>
                  <div className="h-4 w-24 bg-gray-100 dark:bg-white/[0.04] rounded" />
                </div>
                <div className="h-5 w-48 bg-gray-200/80 dark:bg-white/[0.08] rounded mt-2" />
                <div className="h-4 w-36 bg-gray-100 dark:bg-white/[0.04] rounded mt-2" />
                <div className="h-12 w-full bg-gray-50/80 dark:bg-[#111216]/50 rounded-lg mt-4 border border-gray-100 dark:border-white/[0.04]" />
              </div>
              <div className="flex gap-3 border-t border-gray-100 dark:border-white/[0.06] pt-4 mt-4">
                 <div className="h-8 w-1/2 bg-gray-200/60 dark:bg-white/[0.04] rounded-lg" />
                 <div className="h-8 w-1/2 bg-gray-900/10 dark:bg-white/[0.06] rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Error State */}
      {error && (
        <div className="p-5 rounded-xl bg-red-50/80 border border-red-200 text-xs text-red-700 flex items-start gap-3">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <h4 className="font-bold text-red-900">Erreur de chargement des sites</h4>
            <p className="mt-0.5">{error.message || 'Impossible de joindre la base de données.'}</p>
          </div>
        </div>
      )}

      {/* 5. Empty State (Specification Wireframe B) */}
      {!isLoading && !error && sites && sites.length === 0 && (
        <EmptyState
          title="Aucun site surveillé pour le moment"
          message="Ajoutez votre premier site web ou application pour lancer une analyse Playwright et obtenir votre premier diagnostic chirurgical par IA."
          actionLabel="Ajouter mon premier site"
          actionIcon={PlusIcon}
          onActionClick={() => setIsAddModalOpen(true)}
          mainIcon={GlobeAltIcon}
          iconVariant="orange"
          className="my-8"
        />
      )}

      {!isLoading && !error && sites && sites.length > 0 && filteredSites.length === 0 && (
        <EmptyState
          title="Aucun résultat trouvé"
          message="Aucun site ne correspond à vos filtres de recherche ou de statut actuels. Modifiez vos critères de recherche."
          mainIcon={MagnifyingGlassIcon}
          iconVariant="neutral"
          className="my-8"
        />
      )}

      {/* 6. Sites Grid (Specification Wireframe C & Stitch 4-variant cards) */}
      {!isLoading && !error && filteredSites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSites.map((site: any) => {
            const status = computeSiteStatus(site)
            const env = site.environment || 'production'
            const lastScan = site.last_scan

            // Compute relative time
            const lastScanTime = lastScan?.started_at || lastScan?.created_at
            const timeAgoText = lastScanTime
              ? formatDistanceToNow(new Date(lastScanTime), { addSuffix: true, locale: fr })
              : 'Jamais'

            return (
              <div
                key={site.id}
                className="relative rounded-xl border border-gray-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-gray-300 dark:bg-[#16181E] dark:border-white/[0.08] dark:hover:border-white/20 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Status Badge + Environment Badge + Time-ago */}
                  <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-gray-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      {/* Status Badge (The 7 states) */}
                      {status === 'healthy' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25">
                          <span className="h-1.5 w-1.5 rounded-xs bg-emerald-500" />
                          <span>HEALTHY</span>
                        </span>
                      )}

                      {status === 'regression' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25">
                          <span className="h-1.5 w-1.5 rounded-xs bg-rose-500" />
                          <span>REGRESSION</span>
                        </span>
                      )}

                      {status === 'running' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25">
                          <span className="h-1.5 w-1.5 rounded-xs bg-sky-500 animate-pulse" />
                          <span>RUNNING</span>
                        </span>
                      )}

                      {status === 'queued' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25">
                          <ClockIcon className="h-3 w-3 text-blue-500" />
                          <span>EN ATTENTE</span>
                        </span>
                      )}

                      {status === 'warning' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25">
                          <ExclamationTriangleIcon className="h-3 w-3 text-amber-500" />
                          <span>WARNING</span>
                        </span>
                      )}

                      {status === 'scan_failed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200/60 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25">
                          <ExclamationCircleIcon className="h-3 w-3 text-red-500" />
                          <span>ÉCHEC TECHNIQUE</span>
                        </span>
                      )}

                      {status === 'never_scanned' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200/60 dark:bg-white/[0.08] dark:text-zinc-300 dark:border-white/[0.1]">
                          <span>NON SCANNÉ</span>
                        </span>
                      )}

                      {/* Environment Tag */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          env === 'production'
                            ? 'bg-violet-50 text-violet-700 border border-violet-200/50 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/25'
                            : 'bg-gray-100 text-gray-600 border border-gray-200/50 dark:bg-white/[0.08] dark:text-zinc-300 dark:border-white/[0.1]'
                        }`}
                      >
                        {env}
                      </span>
                    </div>

                    {/* Time-ago timestamp */}
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                      <ClockIcon className="h-3 w-3" />
                      <span>{timeAgoText}</span>
                    </div>
                  </div>

                  {/* Main Information: Name + Clickable URL */}
                  <div className="mt-4">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-[#ee6018] dark:group-hover:text-[#ff7836] transition-colors leading-snug">
                      {site.name || new URL(site.url).hostname}
                    </h3>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 font-mono mt-0.5 transition-colors"
                    >
                      <span>{site.url}</span>
                      <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                    </a>
                  </div>

                  {/* In-progress status message if RUNNING */}
                  {status === 'running' && (
                    <div className="mt-4 p-3 rounded-lg bg-sky-50/80 border border-sky-100 dark:bg-sky-500/10 dark:border-sky-500/20">
                      <div className="flex items-center justify-between text-xs font-semibold text-sky-800 dark:text-sky-300 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin text-sky-600 dark:text-sky-400" />
                          <span>Scan Playwright en cours...</span>
                        </span>
                        <span className="font-mono text-[11px]">En direct</span>
                      </div>
                      <div className="w-full bg-sky-200/60 dark:bg-sky-900/40 h-1.5 rounded-xs overflow-hidden">
                        <div className="bg-sky-500 h-full rounded-xs w-2/3 animate-pulse" />
                      </div>
                    </div>
                  )}

                  {/* Critical Alert Banner if REGRESSION */}
                  {status === 'regression' && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50/80 border border-red-200/80 dark:bg-rose-500/10 dark:border-rose-500/20 flex items-start gap-2.5">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-red-800 dark:text-rose-300">
                        <span className="font-bold">
                          {lastScan?.critical_count ?? 1} anomalie(s) critique(s) détectée(s)
                        </span>
                        <p className="text-[11px] text-red-600 dark:text-rose-400 mt-0.5">
                          Vérifiez les CTAs ou formulaires bloqués dans le workspace.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Metrics Row (Wireframe: Pages testées & Durée) */}
                  {status !== 'never_scanned' && lastScan && (
                    <div className="mt-4 grid grid-cols-2 gap-3 p-3 rounded-lg bg-gray-50/80 border border-gray-100 dark:bg-[#111216] dark:border-white/[0.06] text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                          Pages testées
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white font-mono text-xs mt-0.5 block tabular-nums">
                          {lastScan.pages_discovered ?? 0} URLs
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                          Vérifications
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white font-mono text-xs mt-0.5 block tabular-nums">
                          {lastScan.checks_passed ?? 0} / {lastScan.checks_total ?? 0} OK
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Never Scanned Notice */}
                  {status === 'never_scanned' && (
                    <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100 dark:bg-[#111216] dark:border-white/[0.06] text-xs text-gray-500 dark:text-zinc-400">
                      Aucun scan automatisé exécuté pour cet environnement. Lancez votre premier run.
                    </div>
                  )}
                </div>

                {/* Card Footer Actions (Tester maintenant + Ouvrir le Workspace) */}
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/[0.06] flex items-center gap-2.5">
                  {status === 'never_scanned' ? (
                    <button
                      type="button"
                      onClick={() => setScanModalSite(site)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#ee6018] text-white text-xs font-semibold shadow-sm shadow-[#ee6018]/25 hover:bg-[#d95514] transition-all cursor-pointer"
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
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:border-white/[0.08] dark:bg-[#111216] dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-white disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {status === 'running' ? (
                          <>
                            <ArrowPathIcon className="h-3.5 w-3.5 animate-spin text-gray-400" />
                            <span>En cours...</span>
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-3 w-3 text-gray-500 dark:text-zinc-400 fill-current" />
                            <span>Tester maintenant</span>
                          </>
                        )}
                      </button>

                      <Link
                        href={`/dashboard/sites/${site.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 transition-all"
                      >
                        <span>Ouvrir le Workspace</span>
                        <ArrowUpRightIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-600" />
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
          // Open scan modal directly on the newly created site
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
