'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  GlobeAltIcon,
  ArrowPathIcon,
  BugAntIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  PlayIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  XMarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { useSites, SiteWithLastScan } from '@/lib/hooks/useSites'
import { useScans, ScanWithSite } from '@/lib/hooks/useScan'
import { AddSiteModal } from '@/components/dashboard/AddSiteModal'
import { RunScanModal } from '@/components/dashboard/RunScanModal'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDistanceToNow, format, subDays, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function OverviewPage() {
  const { data: sites, isLoading: sitesLoading } = useSites()
  const { data: scans, isLoading: scansLoading } = useScans()

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [tableSearch, setTableSearch] = useState('')
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'success' | 'regression' | 'failed'>('all')

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)
  const [scanModalInitialSite, setScanModalInitialSite] = useState<SiteWithLastScan | undefined>(undefined)

  // ─── 1. Calculs des KPIs Réels ────────────────────────────────────────────
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

    // Sites classés par statut
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

  // ─── 2. Activité quotidienne des scans (7 derniers jours) ─────────────────
  const dailyActivity = useMemo(() => {
    const days = [6, 5, 4, 3, 2, 1, 0].map((offset) => {
      const date = subDays(new Date(), offset)
      const dayLetter = format(date, 'EEEEE', { locale: fr }).toUpperCase()
      const matchingScans =
        scans?.filter(
          (s) => s.created_at && isSameDay(new Date(s.created_at), date)
        ) ?? []

      return {
        letter: dayLetter,
        count: matchingScans.length,
        date,
      }
    })

    const maxCount = Math.max(...days.map((d) => d.count), 1)

    return days.map((d, index) => ({
      ...d,
      heightPercent: `${Math.max(Math.round((d.count / maxCount) * 100), 12)}%`,
      isToday: index === days.length - 1,
    }))
  }, [scans])

  // ─── 3. Table des scans filtrée ───────────────────────────────────────────
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

  const handleLaunchScanClick = (site?: SiteWithLastScan) => {
    if (!sites || sites.length === 0) {
      setIsAddModalOpen(true)
    } else {
      setScanModalInitialSite(site)
      setIsScanModalOpen(true)
    }
  }

  const isLoading = sitesLoading || scansLoading

  return (
    <div className="space-y-6">
      {/* ─── A. Header Opérationnel & Actions Directes ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans">
              Overview
            </h1>
            {sites && sites.length > 0 && (
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200/80 dark:bg-[#16181E] dark:text-zinc-300 dark:border-white/[0.08] tabular-nums">
                {sites.length} site{sites.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Supervision opérationnelle de vos environnements Web et conformité des déploiements.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Segmented Control : Période (Pas de dropdown inutile en Operate) */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-gray-200/90 bg-gray-50/80 dark:border-white/[0.08] dark:bg-[#111216]">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  dateRange === r
                    ? 'bg-white text-gray-900 shadow-2xs dark:bg-[#1E2028] dark:text-white'
                    : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {r === '7d' ? '7 jours' : r === '30d' ? '30 jours' : '90 jours'}
              </button>
            ))}
          </div>

          {/* CTA Principal : Lancer un scan */}
          <button
            type="button"
            onClick={() => handleLaunchScanClick()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#ee6018] text-white text-xs font-semibold shadow-sm shadow-[#ee6018]/25 hover:bg-[#d95514] active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlayIcon className="h-3.5 w-3.5 fill-current" />
            <span>Lancer un scan</span>
          </button>
        </div>
      </div>

      {/* ─── B. Zero-Data State (Utilisant le composant unifié EmptyState) ──── */}
      {!sitesLoading && (!sites || sites.length === 0) && (
        <EmptyState
          mainIcon={GlobeAltIcon}
          iconVariant="orange"
          title="Aucun site sous surveillance"
          message="Qualio a besoin d'au moins un site Web pour exécuter des vérifications Playwright et générer vos indicateurs de santé."
          actionLabel="Ajouter un premier site"
          actionIcon={PlusIcon}
          onActionClick={() => setIsAddModalOpen(true)}
        />
      )}

      {/* ─── C. Dashboard Opérationnel (Visible si des sites existent) ───────── */}
      {sites && sites.length > 0 && (
        <>
          {/* Skeletons de chargement KPIs */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl border border-gray-200/80 bg-white p-5 dark:bg-[#16181E] dark:border-white/[0.08] animate-pulse"
                />
              ))}
            </div>
          ) : (
            /* 4 KPI Cards (Haute Lisibilité & Données Réelles) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Sites Surveillés */}
              <div className="rounded-xl border border-gray-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:bg-[#16181E] dark:border-white/[0.08] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Sites surveillés
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-zinc-300">
                    <GlobeAltIcon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white font-sans tabular-nums">
                    {kpiData.totalSites}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-zinc-400 font-medium">
                    <span>{kpiData.prodSites} prod</span>
                    <span>·</span>
                    <span>{kpiData.stagingSites} staging</span>
                  </div>
                </div>
              </div>

              {/* 2. Scans Exécutés */}
              <div className="rounded-xl border border-gray-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:bg-[#16181E] dark:border-white/[0.08] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Scans exécutés
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <ArrowPathIcon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white font-sans tabular-nums">
                    {kpiData.totalScans}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25">
                    {kpiData.totalChecks} checks
                  </span>
                </div>
              </div>

              {/* 3. Anomalies Critiques */}
              <div className="rounded-xl border border-gray-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:bg-[#16181E] dark:border-white/[0.08] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Anomalies critiques
                  </span>
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      kpiData.criticalIssues > 0
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                    }`}
                  >
                    <BugAntIcon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white font-sans tabular-nums">
                    {kpiData.criticalIssues}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      kpiData.criticalIssues > 0
                        ? 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25'
                    }`}
                  >
                    {kpiData.criticalIssues > 0 ? 'Action requise' : '0 bloquant'}
                  </span>
                </div>
              </div>

              {/* 4. Santé Globale */}
              <div className="rounded-xl border border-gray-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:bg-[#16181E] dark:border-white/[0.08] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Taux de conformité
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-[#ee6018] dark:bg-[#ee6018]/15 dark:text-[#ff7836]">
                    <ShieldCheckIcon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white font-sans tabular-nums">
                      {kpiData.healthPercent}%
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 dark:text-zinc-400">
                      {kpiData.totalPassed}/{kpiData.totalChecks || '0'} OK
                    </span>
                  </div>
                  {/* Subtle Progress Bar */}
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden dark:bg-white/[0.08]">
                    <div
                      style={{ width: `${kpiData.healthPercent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        kpiData.healthPercent >= 90
                          ? 'bg-emerald-500'
                          : kpiData.healthPercent >= 70
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── D. Colonnes Opérationnelles (Attention Requise + Activité) ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Colonne Gauche : Sites nécessitant une attention (7 cols) */}
            <div className="lg:col-span-7 rounded-xl border border-gray-200/90 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col dark:bg-[#16181E] dark:border-white/[0.08]">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Sites nécessitant une attention
                  </h2>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    Environnements présentant des régressions, avertissements ou non audités.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-zinc-300 tabular-nums">
                  {kpiData.regressionSites.length + kpiData.warningSites.length + kpiData.unscannedSites.length} cible(s)
                </span>
              </div>

              <div className="mt-4 flex-1">
                {kpiData.regressionSites.length === 0 &&
                kpiData.warningSites.length === 0 &&
                kpiData.unscannedSites.length === 0 ? (
                  <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-6 rounded-lg bg-emerald-50/50 border border-emerald-100/60 dark:bg-emerald-500/[0.04] dark:border-emerald-500/10">
                    <CheckCircleIcon className="h-8 w-8 text-emerald-500 mb-2" />
                    <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                      Tous vos environnements sont sains
                    </h3>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 max-w-xs mt-1">
                      Aucune régression critique détectée sur l'ensemble de vos sites surveillés.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {/* 1. Sites en régression */}
                    {kpiData.regressionSites.map((site) => (
                      <div
                        key={site.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-rose-200/70 bg-rose-50/40 dark:border-rose-500/20 dark:bg-rose-500/[0.06] transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              {site.name || site.url}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400">
                              Régression
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                            {site.last_scan?.critical_count ?? 1} anomalie(s) critique(s) bloquante(s)
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleLaunchScanClick(site)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 dark:bg-[#1E2028] dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/15 transition-colors cursor-pointer"
                          >
                            Re-scanner
                          </button>
                          <Link
                            href={`/dashboard/sites/${site.id}`}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                            title="Ouvrir le workspace"
                          >
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))}

                    {/* 2. Sites en warning */}
                    {kpiData.warningSites.map((site) => (
                      <div
                        key={site.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-amber-200/70 bg-amber-50/40 dark:border-amber-500/20 dark:bg-amber-500/[0.06] transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              {site.name || site.url}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                              Warning
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                            {site.last_scan?.checks_warning ?? 0} point(s) d'attention non bloquant(s)
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={`/dashboard/sites/${site.id}`}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 dark:bg-[#1E2028] dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500/15 transition-colors"
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
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200/80 bg-gray-50/50 dark:border-white/[0.06] dark:bg-white/[0.02] transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <span className="text-xs font-semibold text-gray-900 dark:text-white truncate block">
                            {site.name || site.url}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                            En attente d'un premier audit
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleLaunchScanClick(site)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-[#1E2028] dark:border-white/[0.1] dark:text-zinc-200 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                        >
                          Lancer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Colonne Droite : Activité Réelle & Répartition (5 cols) */}
            <div className="lg:col-span-5 rounded-xl border border-gray-200/90 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between dark:bg-[#16181E] dark:border-white/[0.08]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                      Activité des 7 jours
                    </h2>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      Volume réel de sessions Playwright enregistrées.
                    </p>
                  </div>
                </div>

                {/* Histogramme Compact et Lisible */}
                <div className="mt-5 h-36 flex items-end justify-between gap-3 pt-2 pb-1 border-b border-gray-100 dark:border-white/[0.06]">
                  {dailyActivity.map((dayItem) => (
                    <div
                      key={dayItem.date.toISOString()}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative"
                    >
                      {/* Tooltip au survol */}
                      <div className="absolute -top-6 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-900 text-white dark:bg-white dark:text-black whitespace-nowrap shadow-xs">
                          {dayItem.count} scan{dayItem.count > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Barre */}
                      <div
                        style={{ height: dayItem.heightPercent }}
                        className={`w-full max-w-[22px] rounded-t-sm transition-all duration-200 ${
                          dayItem.isToday
                            ? 'bg-[#ee6018]'
                            : dayItem.count > 0
                            ? 'bg-[#ee6018]/60 hover:bg-[#ee6018]'
                            : 'bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1]'
                        }`}
                      />

                      {/* Jour */}
                      <span
                        className={`text-[11px] font-medium mt-2 tabular-nums ${
                          dayItem.isToday
                            ? 'text-[#ee6018] font-bold'
                            : 'text-gray-400 dark:text-zinc-500'
                        }`}
                      >
                        {dayItem.letter}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Répartition Synthétique des Statuts */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                <div className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mb-2">
                  État du parc ({kpiData.totalSites} sites)
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-500/[0.08] border border-emerald-100 dark:border-emerald-500/15">
                    <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {kpiData.healthySites.length}
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                      Sains
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-rose-50/60 dark:bg-rose-500/[0.08] border border-rose-100 dark:border-rose-500/15">
                    <div className="text-base font-bold text-rose-700 dark:text-rose-400 tabular-nums">
                      {kpiData.regressionSites.length}
                    </div>
                    <div className="text-[10px] font-semibold text-rose-800 dark:text-rose-300">
                      Anomalies
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/[0.08]">
                    <div className="text-base font-bold text-gray-700 dark:text-zinc-300 tabular-nums">
                      {kpiData.unscannedSites.length}
                    </div>
                    <div className="text-[10px] font-semibold text-gray-600 dark:text-zinc-400">
                      En attente
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── E. Tableau : Derniers Scans Exécutés (Operate Table) ────────── */}
          <div className="rounded-xl border border-gray-200/90 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden dark:bg-[#16181E] dark:border-white/[0.08]">
            {/* Header du Tableau avec Recherche & Filtres Rapides */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-white/[0.06]">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Derniers scans exécutés
                </h2>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  Rapports détaillés et preuves Playwright de chaque exécution.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Filtre Rapide Statut */}
                <div className="inline-flex items-center p-0.5 rounded-lg border border-gray-200 bg-gray-50/80 dark:border-white/[0.08] dark:bg-[#111216]">
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
                      className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        tableStatusFilter === f.id
                          ? 'bg-white text-gray-900 shadow-2xs dark:bg-[#1E2028] dark:text-white'
                          : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Champ de Recherche */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Filtrer un scan..."
                    className="pl-7 pr-2.5 py-1 text-xs bg-gray-50/80 border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ee6018] dark:bg-[#111216] dark:border-white/[0.08] dark:text-white dark:placeholder:text-zinc-500 transition-all font-sans"
                  />
                </div>

                {/* Lien Voir tout */}
                <Link
                  href="/dashboard/scans"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-[#111216] dark:text-zinc-300 dark:hover:bg-white/[0.04] transition-colors"
                >
                  <span>Tous les scans</span>
                  <ArrowTopRightOnSquareIcon className="h-3 w-3 text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Table Content */}
            {scansLoading ? (
              <div className="p-8 text-center text-xs text-gray-400 dark:text-zinc-500 flex items-center justify-center gap-2">
                <ArrowPathIcon className="h-4 w-4 animate-spin text-[#ee6018]" />
                <span>Chargement des scans...</span>
              </div>
            ) : filteredScans.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 dark:text-zinc-500">
                {scans && scans.length === 0
                  ? 'Aucun scan exécuté pour le moment. Cliquez sur "Lancer un scan" pour démarrer.'
                  : 'Aucun scan ne correspond à vos filtres.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider text-[10px] dark:bg-[#111216]/80 dark:border-white/[0.06] dark:text-zinc-500">
                    <tr>
                      <th className="py-2.5 px-4">Site</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Statut</th>
                      <th className="py-2.5 px-3">Conformité</th>
                      <th className="py-2.5 px-3">Anomalies</th>
                      <th className="py-2.5 px-4 text-right">Rapport</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/80 dark:divide-white/[0.04]">
                    {filteredScans.slice(0, 10).map((scan) => {
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
                          className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Site: Nom + Badge Environnement */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-white font-sans text-xs">
                                {scan.sites?.name || scan.sites?.url || 'Site'}
                              </span>
                              {scan.sites?.environment && (
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider ${
                                    scan.sites.environment === 'production'
                                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400'
                                      : 'bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-zinc-300'
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
                          <td className="py-3 px-3 text-gray-500 dark:text-zinc-400 font-medium tabular-nums whitespace-nowrap">
                            {timeAgo}
                          </td>

                          {/* Statut Badge */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                isRunning
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25'
                                  : isFailed
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200/50 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'
                                  : criticalCount > 0
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200/50 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'
                                  : (scan.checks_warning ?? 0) > 0
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25'
                                  : scan.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-white/[0.08] dark:text-zinc-300'
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
                          <td className="py-3 px-3 tabular-nums font-medium text-gray-700 dark:text-zinc-300 whitespace-nowrap">
                            {checksTotal > 0 ? (
                              <span>
                                {checksPassed}/{checksTotal} checks ({Math.round((checksPassed / checksTotal) * 100)}%)
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-zinc-500">—</span>
                            )}
                          </td>

                          {/* Anomalies */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {criticalCount > 0 ? (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
                                {criticalCount} critique{criticalCount > 1 ? 's' : ''}
                              </span>
                            ) : majorCount > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                                {majorCount} avertissement{majorCount > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">0 anomalie</span>
                            )}
                          </td>

                          {/* Action Ouvrir Workspace */}
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/dashboard/sites/${scan.site_id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-[#ee6018] hover:bg-[#ee6018]/10 dark:text-[#ff7836] transition-colors"
                            >
                              <span>Rapport</span>
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
