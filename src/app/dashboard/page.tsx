'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  PlayIcon,
  CheckCircleIcon,
  ArrowUpRightIcon,
  ArrowRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { useSites, SiteWithLastScan } from '@/lib/hooks/useSites'
import { useScans, ScanWithSite } from '@/lib/hooks/useScan'
import { AddSiteModal } from '@/components/dashboard/AddSiteModal'
import { RunScanModal } from '@/components/dashboard/RunScanModal'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow, format, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'

function ActivationPanel({
  site,
  hasCompletedScan,
  onAddSite,
  onRunScan,
}: {
  site?: SiteWithLastScan
  hasCompletedScan: boolean
  onAddSite: () => void
  onRunScan: () => void
}) {
  const siteAdded = Boolean(site)
  const completedSteps = Number(siteAdded) + Number(hasCompletedScan) + Number(hasCompletedScan)

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]" aria-labelledby="activation-title">
      <div className="flex flex-col gap-4 border-b border-gray-200/80 px-5 py-5 sm:flex-row sm:items-end sm:justify-between dark:border-white/[0.08]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ee6018]">Premières étapes</p>
          <h2 id="activation-title" className="mt-1 text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
            Mettez votre espace en mouvement
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-500 dark:text-zinc-400">
            Trois actions réelles pour passer d’un espace vide à votre premier signal QA.
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-gray-500 dark:text-zinc-400">
          {Math.min(completedSteps, 3)} / 3 étapes
        </span>
      </div>

      <div className="divide-y divide-gray-200/80 dark:divide-white/[0.08]">
        <div className="flex items-center gap-3 px-5 py-4">
          <CheckCircleIcon className={`h-5 w-5 shrink-0 ${siteAdded ? 'text-emerald-500' : 'text-gray-300 dark:text-zinc-700'}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Ajouter votre premier site</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">Une URL publique ou un environnement de staging.</p>
          </div>
          {!siteAdded && <button type="button" onClick={onAddSite} className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#ee6018] px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-[#ee6018]/20 transition-colors hover:bg-[#d95514] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018]/40">Ajouter un site<ArrowRightIcon className="h-3.5 w-3.5" /></button>}
        </div>

        <div className="flex items-center gap-3 px-5 py-4">
          <CheckCircleIcon className={`h-5 w-5 shrink-0 ${hasCompletedScan ? 'text-emerald-500' : 'text-gray-300 dark:text-zinc-700'}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Lancer votre premier scan</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">Qualio teste les parcours et collecte les preuves dans un vrai navigateur.</p>
          </div>
          {!hasCompletedScan && <button type="button" onClick={onRunScan} disabled={!siteAdded} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/[0.12] dark:bg-transparent dark:text-zinc-200 dark:hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018]/40">{siteAdded ? 'Lancer le scan' : 'Ajoutez un site d’abord'}<ArrowRightIcon className="h-3.5 w-3.5" /></button>}
        </div>

        <div className="flex items-center gap-3 px-5 py-4">
          <CheckCircleIcon className={`h-5 w-5 shrink-0 ${hasCompletedScan ? 'text-emerald-500' : 'text-gray-300 dark:text-zinc-700'}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Consulter votre premier diagnostic</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">Retrouvez les incidents, les preuves et le prompt de correction.</p>
          </div>
          {hasCompletedScan && <Link href="/dashboard/scans" className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.12] dark:text-zinc-200 dark:hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018]/40">Voir le rapport<ArrowRightIcon className="h-3.5 w-3.5" /></Link>}
          {!hasCompletedScan && <DocumentTextIcon className="hidden h-5 w-5 text-gray-300 dark:text-zinc-700 sm:block" />}
        </div>
      </div>
    </section>
  )
}

export default function OverviewPage() {
  const { data: sites, isLoading: sitesLoading } = useSites()
  const { data: scans, isLoading: scansLoading } = useScans()

  // Filtre période (Pills)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  // Filtres table
  const [tableSearch, setTableSearch] = useState('')
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'success' | 'regression' | 'failed'>('all')
  const [auditPage, setAuditPage] = useState(1)
  const auditPageSize = 10

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)
  const [scanModalInitialSite, setScanModalInitialSite] = useState<SiteWithLastScan | undefined>(undefined)

  // ─── 1. Calculs des KPIs (Zéro faux chiffre, 100% données réelles) ─────────
  const kpiData = useMemo(() => {
    const totalSites = sites?.length ?? 0
    const totalScans = scans?.length ?? 0

    const criticalIssues =
      sites?.reduce((acc, s) => acc + (s.last_scan?.critical_count ?? 0), 0) ?? 0

    const totalPassed =
      sites?.reduce((acc, s) => acc + (s.last_scan?.checks_passed ?? 0), 0) ?? 0
    const totalChecks =
      sites?.reduce((acc, s) => acc + (s.last_scan?.checks_total ?? 0), 0) ?? 0

    let healthPercent = 100
    if (totalChecks > 0) {
      healthPercent = Number(((totalPassed / totalChecks) * 100).toFixed(1))
    }

    const prodSites = sites?.filter((s) => (s.environment || 'production') === 'production').length ?? 0
    const stagingSites = sites?.filter((s) => s.environment === 'staging').length ?? 0

    // Découpage précis pour action immédiate
    const regressionSites: SiteWithLastScan[] = []
    const warningSites: SiteWithLastScan[] = []
    const healthySites: SiteWithLastScan[] = []
    const unscannedSites: SiteWithLastScan[] = []

    sites?.forEach((s) => {
      if (!s.last_scan) {
        unscannedSites.push(s)
      } else if ((s.last_scan.critical_count ?? 0) > 0 || s.last_scan.status === 'failed') {
        regressionSites.push(s)
      } else if ((s.last_scan.major_count ?? 0) > 0 || (s.last_scan.checks_warning ?? 0) > 0) {
        warningSites.push(s)
      } else {
        healthySites.push(s)
      }
    })

    return {
      totalSites,
      totalScans,
      criticalIssues,
      healthPercent,
      totalPassed,
      totalChecks,
      prodSites,
      stagingSites,
      regressionSites,
      warningSites,
      healthySites,
      unscannedSites,
    }
  }, [sites, scans])

  // ─── 2. Histogramme d'Activité Réelle (période sélectionnée) ──────────────
  const dailyActivity = useMemo(() => {
    const periodDays = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const bucketCount = 7
    const bucketSize = Math.ceil(periodDays / bucketCount)
    const now = new Date()

    const days = Array.from({ length: bucketCount }, (_, index) => {
      const endOffset = (bucketCount - 1 - index) * bucketSize
      const startOffset = Math.min(periodDays - 1, endOffset + bucketSize - 1)
      const startDate = subDays(now, startOffset)
      const endDate = subDays(now, endOffset)
      const startTime = new Date(startDate).setHours(0, 0, 0, 0)
      const endTime = new Date(endDate).setHours(23, 59, 59, 999)
      const matchingScans = scans?.filter((scan) => {
        if (!scan.created_at) return false
        const createdAt = new Date(scan.created_at).getTime()
        return createdAt >= startTime && createdAt <= endTime
      }) ?? []

      const dayLetter = periodDays === 7
        ? format(endDate, 'EEEEE', { locale: fr }).toUpperCase()
        : `${format(startDate, 'd', { locale: fr })}–${format(endDate, 'd', { locale: fr })}`
      const dayLabel = periodDays === 7
        ? format(endDate, 'd MMM', { locale: fr })
        : `${format(startDate, 'd MMM', { locale: fr })} – ${format(endDate, 'd MMM', { locale: fr })}`

      return {
        letter: dayLetter,
        label: dayLabel,
        scanCount: matchingScans.length,
        passed: matchingScans.reduce((total, scan) => total + (scan.checks_passed ?? 0), 0),
        warning: matchingScans.reduce((total, scan) => total + (scan.checks_warning ?? 0), 0),
        failed: matchingScans.reduce((total, scan) => total + (scan.checks_failed ?? scan.critical_count ?? 0), 0),
        totalChecks: matchingScans.reduce((total, scan) => total + (scan.checks_total ?? 0), 0),
        date: endDate,
      }
    })

    const maxChecks = Math.max(...days.map((d) => d.totalChecks), 1)

    return days.map((d, index) => ({
      ...d,
      heightPercent: `${d.totalChecks > 0 ? Math.max(Math.round((d.totalChecks / maxChecks) * 100), 12) : 12}%`,
      isToday: index === days.length - 1,
    }))
  }, [dateRange, scans])

  // ─── 3. Table des Scans Filtrée ───────────────────────────────────────────
  const filteredScans = useMemo(() => {
    if (!scans) return []
    return scans.filter((scan) => {
      const siteUrl = scan.sites?.url?.toLowerCase() ?? ''
      const siteName = scan.sites?.name?.toLowerCase() ?? ''
      const scanId = scan.id.toLowerCase()
      const q = tableSearch.toLowerCase().trim()

      const matchesSearch = !q || siteUrl.includes(q) || siteName.includes(q) || scanId.includes(q)

      let matchesStatus = true
      if (tableStatusFilter === 'success') {
        matchesStatus = scan.status === 'completed' && (scan.critical_count ?? 0) === 0
      } else if (tableStatusFilter === 'regression') {
        matchesStatus = (scan.critical_count ?? 0) > 0
      } else if (tableStatusFilter === 'failed') {
        matchesStatus = scan.status === 'failed'
      }

      return matchesSearch && matchesStatus
    })
  }, [scans, tableSearch, tableStatusFilter])

  useEffect(() => {
    setAuditPage(1)
  }, [tableSearch, tableStatusFilter])

  const paginatedScans = filteredScans.slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize)

  const handleLaunchScanClick = (site?: SiteWithLastScan) => {
    if (!sites || sites.length === 0) {
      setIsAddModalOpen(true)
    } else {
      setScanModalInitialSite(site)
      setIsScanModalOpen(true)
    }
  }


  const getEnvironmentLabel = (site: SiteWithLastScan) =>
    site.environment === 'staging' ? 'Staging' : 'Production'

  const getScanSummary = (site: SiteWithLastScan) => {
    const summary = site.last_scan?.summary?.trim()
    if (summary) return summary

    const failedChecks = site.last_scan?.checks_failed ?? 0
    return failedChecks > 0
      ? `${failedChecks} contrôle${failedChecks > 1 ? 's' : ''} en échec lors du dernier scan.`
      : 'Régression détectée lors du dernier scan.'
  }

  const isLoading = sitesLoading || scansLoading
  const firstSite = sites?.[0]
  const hasCompletedScan = scans?.some((scan) => scan.status === 'completed') ?? false
  const showActivationPanel = !isLoading && (!sites?.length || !hasCompletedScan)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ─── A. Header & Action Directe (Bolder & Clarify & Adapt) ─────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100 font-sans">
              Overview
            </h1>
            {sites && sites.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200/80 dark:bg-white/[0.06] dark:text-zinc-300 dark:border-white/[0.08] tabular-nums">
                {sites.length} site{sites.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Supervision continue et conformité QA automatisée de vos environnements Web.
          </p>
        </div>

        {/* Toolbar Responsive */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {/* Segmented Control (7j / 30j / 90j) */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-gray-50/90 dark:bg-[#111216]">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                aria-pressed={dateRange === r}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-150 cursor-pointer ${
                  dateRange === r
                    ? 'bg-white text-gray-950 shadow-xs dark:bg-[#1E2028] dark:text-white'
                    : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {r === '7d' ? '7j' : r === '30d' ? '30j' : '90j'}
              </button>
            ))}
          </div>

          {/* Bouton Primaire Impeccable (Signal Orange) */}
          <button
            type="button"
            onClick={() => handleLaunchScanClick()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ee6018] text-white text-xs font-bold shadow-md shadow-[#ee6018]/25 hover:bg-[#d95514] active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:cursor-wait disabled:opacity-60"
          >
            <PlayIcon className="h-4 w-4 fill-current" />
            <span>Lancer un scan</span>
          </button>
        </div>
      </div>

      {/* ─── B. Data Loading State: shell first, real content after queries ──── */}
      {isLoading && (
        <div className="rounded-xl border border-gray-200/80 bg-white px-5 py-5 dark:border-white/[0.08] dark:bg-[#181B21]" aria-label="Chargement des données du tableau de bord" aria-busy="true">
          <div className="flex items-start justify-between gap-4 border-b border-gray-200/80 pb-5 dark:border-white/[0.08]">
            <div className="space-y-2">
              <Skeleton className="h-2.5 w-24 bg-gray-200/80 dark:bg-white/[0.08]" />
              <Skeleton className="h-5 w-56 bg-gray-200/80 dark:bg-white/[0.08]" />
              <Skeleton className="h-3 w-72 max-w-[70vw] bg-gray-200/80 dark:bg-white/[0.08]" />
            </div>
            <Skeleton className="h-4 w-12 bg-gray-200/80 dark:bg-white/[0.08]" />
          </div>
          <div className="divide-y divide-gray-200/80 dark:divide-white/[0.08]">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-3 py-4">
                <Skeleton className="h-5 w-5 rounded-full bg-gray-200/80 dark:bg-white/[0.08]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-44 bg-gray-200/80 dark:bg-white/[0.08]" />
                  <Skeleton className="h-2.5 w-64 max-w-[65vw] bg-gray-200/80 dark:bg-white/[0.08]" />
                </div>
                <Skeleton className="h-8 w-24 rounded-md bg-gray-200/80 dark:bg-white/[0.08]" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── C. Zero-Data State (EmptyState Standardisé) ────────────────────── */}
      {showActivationPanel && (
        <ActivationPanel
          site={firstSite}
          hasCompletedScan={hasCompletedScan}
          onAddSite={() => setIsAddModalOpen(true)}
          onRunScan={() => handleLaunchScanClick(firstSite)}
        />
      )}

      {/* ─── D. Dashboard Principal (Si des sites existent) ────────────────── */}
      {!isLoading && sites && sites.length > 0 && (
        <>
          {/* Grille des 4 KPIs Principaux (Colorize & Bolder) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]">
              {/* 1. Sites Surveillés */}
              <Link
                href="/dashboard/sites"
                aria-label="Voir les sites surveillés"
                className="group px-4 py-3 transition-colors hover:bg-gray-50/80 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#ee6018]/40 dark:hover:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-zinc-500">
                    Sites surveillés
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100 font-sans tabular-nums">
                    {kpiData.totalSites}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-zinc-400">
                    <span className="text-violet-600 dark:text-violet-400">{kpiData.prodSites} prod</span>
                    <span>·</span>
                    <span>{kpiData.stagingSites} staging</span>
                  </div>
                </div>
              </Link>

              {/* 2. Vérifications Playwright */}
              <Link
                href="/dashboard/scans"
                aria-label="Voir les scans exécutés"
                className="group border-l border-gray-200/80 px-4 py-3 transition-colors hover:bg-gray-50/80 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#ee6018]/40 dark:border-white/[0.08] dark:hover:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-zinc-500">
                    Scans exécutés
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100 font-sans tabular-nums">
                    {kpiData.totalScans}
                  </span>
                  <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400 tabular-nums">
                    {kpiData.totalChecks} checks
                  </span>
                </div>
              </Link>

              {/* 3. Régressions Critiques (Colorize & Bolder Alert) */}
              <Link
                href="/dashboard/bugs"
                aria-label="Voir les bugs critiques"
                className="group border-l border-gray-200/80 px-4 py-3 transition-colors hover:bg-gray-50/80 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#ee6018]/40 dark:border-white/[0.08] dark:hover:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-zinc-500">
                    Bugs critiques
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100 font-sans tabular-nums">
                    {kpiData.criticalIssues}
                  </span>
                  <span
                    className={`text-[11px] font-medium ${
                      kpiData.criticalIssues > 0
                        ? 'text-rose-700 dark:text-rose-300'
                        : 'text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {kpiData.criticalIssues > 0 ? 'Action requise' : '0 bloquant'}
                  </span>
                </div>
              </Link>

              {/* 4. Santé Globale (Barre de Progression Vivante) */}
              <Link
                href="/dashboard/sites"
                aria-label="Voir la conformité globale des sites"
                className="group border-l border-gray-200/80 px-4 py-3 transition-colors hover:bg-gray-50/80 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#ee6018]/40 dark:border-white/[0.08] dark:hover:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-500 dark:text-zinc-500">
                    Taux de conformité
                  </span>
                </div>
                <div className="mt-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100 font-sans tabular-nums">
                      {kpiData.healthPercent}%
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 tabular-nums">
                      {kpiData.totalPassed}/{kpiData.totalChecks || '0'} OK
                    </span>
                  </div>
                  {/* Subtle Colored Progress Bar */}
                  <div
                    className="group/health relative h-2 w-full bg-gray-100 rounded-full dark:bg-white/[0.08]"
                    role="img"
                    aria-label={`${kpiData.healthPercent}% de conformité, ${kpiData.totalPassed} contrôles réussis sur ${kpiData.totalChecks || 0}`}
                  >
                    <div
                      style={{ width: `${kpiData.healthPercent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        kpiData.healthPercent >= 90
                          ? 'bg-emerald-500'
                          : kpiData.healthPercent >= 70
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-950 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg group-hover/health:block dark:bg-white dark:text-gray-950">
                      {kpiData.totalPassed} réussis · {Math.max(kpiData.totalChecks - kpiData.totalPassed, 0)} à revoir
                    </span>
                  </div>
                </div>
              </Link>
          </div>

          {/* ─── D. Colonnes Opérationnelles (Clarify & Bolder & Adapt) ──────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Colonne Gauche : Sites nécessitant une action (7 cols) */}
            <div className="lg:col-span-7 overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:bg-[#181B21] dark:border-white/[0.08]">
              <div>
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                  <div>
                    <h2 className="text-sm font-extrabold text-gray-950 dark:text-white uppercase tracking-wider">
                      Sites nécessitant une action
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 font-medium">
                      Environnements avec régressions, anomalies ou audits en attente.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.08] text-gray-700 dark:text-zinc-300 tabular-nums">
                    {kpiData.regressionSites.length + kpiData.warningSites.length + kpiData.unscannedSites.length} site{(kpiData.regressionSites.length + kpiData.warningSites.length + kpiData.unscannedSites.length) > 1 ? 's' : ''} à vérifier
                  </span>
                </div>

                <div className="mt-3 px-4 pb-4">
                  {kpiData.regressionSites.length === 0 &&
                  kpiData.warningSites.length === 0 &&
                  kpiData.unscannedSites.length === 0 ? (
                    <div className="min-h-[190px] flex flex-col items-center justify-center text-center p-6 rounded-xl bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-500/[0.05] dark:border-emerald-500/15">
                      <CheckCircleIcon className="h-9 w-9 text-emerald-500 mb-2 stroke-[2]" />
                      <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                        Tous vos environnements sont sains
                      </h3>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-sm mt-1">
                        Aucun bug critique détecté. Tous les formulaires, CTA et navigations fonctionnent.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* 1. Sites en régression */}
                      {kpiData.regressionSites.map((site) => (
                        <div
                          key={site.id}
                          className="group relative flex flex-col gap-2.5 p-3 rounded-xl border border-rose-200/80 bg-rose-50/50 sm:flex-row sm:items-center sm:justify-between dark:border-rose-500/25 dark:bg-rose-500/[0.08] transition-all duration-150 hover:border-rose-300 dark:hover:border-rose-500/45 hover:shadow-xs"
                        >
                          <Link
                            href={`/dashboard/sites/${site.id}`}
                            aria-label={`Ouvrir le détail de ${site.name || site.url}`}
                            className="absolute inset-0 z-0 rounded-xl"
                          />
                          <div className="relative z-10 min-w-0 pr-3 pointer-events-none">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-950 dark:text-white truncate">
                                {site.name || site.url}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-rose-500 text-white shadow-2xs">
                                Bloquant
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mt-1 line-clamp-1">
                              {getScanSummary(site)}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono text-rose-800/80 dark:text-rose-200/75">
                              <span>{getEnvironmentLabel(site)}</span>
                              <span aria-hidden="true">·</span>
                              <span>{site.last_scan?.critical_count ?? 1} critique{(site.last_scan?.critical_count ?? 1) > 1 ? 's' : ''}</span>
                              {site.last_scan?.completed_at && <><span aria-hidden="true">·</span><span>scanné {formatDistanceToNow(new Date(site.last_scan.completed_at), { addSuffix: true, locale: fr })}</span></>}
                            </div>
                          </div>
                          <div className="relative z-10 flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => handleLaunchScanClick(site)}
                              aria-label={`Configurer un re-test pour ${site.name || site.url}`}
                              className="min-h-9 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#ee6018] text-white hover:bg-[#d95514] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#16181E] active:scale-[0.97] transition-all duration-150 cursor-pointer"
                            >
                              Re-tester
                            </button>
                            <Link
                              href={`/dashboard/sites/${site.id}`}
                              aria-label={`Voir le détail de ${site.name || site.url}`}
                              className="min-h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-950 dark:text-zinc-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#16181E] transition-colors"
                            >
                              <span>Voir</span>
                              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      ))}

                      {/* 2. Sites en warning */}
                      {kpiData.warningSites.map((site) => (
                        <div
                          key={site.id}
                          className="group relative flex flex-col gap-2.5 p-3 rounded-xl border border-amber-200/80 bg-amber-50/50 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/25 dark:bg-amber-500/[0.08] transition-all duration-150 hover:border-amber-300 dark:hover:border-amber-500/45 hover:shadow-xs"
                        >
                          <Link
                            href={`/dashboard/sites/${site.id}`}
                            aria-label={`Ouvrir le détail de ${site.name || site.url}`}
                            className="absolute inset-0 z-0 rounded-xl"
                          />
                          <div className="relative z-10 min-w-0 pr-3 pointer-events-none">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-950 dark:text-white truncate">
                                {site.name || site.url}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-amber-500 text-white shadow-2xs">
                                Warning
                              </span>
                            </div>
                            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mt-1">
                              {site.last_scan?.checks_warning ?? 0} point(s) d'attention non bloquant(s)
                            </p>
                            <p className="mt-1 text-[11px] font-mono text-amber-800/80 dark:text-amber-200/75">
                              {getEnvironmentLabel(site)}{site.last_scan?.completed_at ? ` · scanné ${formatDistanceToNow(new Date(site.last_scan.completed_at), { addSuffix: true, locale: fr })}` : ''}
                            </p>
                          </div>
                          <div className="relative z-10 flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <Link
                              href={`/dashboard/sites/${site.id}`}
                              className="min-h-9 px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100/60 dark:bg-[#1E2028] dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#16181E] active:scale-[0.97] transition-all duration-150"
                            >
                              Consulter
                            </Link>
                          </div>
                        </div>
                      ))}

                      {/* 3. Sites non scannés */}
                      {kpiData.unscannedSites.map((site) => (
                        <div
                          key={site.id}
                          className="group relative flex flex-col gap-2.5 p-3 rounded-xl border border-gray-200 bg-gray-50/70 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08] dark:bg-white/[0.03] transition-colors hover:border-gray-300 dark:hover:border-white/[0.16]"
                        >
                          <Link
                            href={`/dashboard/sites/${site.id}`}
                            aria-label={`Ouvrir le détail de ${site.name || site.url}`}
                            className="absolute inset-0 z-0 rounded-xl"
                          />
                          <div className="relative z-10 min-w-0 pr-3 pointer-events-none">
                            <span className="text-xs font-bold text-gray-900 dark:text-white truncate block">
                              {site.name || site.url}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-medium">
                              En attente d'un premier audit
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleLaunchScanClick(site)}
                            aria-label={`Lancer le premier audit pour ${site.name || site.url}`}
                            className="relative z-10 self-end sm:self-auto min-h-9 px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 dark:bg-[#1E2028] dark:border-white/[0.12] dark:text-zinc-200 dark:hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#16181E] active:scale-[0.97] transition-all duration-150 cursor-pointer"
                          >
                            Lancer le premier audit
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne Droite : Activité 7 jours & État du Parc (5 cols) */}
            <div className="lg:col-span-5 overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:bg-[#181B21] dark:border-white/[0.08]">
              <div>
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                  <div>
                    <h2 className="text-sm font-extrabold text-gray-950 dark:text-white uppercase tracking-wider">
                      Santé des scans
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 font-medium">
                      Répartition des contrôles sur la période sélectionnée.
                    </p>
                  </div>
                </div>

                {/* Histogramme Dynamique Réel */}
                <div className="mx-4 mt-4 h-32 flex items-end justify-between gap-3 pt-2 pb-1 border-b border-gray-100 dark:border-white/[0.06]">
                  {dailyActivity.every((dayItem) => dayItem.scanCount === 0) ? (
                    <div className="flex h-full w-full items-center justify-center text-center">
                      <div className="max-w-xs space-y-1 text-xs text-gray-500 dark:text-zinc-500">
                        <p className="font-semibold text-gray-600 dark:text-zinc-400">Aucun contrôle exécuté sur cette période.</p>
                        <p>Lancez un scan pour voir la répartition des résultats.</p>
                      </div>
                    </div>
                  ) : dailyActivity.map((dayItem) => (
                    <div
                      key={dayItem.date.toISOString()}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative"
                    >
                      {/* Tooltip au survol */}
                      <div className="absolute -top-28 hidden group-hover:flex group-focus-within:flex flex-col items-center z-20 pointer-events-none">
                        <span className="flex max-w-[220px] flex-col rounded px-2 py-1 text-center text-[10px] font-bold leading-relaxed bg-gray-950 text-white dark:bg-white dark:text-black whitespace-nowrap shadow-md">
                          <span>{dayItem.label}</span>
                          <span>{dayItem.scanCount} scan{dayItem.scanCount > 1 ? 's' : ''} · {dayItem.totalChecks} contrôles</span>
                          <span className="text-emerald-300">{dayItem.passed} réussis</span>
                          <span className="text-amber-300">{dayItem.warning} avertissements</span>
                          <span className="text-rose-300">{dayItem.failed} échecs</span>
                        </span>
                        <div className="w-1.5 h-1.5 bg-gray-950 dark:bg-white rotate-45 -mt-0.5" />
                      </div>

                      {/* Barre empilée : contrôles réussis / avertissements / échecs */}
                      <div
                        role="img"
                        tabIndex={0}
                        style={{ height: dayItem.heightPercent }}
                        className="group/bar flex w-full max-w-[30px] flex-col justify-end overflow-hidden rounded-t-md bg-gray-100 p-0 text-left transition-all duration-300 hover:ring-2 hover:ring-[#ee6018]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018]/50 focus-visible:ring-offset-2 dark:bg-white/[0.06] dark:focus-visible:ring-offset-[#181B21]"
                        aria-label={`${dayItem.label}: ${dayItem.passed} réussis, ${dayItem.warning} avertissements, ${dayItem.failed} échecs`}
                      >
                        {dayItem.totalChecks > 0 && (
                          <>
                            <div
                              style={{ height: `${(dayItem.failed / dayItem.totalChecks) * 100}%` }}
                              className="min-h-0 bg-rose-500 transition-all group-hover/bar:bg-rose-400"
                            />
                            <div
                              style={{ height: `${(dayItem.warning / dayItem.totalChecks) * 100}%` }}
                              className="min-h-0 bg-amber-400 transition-all group-hover/bar:bg-amber-300"
                            />
                            <div
                              style={{ height: `${(dayItem.passed / dayItem.totalChecks) * 100}%` }}
                              className="min-h-0 bg-emerald-500 transition-all group-hover/bar:bg-emerald-400"
                            />
                          </>
                        )}
                      </div>

                      {/* Jour */}
                      <span
                        className={`text-[10px] font-bold mt-2.5 tabular-nums whitespace-nowrap ${
                          dayItem.isToday
                            ? 'text-[#ee6018]'
                            : 'text-gray-400 dark:text-zinc-500'
                        }`}
                      >
                        {dayItem.letter}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mx-4 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-medium text-gray-500 dark:text-zinc-500">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" />Réussis</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400" />Avertissements</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-rose-500" />Échecs</span>
                </div>
              </div>

              {/* État Global du Parc */}
              <div className="mx-4 mt-3 pt-3 pb-4 border-t border-gray-100 dark:border-white/[0.06]">
                <div className="text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2.5">
                  Répartition du parc ({kpiData.totalSites} sites)
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20">
                    <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {kpiData.healthySites.length}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Sains
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200/60 dark:border-rose-500/20">
                    <div className="text-lg font-extrabold text-rose-700 dark:text-rose-400 tabular-nums">
                      {kpiData.regressionSites.length}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                      Anomalies
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08]">
                    <div className="text-lg font-extrabold text-gray-800 dark:text-zinc-200 tabular-nums">
                      {kpiData.unscannedSites.length}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                      En attente
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── E. Tableau : Derniers Audits Exécutés (Operate Table) ───────── */}
          <div className="rounded-xl border border-gray-200/90 bg-white shadow-xs overflow-hidden dark:bg-[#16181E] dark:border-white/[0.08]">
            {/* Header du Tableau avec Barre d'Action et Filtres Rapides */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 border-b border-gray-100 dark:border-white/[0.06]">
              <div>
                <h2 className="text-sm font-extrabold text-gray-950 dark:text-white uppercase tracking-wider">
                  Derniers audits automatisés
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 font-medium">
                  Preuves Playwright et rapports détaillés des exécutions récentes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {/* Filtre Statut Rapide (Pills) */}
                <div className="inline-flex items-center p-0.5 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-gray-50/90 dark:bg-[#111216]">
                  {(
                    [
                      { id: 'all', label: 'Tous' },
                      { id: 'success', label: 'Succès' },
                      { id: 'regression', label: 'Régression' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTableStatusFilter(f.id)}
                      aria-pressed={tableStatusFilter === f.id}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all duration-150 cursor-pointer ${
                        tableStatusFilter === f.id
                          ? 'bg-white text-gray-950 shadow-xs dark:bg-[#1E2028] dark:text-white'
                          : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Champ de Recherche Compact */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Filtrer un scan..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-50/80 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ee6018] dark:bg-[#111216] dark:border-white/[0.08] dark:text-white dark:placeholder:text-zinc-500 transition-all font-sans font-medium"
                  />
                </div>

                {/* Lien Voir tout */}
                <Link
                  href="/dashboard/scans"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-[#111216] dark:text-zinc-300 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <span>Tous les scans</span>
                  <ArrowTopRightOnSquareIcon className="h-3 w-3 text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Table Body */}
            {scansLoading ? (
              <div className="p-8 text-center text-xs text-gray-400 dark:text-zinc-500 flex items-center justify-center gap-2">
                <ArrowPathIcon className="h-4 w-4 animate-spin text-[#ee6018]" />
                <span>Chargement des audits...</span>
              </div>
            ) : filteredScans.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500 dark:text-zinc-400 font-medium">
                {scans && scans.length === 0
                  ? 'Aucun scan exécuté pour le moment. Cliquez sur "Lancer un scan" pour démarrer.'
                  : 'Aucun audit ne correspond à vos filtres.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[10px] dark:bg-[#111216]/90 dark:border-white/[0.06] dark:text-zinc-400">
                    <tr>
                      <th className="py-3 px-4">Site & Environnement</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Statut</th>
                      <th className="py-3 px-3">Conformité</th>
                      <th className="py-3 px-3">Anomalies</th>
                      <th className="py-3 px-4 text-right">Rapport</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                    {paginatedScans.map((scan) => {
                      const criticalCount = scan.critical_count ?? 0
                      const majorCount = scan.major_count ?? 0
                      const checksPassed = scan.checks_passed ?? 0
                      const checksTotal = scan.checks_total ?? 0
                      const isRunning = ['running', 'crawling', 'discovering', 'browser_testing'].includes(scan.status)
                      const isFailed = scan.status === 'failed'

                      const timeAgo = scan.created_at
                        ? formatDistanceToNow(new Date(scan.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })
                        : '—'

                      return (
                        <tr
                          key={scan.id}
                          className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors duration-100"
                        >
                          {/* Site: Nom + Badge Environnement */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-950 dark:text-white font-sans text-xs">
                                {scan.sites?.name || scan.sites?.url || 'Site'}
                              </span>
                              {scan.sites?.environment && (
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-extrabold tracking-wider ${
                                    scan.sites.environment === 'production'
                                      ? 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300'
                                      : 'bg-gray-100 text-gray-700 dark:bg-white/[0.08] dark:text-zinc-300'
                                  }`}
                                >
                                  {scan.sites.environment}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 dark:text-zinc-500 font-mono truncate max-w-xs mt-0.5">
                              {scan.sites?.url}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-3.5 px-3 text-gray-500 dark:text-zinc-400 font-medium tabular-nums whitespace-nowrap">
                            {timeAgo}
                          </td>

                          {/* Statut Badge */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                                isRunning
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25'
                                  : isFailed
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'
                                  : criticalCount > 0
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'
                                  : (scan.checks_warning ?? 0) > 0
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25'
                                  : scan.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/[0.08] dark:text-zinc-300'
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  isRunning
                                    ? 'bg-sky-500 animate-ping'
                                    : isFailed || criticalCount > 0
                                    ? 'bg-rose-500'
                                    : (scan.checks_warning ?? 0) > 0
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              <span>
                                {isRunning
                                  ? 'En cours'
                                  : isFailed
                                  ? 'Échec'
                                  : criticalCount > 0
                                  ? 'Régression'
                                  : (scan.checks_warning ?? 0) > 0
                                  ? 'Warning'
                                  : 'Healthy'}
                              </span>
                            </span>
                          </td>

                          {/* Conformité */}
                          <td className="py-3.5 px-3 tabular-nums font-bold text-gray-800 dark:text-zinc-200 whitespace-nowrap">
                            {checksTotal > 0 ? (
                              <span>
                                {checksPassed}/{checksTotal} ({Math.round((checksPassed / checksTotal) * 100)}%)
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-zinc-500 font-normal">—</span>
                            )}
                          </td>

                          {/* Anomalies */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {criticalCount > 0 ? (
                              <span className="text-rose-600 dark:text-rose-400 font-extrabold tabular-nums">
                                {criticalCount} critique{criticalCount > 1 ? 's' : ''}
                              </span>
                            ) : majorCount > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                                {majorCount} avertissement{majorCount > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">0 anomalie</span>
                            )}
                          </td>

                          {/* Action Ouvrir Workspace */}
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/dashboard/sites/${scan.site_id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#ee6018] hover:bg-[#ee6018]/10 dark:text-[#ff7836] transition-colors"
                            >
                              <span>Consulter</span>
                              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!scansLoading && filteredScans.length > 0 && (
              <Pagination
                page={auditPage}
                pageSize={auditPageSize}
                total={filteredScans.length}
                onPageChange={setAuditPage}
                label="audits"
              />
            )}
          </div>
        </>
      )}

      {/* ─── Modales ─────────────────────────────────────────────────────────── */}
      <AddSiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsScanModalOpen(true)
        }}
      />

      <RunScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        availableSites={sites ?? []}
        site={scanModalInitialSite}
      />
    </div>
  )
}
