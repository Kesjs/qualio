'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { ArrowPathIcon, MagnifyingGlassIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Pagination } from '@/components/ui/Pagination'
import type { ScanWithSite } from '@/lib/hooks/useScan'
import { TERMINAL_SCAN_STATUSES } from '@/lib/hooks/scan-polling'

export function DashboardAuditTable({ scans, scansLoading = false }: { scans?: ScanWithSite[]; scansLoading?: boolean }) {
  const [tableSearch, setTableSearch] = useState('')
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | 'success' | 'regression' | 'failed'>('all')
  const [auditPage, setAuditPage] = useState(1)
  const auditPageSize = 10
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


  return (
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
                    aria-label="Filtrer les audits"
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
                      const isRunning = !TERMINAL_SCAN_STATUSES.includes(scan.status)
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
                                  ? scan.status === 'queued' ? 'En attente' : 'En cours'
                                  : isFailed
                                  ? 'Échec'
                                  : scan.status === 'blocked'
                                  ? 'Bloqué'
                                  : criticalCount > 0
                                  ? 'Régression'
                                  : scan.status === 'partial'
                                  ? 'Partiel'
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
  )
}
