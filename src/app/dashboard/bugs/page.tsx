'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BugAntIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { parseIssueDiagnostic } from '@/lib/qa/ai'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/ui/empty-state'
import { MOCK_BUGS } from '@/lib/mock/qa-mock-data'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function BugsPage() {
  const router = useRouter()
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'major' | 'minor'>('all')

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['all-issues'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/issues')
        if (!res.ok) return MOCK_BUGS
        const data = await res.json()
        return Array.isArray(data) && data.length > 0 ? data : MOCK_BUGS
      } catch {
        return MOCK_BUGS
      }
    },
  })

  // Filter active issues and severity
  const activeIssues = issues.filter((iss: any) => {
    const isNotResolved = iss.status !== 'resolved' && iss.status !== 'ignored'
    if (!isNotResolved) return false
    if (filterSeverity === 'all') return true
    const diag = parseIssueDiagnostic(iss)
    return diag.severity === filterSeverity
  })

  const criticalCount = issues.filter((i: any) => parseIssueDiagnostic(i).severity === 'critical').length
  const majorCount = issues.filter((i: any) => parseIssueDiagnostic(i).severity === 'major').length
  const minorCount = issues.filter((i: any) => parseIssueDiagnostic(i).severity === 'minor').length

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header (Clean authoritative SaaS style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 font-sans">
              Bugs & Régressions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200/80 dark:bg-white/[0.06] dark:text-zinc-300 dark:border-white/[0.08]">
              {issues.length} détecté{issues.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Diagnostics chirurgicaux générés par Playwright et analysés par IA avec preuve visuelle et impact métier.
          </p>
        </div>

        {/* Severity Filter Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100/80 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] shrink-0">
          <button
            type="button"
            onClick={() => setFilterSeverity('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterSeverity === 'all'
                ? 'bg-white text-gray-900 shadow-2xs dark:bg-[#16181E] dark:text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
          >
            Tous ({issues.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterSeverity === 'critical'
                ? 'bg-rose-500 text-white shadow-2xs'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
            }`}
          >
            Critiques ({criticalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('major')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterSeverity === 'major'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10'
            }`}
          >
            Majeurs ({majorCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterSeverity('minor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterSeverity === 'minor'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10'
            }`}
          >
            Mineurs ({minorCount})
          </button>
        </div>
      </div>

      {/* 2. Issues List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:bg-[#16181E] dark:border-white/[0.08] space-y-4 animate-pulse"
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
        ) : activeIssues.length === 0 ? (
          <EmptyState
            title="Aucun incident actif"
            message="Tous les problèmes détectés ont été résolus ou aucun bug ne correspond à la sévérité filtrée."
            actionLabel="Voir tous les bugs"
            onActionClick={() => setFilterSeverity('all')}
            mainIcon={CheckCircleIcon}
            iconVariant="emerald"
            className="my-8"
          />
        ) : (
          activeIssues.map((bug: any) => {
            const diag = parseIssueDiagnostic(bug)
            const timeAgo = bug.created_at
              ? formatDistanceToNow(new Date(bug.created_at), { addSuffix: true, locale: fr })
              : 'Récemment'

            return (
              <div
                key={bug.id}
                className="rounded-2xl border border-gray-200/90 bg-white p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-gray-300 dark:bg-[#16181E] dark:border-white/[0.08] dark:hover:border-white/20 dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-200 space-y-4 group"
              >
                {/* Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100 dark:border-white/[0.06]">
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
                          className="text-xs font-mono text-gray-400 dark:text-zinc-500 hover:text-[#ee6018] transition-colors inline-flex items-center gap-1 truncate max-w-[200px] sm:max-w-xs"
                        >
                          <span>{new URL(bug.url).pathname || '/'}</span>
                          <ArrowTopRightOnSquareIcon className="h-3 w-3 shrink-0" />
                        </a>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 text-[11px] font-semibold">
                      <SparklesIcon className="h-3 w-3 text-emerald-500" />
                      <span>Confiance IA: {Math.round((diag.confidence ?? 0.95) * 100)}%</span>
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium">{timeAgo}</span>
                  </div>
                </div>

                {/* Bug Title & Summary */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 group-hover:text-[#ee6018] dark:group-hover:text-[#ff7836] transition-colors leading-snug">
                    <Link href={`/dashboard/sites/${bug.site_id}`} className="hover:underline">
                      {diag.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-zinc-300 mt-1 leading-relaxed">
                    {diag.summary}
                  </p>
                </div>

                {/* Business Impact Block */}
                {diag.impact && (
                  <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 dark:bg-white/[0.03] dark:border-white/[0.05] text-xs space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Impact Utilisateur / Métier
                    </span>
                    <p className="text-gray-700 dark:text-zinc-300 leading-relaxed font-medium">
                      {diag.impact}
                    </p>
                  </div>
                )}

                {/* AI Recommendation Block (Signal Orange Border & Tint) */}
                <div className="rounded-xl bg-orange-50/60 border border-orange-200/60 dark:bg-[#ee6018]/10 dark:border-[#ee6018]/25 p-3.5 text-xs text-gray-800 dark:text-zinc-200 flex items-start gap-2.5">
                  <span className="font-bold text-[#ee6018] dark:text-[#ff7836] shrink-0">
                    Solution recommandée :
                  </span>
                  <span className="leading-relaxed font-medium">{diag.recommendation}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
