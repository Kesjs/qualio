'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast as sonnerToast } from 'sonner'
import { FOCUS } from '@/components/admin/ui'
import { AcquisitionAdd } from '@/components/admin/AcquisitionAdd'
import { AcquisitionDrafts } from '@/components/admin/AcquisitionDrafts'
import { AcquisitionQueue } from '@/components/admin/AcquisitionQueue'
import { AcquisitionReportStudio } from '@/components/admin/AcquisitionReportStudio'
import { AcquisitionTracking } from '@/components/admin/AcquisitionTracking'
import { BTN_SMALL, type Notify, type ReportTarget, type Tab } from '@/components/admin/acquisition-shared'
import type { PipelineData } from '@/lib/admin/acquisition'

const TAB_LABEL: Record<Tab, string> = {
  queue: 'À contacter',
  drafts: 'Brouillons',
  tracking: 'Suivi & ouvertures',
}

export function AcquisitionPipeline({ data }: { data: PipelineData }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(
    data.queue.length ? 'queue' : data.drafts.length ? 'drafts' : data.tracking.length ? 'tracking' : 'queue',
  )
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null)
  const [rescanProgress, setRescanProgress] = useState<{ scanned: number; total: number } | null>(null)
  const pipelineRef = useRef<HTMLElement>(null)

  const notify: Notify = useCallback((kind, text, go) => {
    if (go) {
      setTab(go)
      window.setTimeout(() => pipelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }
    const options = go ? { action: { label: `Ouvrir « ${TAB_LABEL[go]} »`, onClick: () => setTab(go) } } : undefined
    if (kind === 'success') sonnerToast.success(text, options)
    else if (kind === 'error') sonnerToast.error(text)
    else sonnerToast.info(text, options)
  }, [])

  const refresh = useCallback(() => router.refresh(), [router])

  async function rescanAll() {
    setRescanProgress({ scanned: 0, total: 0 })
    let offset = 0
    let scanned = 0
    let failed = 0
    let total = 0
    while (true) {
      const response = await fetch('/api/admin/acquisition/scan-all', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ offset, limit: 2 }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setRescanProgress(null)
        return notify('error', result.error ?? 'La réanalyse a échoué.')
      }
      scanned += result.scanned ?? 0
      failed += result.failed ?? 0
      total = result.total ?? total
      setRescanProgress({ scanned, total })
      offset = result.nextOffset ?? offset + 2
      if (!result.hasMore) break
    }
    setRescanProgress(null)
    refresh()
    notify(
      failed ? 'info' : 'success',
      `${scanned}/${total} site(s) réanalysé(s)${failed ? ` · ${failed} hors ligne` : ''}. Sources d’avis et scores mis à jour.`,
    )
  }

  const { stats } = data
  const counts: Record<Tab, number> = {
    queue: data.queue.length,
    drafts: data.drafts.length,
    tracking: data.tracking.length,
  }
  const remainingToday = Math.max(0, stats.dailyLimit - stats.sentToday)
  const quotaPct = stats.dailyLimit > 0 ? Math.min(100, Math.round((stats.sentToday / stats.dailyLimit) * 100)) : 0

  return (
    <div className="space-y-6">
      {stats.pausedForBounces && (
        <div
          role="alert"
          className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm leading-6 text-red-700 dark:text-red-300"
        >
          <strong>Envois suspendus automatiquement.</strong> {stats.bounceRate} % de rebonds sur 30 jours (seuil de sécurité : 10 %). Vérifie les adresses non confirmées avant de reprendre pour protéger ton domaine.
        </div>
      )}

      {/* Bandeau de métriques unifié : zéro boîte dans des boîtes, séparateurs fins, chiffres tabulaires */}
      <section
        aria-label="Indicateurs de prospection"
        className="grid divide-y divide-gray-200/80 rounded-2xl border border-gray-200/90 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:divide-white/[0.06] dark:border-white/[0.08] dark:bg-[#16181E] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x"
      >
        <div className="p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">Cadence du jour</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
            {stats.sentToday} <span className="text-base font-normal text-gray-400 dark:text-zinc-500">/ {stats.dailyLimit}</span>
          </p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]" aria-hidden>
            <span className="block h-full rounded-full bg-[#ee6018] transition-all duration-200" style={{ width: `${quotaPct}%` }} />
          </div>
          <p className="mt-2 font-mono text-[11px] tabular-nums text-gray-500 dark:text-zinc-400">
            {stats.delivered} livrés au total · {remainingToday} restants
          </p>
        </div>

        <div className="p-5 sm:border-l sm:border-gray-200/80 sm:dark:border-white/[0.06] lg:border-l-0">
          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">Rapports /rapport ouverts</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-emerald-700 dark:text-[#a0ca92]">
            {stats.reportsOpened}{' '}
            <span className="text-base font-normal text-gray-400 dark:text-zinc-500">/ {stats.reportsCreated}</span>
          </p>
          <p className="mt-2.5 text-xs text-gray-500 dark:text-zinc-400">
            {stats.reportsCreated > 0
              ? 'Ouvertures humaines filtrées (hors robots mail)'
              : 'Crée un premier rapport ci-dessous'}
          </p>
        </div>

        <div className="border-t border-gray-200/80 p-5 dark:border-white/[0.06] lg:border-t-0">
          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">Réponses obtenues</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[#c2410c] dark:text-[#ff9a66]">
            {stats.replied}{' '}
            <span className="text-sm font-normal text-gray-500 dark:text-zinc-400">({stats.replyRate} %)</span>
          </p>
          <p className="mt-2.5 text-xs text-gray-500 dark:text-zinc-400">
            {stats.drafts > 0 ? `${stats.drafts} brouillon(s) prêts à partir` : 'Aucun brouillon en attente'}
          </p>
        </div>

        <div className="border-t border-gray-200/80 p-5 dark:border-white/[0.06] sm:border-l lg:border-t-0">
          <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">Santé délivrabilité (30 j)</p>
          <p
            className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
              stats.bounceRate > 5 ? 'text-red-700 dark:text-red-400' : ''
            }`}
          >
            {stats.bounceRate} % <span className="text-xs font-normal text-gray-500 dark:text-zinc-400">rebonds</span>
          </p>
          <p className="mt-2.5 font-mono text-[11px] tabular-nums text-gray-500 dark:text-zinc-400">
            {stats.bounced} rebond(s) historique · cible &lt; 5 %
          </p>
        </div>
      </section>

      <AcquisitionReportStudio
        target={reportTarget}
        onClearTarget={() => setReportTarget(null)}
        notify={notify}
        refresh={refresh}
      />

      <section
        ref={pipelineRef}
        aria-label="Pipeline de prospection"
        className="scroll-mt-24 rounded-2xl border border-gray-200/90 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:border-white/[0.08] dark:bg-[#16181E] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
      >
        <div
          role="tablist"
          aria-label="Étapes de prospection"
          className="flex gap-1 overflow-x-auto border-b border-gray-200/80 p-2 dark:border-white/[0.06]"
        >
          {(['queue', 'drafts', 'tracking'] as const).map((value) => {
            const active = tab === value
            return (
              <button
                key={value}
                type="button"
                role="tab"
                id={`onglet-${value}`}
                aria-selected={active}
                aria-controls={`panneau-${value}`}
                onClick={() => setTab(value)}
                className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors duration-150 ${FOCUS} ${
                  active
                    ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
                }`}
              >
                {TAB_LABEL[value]}
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-xs tabular-nums ${
                    active ? 'bg-white/20 text-white dark:bg-black/10 dark:text-gray-950' : 'bg-gray-100 text-gray-700 dark:bg-white/[0.08] dark:text-zinc-300'
                  }`}
                >
                  {counts[value]}
                </span>
              </button>
            )
          })}
        </div>
        <div role="tabpanel" id={`panneau-${tab}`} aria-labelledby={`onglet-${tab}`} className="p-5">
          {tab === 'queue' && (
            <AcquisitionQueue
              items={data.queue}
              notify={notify}
              refresh={refresh}
              onCreateReport={(target) => setReportTarget(target)}
            />
          )}
          {tab === 'drafts' && (
            <AcquisitionDrafts
              drafts={data.drafts}
              remainingToday={remainingToday}
              notify={notify}
              refresh={refresh}
              onCreateReport={(target) => setReportTarget(target)}
            />
          )}
          {tab === 'tracking' && <AcquisitionTracking messages={data.tracking} notify={notify} refresh={refresh} />}
        </div>
      </section>

      <AcquisitionAdd notify={notify} refresh={refresh} />

      <details className="rounded-2xl border border-gray-200/90 bg-white px-5 py-3.5 dark:border-white/[0.08] dark:bg-[#16181E]">
        <summary className={`cursor-pointer text-sm font-semibold text-gray-800 dark:text-zinc-200 ${FOCUS}`}>
          Maintenance &amp; recalcul des signaux
        </summary>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-white/[0.06]">
          <p className="max-w-[65ch] text-xs leading-5 text-gray-600 dark:text-zinc-400">
            Reparcourt les sites déjà en base pour extraire leurs pages d’avis publiques (App Store, Trustpilot, G2, Capterra), vérifier leurs emails et recalculer leur score sans perdre l’historique.
          </p>
          <button type="button" onClick={() => void rescanAll()} disabled={rescanProgress !== null} className={BTN_SMALL}>
            {rescanProgress
              ? `Réanalyse ${rescanProgress.scanned}${rescanProgress.total ? `/${rescanProgress.total}` : ''}…`
              : 'Tout réanalyser'}
          </button>
        </div>
      </details>
    </div>
  )
}
