'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BugAntIcon as Bug,
  ExclamationTriangleIcon as AlertTriangle,
  InformationCircleIcon as Info,
  CheckCircleIcon as CheckCircle2,
  ArrowTopRightOnSquareIcon as ExternalLink,
  ChevronRightIcon as ChevronRight,
  SparklesIcon as Sparkles,
} from '@heroicons/react/24/outline'
import { parseIssueDiagnostic } from '@/lib/qa/ai'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/ui/empty-state'

export default function BugsPage() {
  const router = useRouter()
  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['all-issues'],
    queryFn: async () => {
      const res = await fetch('/api/issues')
      if (!res.ok) throw new Error('Failed to fetch issues')
      return res.json()
    }
  })

  // Exclude ignored issues and resolved ones (unless we want to show history)
  // Master Spec says "Le Diff Engine reste la source de vérité pour resolved / persistent / new."
  // For the global bugs page, we just show active ones (new, persistent, open)
  const activeIssues = issues.filter((iss: any) => iss.status !== 'resolved' && iss.status !== 'ignored')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans">
          Bugs
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Diagnostics chirurgicaux générés par IA et Playwright avec preuves concrètes.
        </p>
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] dark:bg-[#14161C] dark:border-white/[0.08] space-y-4 animate-pulse"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-5 w-20 bg-gray-200/70 dark:bg-white/[0.08] rounded-md" />
                    <div className="h-5 w-16 bg-gray-200/50 dark:bg-white/[0.05] rounded-md" />
                    <div className="h-3.5 w-32 bg-gray-100 dark:bg-white/[0.04] rounded" />
                  </div>
                  <div className="h-5 w-24 bg-gray-100 dark:bg-white/[0.05] rounded-md" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-2/3 bg-gray-200/80 dark:bg-white/[0.08] rounded" />
                  <div className="h-3 w-4/5 bg-gray-100 dark:bg-white/[0.04] rounded" />
                </div>
                <div className="h-10 w-full bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04] rounded-lg p-2.5 flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-gray-200 dark:bg-white/[0.08]" />
                  <div className="h-2.5 w-1/3 bg-gray-200/60 dark:bg-white/[0.05] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activeIssues.length === 0 ? (
          <EmptyState
            title="Aucun bug actif trouvé"
            message="Bonne nouvelle ! Vos environnements semblent sains. Tous les incidents ont été résolus ou aucun n'a encore été détecté."
            actionLabel="Lancer un nouveau scan"
            actionIcon={Bug}
            onActionClick={() => router.push('/dashboard/sites')}
            mainIcon={CheckCircle2}
            iconVariant="emerald"
            className="my-8"
          />
        ) : (
          activeIssues.map((bug: any) => {
            const diag = parseIssueDiagnostic(bug)
            
            return (
              <div
                key={bug.id}
                className="rounded-xl border border-gray-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-gray-300 dark:bg-[#16181E] dark:border-white/[0.08] dark:hover:border-white/20 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        diag.severity === 'critical'
                          ? 'bg-red-50 text-red-600 border border-red-200/50 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/25'
                          : diag.severity === 'major'
                          ? 'bg-orange-50 text-[#ee6018] border border-orange-200/50 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/25'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-white/[0.08] dark:text-zinc-300 dark:border-white/[0.1]'
                      }`}
                    >
                      {diag.severity === 'critical' ? '🔴 Critique' : diag.severity === 'major' ? '🟠 Majeur' : '🟡 Mineur'}
                    </span>
                    
                    {bug.status === 'new' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200/60 dark:border-purple-500/20">
                        Nouveau
                      </span>
                    )}

                    <span className="text-xs font-mono text-gray-400 dark:text-zinc-500">
                      {bug.site?.name || bug.site?.url?.replace(/^https?:\/\//, '')}
                    </span>
                    
                    {bug.url && (
                      <>
                        <span className="text-xs text-gray-300 dark:text-zinc-600">·</span>
                        <a href={bug.url} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-gray-500 dark:text-zinc-400 hover:text-[#ee6018] transition-colors inline-flex items-center gap-1">
                          {new URL(bug.url).pathname}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 text-[11px] font-semibold">
                    <Sparkles className="h-3 w-3 text-emerald-500" />
                    <span>Confiance: {diag.confidence}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                    <Link href={`/dashboard/sites/${bug.site_id}`} className="hover:underline">
                      {diag.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-zinc-300 mt-1 leading-relaxed">
                    {diag.summary}
                  </p>
                </div>

                <div className="rounded-lg bg-orange-50/50 border border-orange-100 dark:bg-[#ee6018]/10 dark:border-[#ee6018]/25 p-3 text-xs text-gray-800 dark:text-zinc-200 flex items-start gap-2">
                  <span className="font-bold text-[#ee6018] dark:text-[#ff7836] shrink-0">Solution recommandée :</span>
                  <span className="leading-relaxed">{diag.recommendation}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
