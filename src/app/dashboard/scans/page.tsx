'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowUpRightIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  GlobeAltIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ScansPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: scans = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['all-scans'],
    queryFn: async () => {
      const res = await fetch('/api/scans')
      if (!res.ok) throw new Error('Impossible de charger les scans')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
  })

  // Filter based on search & status
  const filteredScans = scans.filter((scan: any) => {
    const searchLower = search.trim().toLowerCase()
    const matchesSearch =
      !searchLower ||
      scan.id.toLowerCase().includes(searchLower) ||
      (scan.sites?.url || '').toLowerCase().includes(searchLower) ||
      (scan.sites?.name || '').toLowerCase().includes(searchLower)

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'regression' && (scan.critical_count ?? 0) > 0) ||
      (statusFilter === 'healthy' && scan.status === 'completed' && (scan.critical_count ?? 0) === 0) ||
      (statusFilter === 'running' && ['queued', 'running', 'crawling', 'discovering', 'auditing'].includes(scan.status))

    return matchesSearch && matchesStatus
  })

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDuration = (startedStr: string, completedStr: string) => {
    if (!startedStr || !completedStr) return '-'
    const s = new Date(startedStr).getTime()
    const c = new Date(completedStr).getTime()
    return Math.max(1, Math.round((c - s) / 1000)) + 's'
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header (Clean authoritative SaaS layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 font-sans">
              Historique des Scans
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200/80 dark:bg-white/[0.06] dark:text-zinc-300 dark:border-white/[0.08]">
              {scans.length} session{scans.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Journal complet des sessions de crawl, exécutions de tests Playwright et diagnostics chirurgicaux.
          </p>
        </div>

        {/* Action Button */}
        <Link
          href="/dashboard/sites"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ee6018] hover:bg-[#d95514] active:scale-[0.98] text-white text-xs font-semibold shadow-sm shadow-[#ee6018]/25 transition-all duration-150 cursor-pointer shrink-0"
        >
          <PlayIcon className="h-4 w-4 fill-current" />
          <span>Lancer un scan</span>
        </Link>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-gray-200/80 dark:bg-[#16181E] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="relative flex-1 min-w-[240px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par ID de scan ou nom de site..."
            className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-gray-50/80 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ee6018] dark:bg-[#111216] dark:border-white/[0.08] dark:text-zinc-100 dark:placeholder:text-zinc-500 transition-all font-sans"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-950'
                : 'text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/[0.06]'
            }`}
          >
            Tous les scans
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('healthy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'healthy'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20'
            }`}
          >
            Sains (100%)
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('regression')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'regression'
                ? 'bg-rose-500 text-white'
                : 'text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20'
            }`}
          >
            Régressions
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('running')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'running'
                ? 'bg-sky-500 text-white'
                : 'text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20'
            }`}
          >
            En direct
          </button>
        </div>
      </div>

      {/* 3. Scans Table */}
      <div className="rounded-2xl border border-gray-200/90 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden dark:bg-[#16181E] dark:border-white/[0.08] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider text-[10px] dark:bg-[#111216]/60 dark:border-white/[0.06] dark:text-zinc-500">
              <tr>
                <th className="py-3 px-5">ID Scan</th>
                <th className="py-3 px-4">Environnement</th>
                <th className="py-3 px-4">Horodatage</th>
                <th className="py-3 px-4">Résultats & Couverture</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Durée</th>
                <th className="py-3 px-5 text-right">Diagnostic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80 dark:divide-white/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-[#ee6018] animate-spin dark:border-zinc-700 dark:border-t-[#ff7836]"></div>
                      <span className="text-xs text-gray-500 dark:text-zinc-400">Chargement de l'historique...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4">
                    <EmptyState
                      title="Impossible de charger les scans"
                      message="L'historique réel n'est pas disponible pour le moment. Réessayez dans quelques instants."
                      actionLabel="Réessayer"
                      actionIcon={ArrowPathIcon}
                      onActionClick={() => refetch()}
                      mainIcon={ExclamationTriangleIcon}
                      iconVariant="orange"
                      className="max-w-xl mx-auto border-0 bg-transparent shadow-none p-6 sm:p-8"
                    />
                  </td>
                </tr>
              ) : filteredScans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4">
                    <EmptyState
                      title="Aucun scan trouvé"
                      message="Aucun enregistrement ne correspond à vos filtres de recherche. Lancez un diagnostic pour générer un rapport."
                      actionLabel="Réinitialiser les filtres"
                      onActionClick={() => {
                        setSearch('')
                        setStatusFilter('all')
                      }}
                      mainIcon={ClockIcon}
                      iconVariant="neutral"
                      className="max-w-xl mx-auto border-0 bg-transparent shadow-none p-6 sm:p-8"
                    />
                  </td>
                </tr>
              ) : (
                filteredScans.map((scan: any) => {
                  const isRunning = ['queued', 'running', 'crawling', 'discovering', 'auditing'].includes(scan.status)
                  const hasRegression = (scan.critical_count ?? 0) > 0
                  const isFailed = scan.status === 'failed' || scan.status === 'error'

                  return (
                    <tr
                      key={scan.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Scan ID */}
                      <td className="py-4 px-5 font-mono font-medium text-gray-900 dark:text-zinc-200">
                        <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-white/[0.05] text-[11px]">
                          {scan.id.slice(0, 12)}
                        </span>
                      </td>

                      {/* Site Name & Domain */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <GlobeAltIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500 shrink-0" />
                          <div>
                            <Link
                              href={`/dashboard/sites/${scan.site_id}`}
                              className="font-bold text-gray-900 dark:text-zinc-100 hover:text-[#ee6018] dark:hover:text-[#ff7836] transition-colors block text-xs"
                            >
                              {scan.sites?.name || scan.sites?.url?.replace(/^https?:\/\//, '')}
                            </Link>
                            <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-mono">
                              {scan.sites?.url}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-4 text-gray-500 dark:text-zinc-400 font-medium">
                        {formatDate(scan.created_at)}
                      </td>

                      {/* Results & Coverage */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-medium">
                          {scan.checks_passed !== null && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {scan.checks_passed}/{scan.checks_total} passés
                            </span>
                          )}
                          {hasRegression && (
                            <span className="text-rose-600 dark:text-rose-400 font-bold ml-1">
                              · {scan.critical_count} critique{scan.critical_count > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                          {scan.pages_discovered ?? 0} URLs auditées
                        </span>
                      </td>

                      {/* Status Pill */}
                      <td className="py-4 px-4">
                        {isRunning ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/70 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/25">
                            <ArrowPathIcon className="h-3 w-3 animate-spin text-sky-500" />
                            <span>En cours</span>
                          </span>
                        ) : hasRegression ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span>Régression</span>
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25">
                            <span>Échec run</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>Réussi</span>
                          </span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-4 font-mono text-gray-500 dark:text-zinc-400 font-medium">
                        {getDuration(scan.started_at, scan.completed_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <Link
                          href={`/dashboard/sites/${scan.site_id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#ee6018] hover:text-[#d95514] dark:text-[#ff7836] dark:hover:text-[#ee6018]"
                        >
                          <span>Workspace</span>
                          <ArrowUpRightIcon className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
