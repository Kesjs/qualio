'use client'

import Link from 'next/link'

interface KpiData {
  totalSites: number
  prodSites: number
  stagingSites: number
  totalScans: number
  totalChecks: number
  criticalIssues: number
  healthPercent: number
  totalPassed: number
}

export function DashboardKpiGrid({ kpiData }: { kpiData: KpiData }) {
  return (
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
  )
}
