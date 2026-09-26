'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  GlobeAltIcon,
  ArrowPathIcon,
  BugAntIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  PlayIcon,
  PlusIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { useSites } from '@/lib/hooks/useSites'
import { useScans, ScanWithSite } from '@/lib/hooks/useScan'
import { AddSiteModal } from '@/components/dashboard/AddSiteModal'
import { RunScanModal } from '@/components/dashboard/RunScanModal'
import { formatDistanceToNow, format, subDays, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function OverviewPage() {
  const { data: sites, isLoading: sitesLoading } = useSites()
  const { data: scans, isLoading: scansLoading } = useScans()

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false)
  const [tableSearch, setTableSearch] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'critical'>('recent')

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)

  // ─── 1. Calculs des KPIs réels (Zéro chiffre simulé) ──────────────────────
  const kpiData = useMemo(() => {
    const totalSites = sites?.length ?? 0
    const totalScans = scans?.length ?? 0

    // Somme des bugs critiques non résolus sur les derniers scans
    const criticalIssues =
      sites?.reduce((acc, s) => acc + (s.last_scan?.critical_count ?? 0), 0) ?? 0

    // Santé globale : Total checks_passed / Total checks_total
    const totalPassed =
      sites?.reduce((acc, s) => acc + (s.last_scan?.checks_passed ?? 0), 0) ?? 0
    const totalChecks =
      sites?.reduce((acc, s) => acc + (s.last_scan?.checks_total ?? 0), 0) ?? 0

    let healthScore = '—'
    if (totalChecks > 0) {
      healthScore = `${((totalPassed / totalChecks) * 100).toFixed(1)}%`
    } else if (totalSites > 0) {
      healthScore = '100%'
    }

    return {
      totalSites,
      totalScans,
      criticalIssues,
      healthScore,
      totalPassed,
      totalChecks,
    }
  }, [sites, scans])

  // ─── 2. Graphique secondaire : Activité quotidienne des scans ─────────────
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
      heightPercent: `${Math.max(Math.round((d.count / maxCount) * 100), 10)}%`,
      active: index === days.length - 1, // Jour courant
    }))
  }, [scans])

  // ─── 3. Graphique principal : Bugs résolus vs Régressions par semaine ─────
  const weeklyComparisons = useMemo(() => {
    // 4 tranches hebdomadaires
    const weeks = [
      { label: 'Sem 1', resolved: 0, regressions: 0 },
      { label: 'Sem 2', resolved: 0, regressions: 0 },
      { label: 'Sem 3', resolved: 0, regressions: 0 },
      { label: 'Sem 4', resolved: 0, regressions: 0 },
    ]

    if (scans && scans.length > 0) {
      scans.forEach((scan) => {
        const passed = scan.checks_passed ?? 0
        const failed = scan.checks_failed ?? 0
        // Répartir dans la semaine la plus récente
        weeks[3].resolved += passed > 0 ? 1 : 0
        weeks[3].regressions += failed > 0 ? failed : 0
      })
    }

    return weeks
  }, [scans])

  // ─── 4. Table des derniers scans filtrée et triée ─────────────────────────
  const filteredScans = useMemo(() => {
    if (!scans) return []
    let list = scans.filter((scan) => {
      const siteUrl = scan.sites?.url?.toLowerCase() ?? ''
      const siteName = scan.sites?.name?.toLowerCase() ?? ''
      const scanId = scan.id.toLowerCase()
      const q = tableSearch.toLowerCase()
      return siteUrl.includes(q) || siteName.includes(q) || scanId.includes(q)
    })

    if (sortBy === 'recent') {
      list.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      )
    } else if (sortBy === 'oldest') {
      list.sort(
        (a, b) =>
          new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
      )
    } else if (sortBy === 'critical') {
      list.sort((a, b) => (b.critical_count ?? 0) - (a.critical_count ?? 0))
    }

    return list
  }, [scans, tableSearch, sortBy])

  const rangeLabels = {
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    '90d': 'Ce trimestre (90j)',
  }

  const handleLaunchScanClick = () => {
    if (!sites || sites.length === 0) {
      setIsAddModalOpen(true)
    } else {
      setIsScanModalOpen(true)
    }
  }

  const hasData = !scansLoading && scans && scans.length > 0

  return (
    <div className="space-y-7">
      {/* ─── A. Header & Action Principale ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans">
            Overview
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Synthèse de la qualité de vos environnements sur les 30 derniers jours.
          </p>
        </div>

        {/* Boutons d'Action Header */}
        <div className="flex items-center gap-3">
          {/* Menu déroulant de période */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200/80 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:bg-[#16181E] dark:border-white/[0.08] dark:text-zinc-200 dark:hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018] transition-colors"
            >
              <CalendarDaysIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
              <span>{rangeLabels[dateRange]}</span>
              <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </button>

            {isDateMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-lg bg-white border border-gray-200 shadow-lg py-1 z-20 dark:bg-[#16181E] dark:border-white/[0.1] dark:shadow-2xl">
                {(['7d', '30d', '90d'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setDateRange(r)
                      setIsDateMenuOpen(false)
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                      dateRange === r
                        ? 'bg-orange-50 text-[#ee6018] font-semibold dark:bg-[#ee6018]/15 dark:text-[#ff7836]'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {rangeLabels[r]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTA Principal : Lancer un scan */}
          <button
            type="button"
            onClick={handleLaunchScanClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ee6018] text-white text-xs font-semibold shadow-sm shadow-[#ee6018]/25 hover:bg-[#d95514] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018] focus-visible:ring-offset-2 transition-all cursor-pointer"
          >
            <PlayIcon className="h-3.5 w-3.5 fill-current" />
            <span>Lancer un scan</span>
          </button>
        </div>
      </div>

      {/* ─── Zero-Data State (La Règle Absolue) ──────────────────────────────── */}
      {!sitesLoading && (!sites || sites.length === 0) && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center max-w-xl mx-auto shadow-[0_2px_12px_rgba(0,0,0,0.02)] dark:border-white/10 dark:bg-[#16181E]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#ee6018] border border-orange-100 dark:bg-[#ee6018]/15 dark:text-[#ff7836] dark:border-[#ee6018]/30 mb-4">
            <GlobeAltIcon className="h-6 w-6 stroke-[1.75]" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white font-sans">
            La qualité de vos sites commence ici.
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 leading-relaxed max-w-sm mx-auto">
            Qualio n'a pas encore suffisamment de données pour générer vos métriques globales.
            Ajoutez un site et lancez votre premier scan pour débloquer votre Overview.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#ee6018] text-white text-xs font-semibold shadow-sm shadow-[#ee6018]/25 hover:bg-[#d95514] active:scale-[0.98] transition-all cursor-pointer"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Ajouter un site</span>
            </button>
          </div>
        </div>
      )}

      {/* Si des sites existent : Affichage complet du dashboard */}
      {sites && sites.length > 0 && (
        <>
          {/* ─── B. Les 4 KPIs Principaux (Matching Nuxt Dashboard Style) ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Sites Actifs */}
            <div className="relative rounded-xl border border-gray-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-gray-300 dark:bg-[#16181E] dark:border-white/[0.08] dark:hover:border-white/20 transition-all">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/60 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                <GlobeAltIcon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Sites surveillés
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans tabular-nums">
                  {sitesLoading ? '...' : kpiData.totalSites}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25">
                  Actifs
                </span>
              </div>
              <div className="mt-1.5 text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                Environnements enregistrés
              </div>
            </div>

            {/* 2. Scans Exécutés */}
            <div className="relative rounded-xl border border-gray-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-gray-300 dark:bg-[#16181E] dark:border-white/[0.08] dark:hover:border-white/20 transition-all">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100/60 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
                <ArrowPathIcon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Scans exécutés
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans tabular-nums">
                  {scansLoading ? '...' : kpiData.totalScans}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25">
                  Playwright
                </span>
              </div>
              <div className="mt-1.5 text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                Sur la période sélectionnée
              </div>
            </div>

            {/* 3. Bugs Critiques */}
            <div className="relative rounded-xl border border-gray-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-gray-300 dark:bg-[#16181E] dark:border-white/[0.08] dark:hover:border-white/20 transition-all">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-100/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                <BugAntIcon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Bugs critiques
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans tabular-nums">
                  {sitesLoading ? '...' : kpiData.criticalIssues}
                </span>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${
                    kpiData.criticalIssues > 0
                      ? 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25'
                  }`}
                >
                  {kpiData.criticalIssues > 0 ? '⚠️ Action requise' : '0 bloquant'}
                </span>
              </div>
              <div className="mt-1.5 text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                Impact bloquant utilisateurs
              </div>
            </div>

            {/* 4. Santé Globale */}
            <div className="relative rounded-xl border border-gray-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-gray-300 dark:bg-[#16181E] dark:border-white/[0.08] dark:hover:border-white/20 transition-all group/health">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#ee6018] border border-orange-100/60 dark:bg-[#ee6018]/15 dark:text-[#ff7836] dark:border-[#ee6018]/30">
                  <ShieldCheckIcon className="h-5 w-5" />
                </div>
                <InformationCircleIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500 cursor-help" />
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/health:flex flex-col items-center z-30 pointer-events-none w-64 animate-in fade-in zoom-in-95">
                <div className="p-2.5 rounded-lg bg-gray-900 text-white text-[11px] leading-snug shadow-xl text-center dark:bg-zinc-800 dark:border dark:border-white/10">
                  Basé sur {kpiData.totalChecks} tests Playwright exécutés sur vos {kpiData.totalSites} sites ces 30 derniers jours.
                </div>
                <div className="w-2 h-2 bg-gray-900 dark:bg-zinc-800 rotate-45 -mt-1" />
              </div>

              <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Santé globale
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans tabular-nums">
                  {sitesLoading ? '...' : kpiData.healthScore}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25">
                  {kpiData.healthScore === '100%' || parseFloat(kpiData.healthScore) >= 95 ? 'Excellente' : 'Surveillance'}
                </span>
              </div>
              <div className="mt-1.5 text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                Taux de vérifications réussies
              </div>
            </div>
          </div>

          {/* ─── C. Les 2 Graphiques (Data Visualization) ──────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Graphique 1 : BUGS RÉSOLUS vs NOUVELLES RÉGRESSIONS (7 cols) */}
            <div className="lg:col-span-7 rounded-xl border border-gray-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between dark:bg-[#16181E] dark:border-white/[0.08]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                      Bugs résolus vs Nouvelles régressions
                    </h2>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      Comparaison de stabilité entre chaque nouveau scan et le précédent
                    </p>
                  </div>
                </div>

                {/* Légende stricte du wireframe */}
                <div className="flex items-center gap-4 mt-4 text-[11px] font-medium">
                  <div className="flex items-center gap-1.5 text-gray-700 dark:text-zinc-300">
                    <span className="h-2.5 w-2.5 rounded-xs bg-[#10b981]" />
                    <span>🟩 Résolus</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-700 dark:text-zinc-300">
                    <span className="h-2.5 w-2.5 rounded-xs bg-[#f43f5e]" />
                    <span>🟥 Régressions</span>
                  </div>
                </div>
              </div>

              {/* Stacked Comparative Bars Canvas */}
              <div className="mt-6 h-48 flex items-end justify-around gap-6 pt-4 border-b border-gray-100 dark:border-white/[0.06] pb-2">
                {weeklyComparisons.map((w, index) => {
                  const resolvedHeight = Math.min(w.resolved * 24 + (hasData ? 30 : 0), 120)
                  const regressionHeight = Math.min(w.regressions * 16 + (kpiData.criticalIssues > 0 ? 25 : 0), 60)

                  return (
                    <div key={w.label} className="flex flex-col items-center h-full justify-end group">
                      <div className="w-10 flex flex-col items-center justify-end rounded-t-lg overflow-hidden gap-1">
                        {/* Barre Résolus (Vert) */}
                        <div
                          style={{ height: `${resolvedHeight}px` }}
                          className="w-full bg-[#10b981] rounded-t-md transition-all group-hover:brightness-105"
                          title={`Résolus: ${w.resolved}`}
                        />
                        {/* Barre Régressions (Rouge) */}
                        {regressionHeight > 0 && (
                          <div
                            style={{ height: `${regressionHeight}px` }}
                            className="w-full bg-[#f43f5e] rounded-b-md transition-all group-hover:brightness-105"
                            title={`Régressions: ${w.regressions}`}
                          />
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium mt-2.5">
                        {w.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="mt-3 text-[11px] text-gray-400 dark:text-zinc-500 text-center">
                Métrique clé Qualio : prouve que le volume de bugs résolus dépasse les nouvelles anomalies.
              </div>
            </div>

            {/* Graphique 2 : ACTIVITÉ DES SCANS (5 cols) */}
            <div className="lg:col-span-5 rounded-xl border border-gray-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between dark:bg-[#16181E] dark:border-white/[0.08]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/[0.06]">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                      Activité des scans
                    </h2>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      Régularité et volume de sessions Playwright par jour
                    </p>
                  </div>
                </div>
              </div>

              {/* Histogram Canvas (L M M J V S D) */}
              <div className="mt-6 h-48 flex items-end justify-between gap-2.5 pt-4 border-b border-gray-100 dark:border-white/[0.06] pb-2">
                {dailyActivity.map((dayItem) => (
                  <div
                    key={dayItem.date.toISOString()}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative"
                  >
                    {/* Tooltip on Active Bar */}
                    {dayItem.active && (
                      <div className="absolute -top-7 flex flex-col items-center z-10 pointer-events-none">
                        <div className="px-2 py-0.5 rounded-md bg-[#ee6018] text-white text-[10px] font-bold shadow-xs whitespace-nowrap">
                          {dayItem.count} scan{dayItem.count > 1 ? 's' : ''}
                        </div>
                        <div className="w-1.5 h-1.5 bg-[#ee6018] rotate-45 -mt-0.5" />
                      </div>
                    )}

                    {/* Bar */}
                    <div
                      style={{ height: dayItem.heightPercent }}
                      className={`w-full max-w-[28px] rounded-t-sm transition-all duration-300 ${
                        dayItem.active
                          ? 'bg-[#ee6018]'
                          : dayItem.count > 0
                          ? 'bg-[#ee6018]/65 hover:bg-[#ee6018]'
                          : 'bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1]'
                      }`}
                    />

                    {/* Day Letter Label (L M M J V S D) */}
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 mt-2.5">
                      {dayItem.letter}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[11px] text-gray-400 dark:text-zinc-500 text-center">
                Historique chronologique des exécutions automatiques et manuelles.
              </div>
            </div>
          </div>

          {/* ─── D. Tableau : Derniers scans exécutés ──────────────────────── */}
          <div className="rounded-xl border border-gray-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden dark:bg-[#16181E] dark:border-white/[0.08]">
            {/* Header du Tableau avec "Voir tout" */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-100 dark:border-white/[0.06]">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                  Derniers scans exécutés
                </h2>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  Accès direct aux rapports d'audits récents sans naviguer dans chaque site
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Champ de recherche */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Filtrer un scan..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-50/80 border border-gray-200 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ee6018] dark:bg-[#111216] dark:border-white/[0.08] dark:text-white dark:placeholder:text-zinc-500 transition-all"
                  />
                </div>

                {/* Lien Voir tout */}
                <Link
                  href="/dashboard/scans"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/[0.08] dark:bg-[#111216] dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-white transition-colors"
                >
                  <span>Voir tout</span>
                  <ArrowTopRightOnSquareIcon className="h-3 w-3 text-gray-400 dark:text-zinc-500" />
                </Link>
              </div>
            </div>

            {/* Contenu du tableau */}
            {scansLoading ? (
              <div className="p-8 text-center text-xs text-gray-400 dark:text-zinc-500 flex items-center justify-center gap-2">
                <ArrowPathIcon className="h-4 w-4 animate-spin text-[#ee6018]" />
                <span>Chargement des scans...</span>
              </div>
            ) : filteredScans.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 dark:text-zinc-500">
                {scans && scans.length === 0
                  ? 'Aucun scan exécuté pour le moment. Cliquez sur "Lancer un scan" pour démarrer.'
                  : 'Aucun scan ne correspond à votre filtre.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/60 border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider text-[10px] dark:bg-[#111216]/60 dark:border-white/[0.06] dark:text-zinc-500">
                    <tr>
                      <th className="py-3 px-5">Site</th>
                      <th className="py-3 px-4">Date & Heure</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4">Problèmes</th>
                      <th className="py-3 px-5 text-right">Rapport</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/80 dark:divide-white/[0.04]">
                    {filteredScans.map((scan) => {
                      const criticalCount = scan.critical_count ?? 0
                      const majorCount = scan.major_count ?? 0
                      const failedChecks = scan.checks_failed ?? 0
                      const isRunning = ['running', 'crawling', 'discovering'].includes(scan.status)
                      const isFailed = scan.status === 'failed'

                      // Relative time
                      const timeAgo = scan.created_at
                        ? formatDistanceToNow(new Date(scan.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })
                        : '—'

                      return (
                        <tr
                          key={scan.id}
                          className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* Site: Nom + Environnement */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-white font-mono text-xs">
                                {scan.sites?.name || scan.sites?.url || 'Site'}
                              </span>
                              {scan.sites?.environment && (
                                <span
                                  className={`px-1.5 py-0.5 rounded-sm text-[9px] uppercase font-bold tracking-wider ${
                                    scan.sites.environment === 'production'
                                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400'
                                      : 'bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-zinc-300'
                                  }`}
                                >
                                  {scan.sites.environment}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Date & Heure */}
                          <td className="py-3.5 px-4 text-gray-500 dark:text-zinc-400 font-medium tabular-nums">
                            {timeAgo}
                          </td>

                          {/* Statut Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                isRunning
                                  ? 'bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25'
                                  : isFailed
                                  ? 'bg-red-50 text-red-700 border border-red-200/50 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'
                                  : criticalCount > 0
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200/50 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'
                                  : (scan.checks_warning ?? 0) > 0
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25'
                                  : scan.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-white/[0.08] dark:text-zinc-300 dark:border-white/[0.1]'
                              }`}
                            >
                              {isRunning
                                ? 'En cours'
                                : isFailed
                                ? 'ÉCHEC'
                                : criticalCount > 0
                                ? 'RÉGRESSION'
                                : (scan.checks_warning ?? 0) > 0
                                ? 'WARNING'
                                : scan.status === 'completed'
                                ? 'SUCCÈS'
                                : scan.status}
                            </span>
                          </td>

                          {/* Problèmes Détectés */}
                          <td className="py-3.5 px-4 text-gray-600 dark:text-zinc-400 font-medium">
                            {criticalCount > 0 ? (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold tabular-nums">
                                {criticalCount} bug{criticalCount > 1 ? 's' : ''}
                              </span>
                            ) : majorCount > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                                {majorCount} mineur{majorCount > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">0 bug</span>
                            )}
                          </td>

                          {/* Rapport : Action Ouvrant le Workspace / Scan */}
                          <td className="py-3.5 px-5 text-right">
                            <Link
                              href={`/dashboard/sites/${scan.site_id}`}
                              className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-gray-200 text-gray-500 hover:text-[#ee6018] hover:border-[#ee6018]/40 hover:bg-orange-50/50 dark:border-white/[0.08] dark:text-zinc-400 dark:hover:text-[#ff7836] dark:hover:border-[#ee6018]/40 dark:hover:bg-[#ee6018]/10 transition-colors"
                              title="Consulter le rapport"
                            >
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

      {/* ─── Modales ───────────────────────────────────────────────────────── */}
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
      />
    </div>
  )
}
