'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BugAntIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowUpRightIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { parseIssueDiagnostic } from '@/lib/qa/ai'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/ui/empty-state'
import { Pagination } from '@/components/ui/Pagination'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function BugsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'major' | 'minor'>('all')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data: issues = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['all-issues'],
    queryFn: async () => {
      const res = await fetch('/api/issues')
      if (!res.ok) throw new Error('Impossible de charger les incidents')
      const data = await res.json()
      return Array.isArray(data) ? data : []
    },
  })

  // Filtered issues based on search and severity
  const filteredIssues = useMemo(() => {
    return issues.filter((iss: any) => {
      const isNotResolved = iss.status !== 'resolved' && iss.status !== 'ignored'
      if (!isNotResolved) return false

      const diag = parseIssueDiagnostic(iss)
      const matchesSeverity = filterSeverity === 'all' || diag.severity === filterSeverity

      const q = search.trim().toLowerCase()
      const matchesSearch =
        !q ||
        diag.title.toLowerCase().includes(q) ||
        diag.summary.toLowerCase().includes(q) ||
        (iss.site?.name || '').toLowerCase().includes(q) ||
        (iss.url || '').toLowerCase().includes(q)

      return matchesSeverity && matchesSearch
    })
  }, [issues, search, filterSeverity])

  const counts = useMemo(() => {
    let critical = 0
    let major = 0
    let minor = 0
    for (const iss of issues) {
      const diag = parseIssueDiagnostic(iss)
      if (diag.severity === 'critical') critical++
      else if (diag.severity === 'major') major++
      else if (diag.severity === 'minor') minor++
    }
    return { all: issues.length, critical, major, minor }
  }, [issues])

  const resetFilters = () => {
    setSearch('')
    setFilterSeverity('all')
  }

  const hasActiveFilters = search.trim() !== '' || filterSeverity !== 'all'

  useEffect(() => {
    setPage(1)
  }, [search, filterSeverity])

  const paginatedIssues = filteredIssues.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* 1. Header (Bolder typographic scale & authoritative hierarchy) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 font-sans">
              Bugs & Régressions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200/80 dark:bg-white/[0.06] dark:text-zinc-300 dark:border-white/[0.08]">
              {issues.length} incident{issues.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Diagnostics chirurgicaux générés par les sessions Playwright et analysés par IA avec preuve visuelle et impact métier.
          </p>
        </div>

        {/* Global CTA to launch scan */}
        <Link
          href="/dashboard/sites"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#ee6018] hover:bg-[#d95514] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#ee6018]/25 transition-all duration-150 cursor-pointer shrink-0"
        >
          <ArrowPathIcon className="h-4 w-4" />
          <span>Lancer un scan QA</span>
        </Link>
      </div>

      {/* 2. Operational Filter & Search Bar (Clarify + Distill) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-gray-200/80 dark:bg-[#16181E] dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par mot-clé, route, sélecteur ou site..."
            className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-gray-50/80 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ee6018] focus:border-[#ee6018] dark:bg-[#111216] dark:border-white/[0.08] dark:text-zinc-100 dark:placeholder:text-zinc-500 transition-all font-sans"
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

        {/* Severity Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterSeverity('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              filterSeverity === 'all'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-950'
                : 'text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/[0.06]'
            }`}
          >
            Tous ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              filterSeverity === 'critical'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-rose-600 dark:text-rose-400 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20'
            }`}
          >
            Critiques ({counts.critical})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('major')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              filterSeverity === 'major'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-amber-600 dark:text-amber-400 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20'
            }`}
          >
            Majeurs ({counts.major})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('minor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] ${
              filterSeverity === 'minor'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-blue-600 dark:text-blue-400 bg-blue-50/70 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20'
            }`}
          >
            Mineurs ({counts.minor})
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* 3. Issues List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200/80 bg-white p-5 dark:bg-[#181B21] dark:border-white/[0.08] space-y-4 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <div className="h-5 w-24 bg-gray-200/60 dark:bg-white/[0.06] rounded-md" />
                    <div className="h-5 w-16 bg-gray-200/60 dark:bg-white/[0.06] rounded-md" />
                  </div>
                  <div className="h-4 w-28 bg-gray-100 dark:bg-white/[0.04] rounded" />
                </div>
                <div className="h-5 w-2/3 bg-gray-200/80 dark:bg-white/[0.08] rounded" />
                <div className="h-14 w-full bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            title="Impossible de charger les incidents"
            message="Les données réelles sont momentanément indisponibles. Réessayez dans un instant."
            actionLabel="Réessayer"
            actionIcon={ArrowPathIcon}
            onActionClick={() => refetch()}
            mainIcon={ExclamationTriangleIcon}
                      iconVariant="orange"
            className="my-8"
          />
        ) : filteredIssues.length === 0 ? (
          <EmptyState
            title="Aucun incident correspondant"
            message={
              hasActiveFilters
                ? 'Aucun bug ne correspond à vos critères de recherche ou de filtre actuels.'
                : 'Félicitations ! Vos environnements surveillés ne présentent aucune anomalie détectée.'
            }
            actionLabel={hasActiveFilters ? 'Réinitialiser les filtres' : 'Lancer un nouveau scan'}
            actionIcon={hasActiveFilters ? XMarkIcon : ArrowPathIcon}
            onActionClick={hasActiveFilters ? resetFilters : () => router.push('/dashboard/sites')}
            mainIcon={CheckCircleIcon}
            iconVariant="emerald"
            className="my-8"
          />
        ) : (
          <>
            {paginatedIssues.map((bug: any) => {
            const diag = parseIssueDiagnostic(bug)
            const siteId = bug.site_id || bug.site?.id
            const timeAgo = bug.created_at
              ? formatDistanceToNow(new Date(bug.created_at), { addSuffix: true, locale: fr })
              : 'Récemment'

            return (
              <div
                key={bug.id}
                className="relative rounded-xl border border-gray-200/90 bg-white p-4 sm:p-5 hover:border-gray-300 dark:bg-[#181B21] dark:border-white/[0.08] dark:hover:border-white/20 transition-colors duration-200 space-y-4 group"
              >
                {/* Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-gray-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Severity Pill */}
                    {diag.severity === 'critical' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        <span>Critique</span>
                      </span>
                    ) : diag.severity === 'major' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span>Majeur</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <span>Mineur</span>
                      </span>
                    )}

                    {bug.status === 'new' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200/60 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/25">
                        Nouveau
                      </span>
                    )}

                    <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                      {bug.site?.name || bug.site?.url?.replace(/^https?:\/\//, '')}
                    </span>

                    {bug.url && (
                      <>
                        <span className="text-xs text-gray-300 dark:text-zinc-600">·</span>
                        <a
                          href={bug.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-gray-400 dark:text-zinc-500 hover:text-[#ee6018] dark:hover:text-[#ff7836] transition-colors inline-flex items-center gap-1 truncate max-w-[200px] sm:max-w-xs group/link"
                        >
                          <span>{new URL(bug.url).pathname || '/'}</span>
                          <ArrowTopRightOnSquareIcon className="h-3 w-3 shrink-0 opacity-70 group-hover/link:opacity-100" />
                        </a>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 text-[11px] font-semibold">
                      <SparklesIcon className="h-3 w-3 text-emerald-500" />
                      <span>Certitude IA : {Math.round((diag.confidence ?? 0.95) * 100)}%</span>
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium">{timeAgo}</span>
                  </div>
                </div>

                {/* Bug Title & Summary */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 group-hover:text-[#ee6018] dark:group-hover:text-[#ff7836] transition-colors leading-snug">
                    <Link href={siteId ? `/dashboard/sites/${siteId}` : '/dashboard/sites'} className="hover:underline">
                      {diag.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-zinc-300 mt-1.5 leading-relaxed">
                    {diag.summary}
                  </p>
                </div>

                {/* Business Impact Block */}
                {diag.impact && (
                  <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 dark:bg-white/[0.03] dark:border-white/[0.05] text-xs space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Impact Utilisateur / Métier
                    </span>
                    <p className="text-gray-700 dark:text-zinc-300 leading-relaxed font-medium">
                      {diag.impact}
                    </p>
                  </div>
                )}

                {/* AI Recommendation Block (Signal Orange Border & Tint) */}
                <div className="rounded-xl bg-orange-50/70 border border-orange-200/70 dark:bg-[#ee6018]/10 dark:border-[#ee6018]/25 p-3.5 text-xs text-gray-800 dark:text-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-[#ee6018] dark:text-[#ff7836] shrink-0 mt-0.5">
                      Recommandation :
                    </span>
                    <span className="leading-relaxed font-medium">{diag.recommendation}</span>
                  </div>

                  <Link
                    href={siteId ? `/dashboard/sites/${siteId}` : '/dashboard/sites'}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xs font-semibold hover:bg-gray-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all shrink-0 self-end sm:self-center"
                  >
                    <span>Inspecter</span>
                    <ArrowUpRightIcon className="h-3 w-3 opacity-70" />
                  </Link>
                </div>
              </div>
            )
            })}
            <Pagination
              page={page}
              pageSize={pageSize}
              total={filteredIssues.length}
              onPageChange={setPage}
              label="bugs"
            />
          </>
        )}
      </div>
    </div>
  )
}
