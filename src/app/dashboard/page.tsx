'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  PlayIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { useSites, SiteWithLastScan } from '@/lib/hooks/useSites'
import { useScans } from '@/lib/hooks/useScan'
import { AddSiteModal } from '@/components/dashboard/AddSiteModal'
import { RunScanModal } from '@/components/dashboard/RunScanModal'
import { DashboardKpiGrid } from '@/components/dashboard/DashboardKpiGrid'
import { DashboardActivityChart } from '@/components/dashboard/DashboardActivityChart'
import { DashboardAuditTable } from '@/components/dashboard/DashboardAuditTable'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
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
  const completedSteps = Number(siteAdded) + Number(hasCompletedScan)

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]" aria-labelledby="activation-title">
      <div className="flex flex-col gap-4 border-b border-gray-200/80 px-5 py-5 sm:flex-row sm:items-end sm:justify-between dark:border-white/[0.08]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ee6018]">Premières étapes</p>
          <h2 id="activation-title" className="mt-1 text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
            Vérifiez vos formulaires
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-500 dark:text-zinc-400">
            Un premier audit ciblé pour repérer les formulaires qui comptent avant de brancher l’envoi d’e-mails.
          </p>
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-gray-500 dark:text-zinc-400">
          {Math.min(completedSteps, 2)} / 2 étapes
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
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Lancer l’audit des formulaires</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">Qualio repère les champs, les boutons d’envoi et les formulaires de connexion ou de contact.</p>
          </div>
          {!hasCompletedScan && <button type="button" onClick={onRunScan} disabled={!siteAdded} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/[0.12] dark:bg-transparent dark:text-zinc-200 dark:hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018]/40">{siteAdded ? 'Auditer les formulaires' : 'Ajoutez un site d’abord'}<ArrowRightIcon className="h-3.5 w-3.5" /></button>}
        </div>

        <div className="flex items-center gap-3 px-5 py-4">
          <CheckCircleIcon className={`h-5 w-5 shrink-0 ${hasCompletedScan ? 'text-emerald-500' : 'text-gray-300 dark:text-zinc-700'}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Le résultat de l’audit est prêt</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">Voyez quels formulaires existent et lesquels nécessitent une vérification.</p>
          </div>
          {hasCompletedScan && <Link href="/dashboard/scans" className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-white/[0.12] dark:text-zinc-200 dark:hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018]/40">Voir le rapport<ArrowRightIcon className="h-3.5 w-3.5" /></Link>}
          {!hasCompletedScan && <DocumentTextIcon className="hidden h-5 w-5 text-gray-300 dark:text-zinc-700 sm:block" />}
        </div>
      </div>
    </section>
  )
}

export default function OverviewPage() {
  const { data: sites, isLoading: sitesLoading, isError: sitesError, isFetching: sitesFetching, refetch: refetchSites } = useSites()
  const { data: scans, isLoading: scansLoading, isError: scansError, isFetching: scansFetching, refetch: refetchScans } = useScans()

  // Filtre période (Pills)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')

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
  const isError = sitesError || scansError
  const firstSite = sites?.[0]
  const hasCompletedScan = scans?.some((scan) => scan.status === 'completed') ?? false
  const showActivationPanel = !isLoading && !isError && (!sites?.length || !hasCompletedScan)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ─── A. Header & Action Directe (Bolder & Clarify & Adapt) ─────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100 font-sans">
              Vue d’ensemble
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
            disabled={sitesLoading || sitesError}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ee6018] text-white text-xs font-bold shadow-md shadow-[#ee6018]/25 hover:bg-[#d95514] active:scale-[0.97] transition-all duration-150 cursor-pointer disabled:cursor-wait disabled:opacity-60"
          >
            <PlayIcon className="h-4 w-4 fill-current" />
            <span>Lancer un scan</span>
          </button>
        </div>
      </div>

      {/* ─── B. Data Loading State: shell first, real content after queries ──── */}
      {isError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-rose-500/20 dark:bg-rose-500/10">
          <h2 className="text-sm font-semibold text-red-800 dark:text-rose-300">Impossible de charger le tableau de bord</h2>
          <p className="mt-1 text-xs text-red-700 dark:text-rose-300">
            {sitesError && scansError ? 'Les sites et les audits sont indisponibles.' : sitesError ? 'Les sites sont indisponibles.' : 'Les audits sont indisponibles.'} Réessayez dans un instant.
          </p>
          <button type="button" disabled={sitesFetching || scansFetching} onClick={() => {
            if (sitesError) void refetchSites()
            if (scansError) void refetchScans()
          }} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-800 focus-visible:outline-2 focus-visible:outline-[#ee6018] disabled:opacity-50 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-300">
            <ArrowPathIcon className={`h-4 w-4 ${sitesFetching || scansFetching ? 'animate-spin' : ''}`} />
            {sitesFetching || scansFetching ? 'Chargement…' : 'Réessayer'}
          </button>
        </div>
      )}
      {isLoading && !isError && (
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
      {!isLoading && !isError && sites && sites.length > 0 && (
        <>
          {/* Grille des 4 KPIs Principaux (Colorize & Bolder) */}
          <DashboardKpiGrid kpiData={kpiData} />

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
            <DashboardActivityChart scans={scans} dateRange={dateRange} kpiData={kpiData} />
          </div>

          {/* ─── E. Tableau : Derniers Audits Exécutés (Operate Table) ───────── */}
          <DashboardAuditTable scans={scans} />
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
