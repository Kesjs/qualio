'use client'

import { useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ScanWithSite } from '@/lib/hooks/useScan'

interface ActivityProps {
  scans?: ScanWithSite[]
  dateRange: '7d' | '30d' | '90d'
  kpiData: { totalSites: number; healthySites: unknown[]; regressionSites: unknown[]; unscannedSites: unknown[] }
}

export function DashboardActivityChart({ scans, dateRange, kpiData }: ActivityProps) {
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


  return (
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
  )
}
