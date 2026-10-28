'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast as sonnerToast } from 'sonner'
import { StatCard } from '@/components/admin/ui'
import { AcquisitionAdd } from '@/components/admin/AcquisitionAdd'
import { AcquisitionDrafts } from '@/components/admin/AcquisitionDrafts'
import { AcquisitionQueue } from '@/components/admin/AcquisitionQueue'
import { AcquisitionTracking } from '@/components/admin/AcquisitionTracking'
import { BTN_SMALL, type Notify, type Tab } from '@/components/admin/acquisition-shared'
import type { PipelineData } from '@/lib/admin/acquisition'

type Toast = { kind: 'success' | 'error' | 'info'; text: string; go?: Tab }

const TOAST_STYLE = {
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300',
  error: 'border-red-400/30 bg-red-400/10 text-red-700 dark:text-red-300',
  info: 'border-sky-400/30 bg-sky-400/10 text-sky-700 dark:text-sky-300',
} as const
const TAB_LABEL: Record<Tab, string> = { queue: 'À contacter', drafts: 'Brouillons', tracking: 'Suivi' }

export function AcquisitionPipeline({ data }: { data: PipelineData }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(data.queue.length ? 'queue' : data.drafts.length ? 'drafts' : data.tracking.length ? 'tracking' : 'queue')
  const [toast, setToast] = useState<Toast | null>(null)
  const [rescanning, setRescanning] = useState(false)
  const pipelineRef = useRef<HTMLElement>(null)
  const notify: Notify = useCallback((kind, text, go) => {
    if (go) {
      setTab(go)
      window.setTimeout(() => pipelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }
    if (kind === 'success') {
      sonnerToast.success(text, {
        action: go ? { label: `Voir « ${TAB_LABEL[go]} »`, onClick: () => setTab(go) } : undefined,
      })
    } else if (kind === 'error') {
      sonnerToast.error(text)
    } else {
      sonnerToast.info(text)
    }
    setToast({ kind, text, go })
  }, [])
  const refresh = useCallback(() => router.refresh(), [router])
  async function rescanAll() {
    setRescanning(true)
    let offset = 0
    let scanned = 0
    let failed = 0
    let total = 0
    while (true) {
      const response = await fetch('/api/admin/acquisition/scan-all', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ offset, limit: 1 }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) { setRescanning(false); return notify('error', result.error ?? 'La réanalyse a échoué.') }
      scanned += result.scanned ?? 0
      failed += result.failed ?? 0
      total = result.total ?? total
      offset = result.nextOffset ?? offset + 5
      if (!result.hasMore) break
    }
    setRescanning(false)
    refresh()
    notify(failed ? 'info' : 'success', `${scanned}/${total} entreprise(s) réanalysée(s)${failed ? ` · ${failed} échec(s)` : ''}. Les domaines ont été conservés.`)
  }
  useEffect(() => {
    if (!toast || toast.kind === 'error') return
    const timer = setTimeout(() => setToast(null), 9000)
    return () => clearTimeout(timer)
  }, [toast])

  const { stats } = data
  const counts: Record<Tab, number> = { queue: data.queue.length, drafts: data.drafts.length, tracking: data.tracking.length }
  const remainingToday = Math.max(0, stats.dailyLimit - stats.sentToday)

  return (
    <div className="space-y-6">
      <section aria-label="Indicateurs de prospection" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Envoyés aujourd’hui" value={`${stats.sentToday} / ${stats.dailyLimit}`} hint={`${stats.delivered} livrés au total`} />
        <StatCard label="Réponses" value={stats.replied} hint={`${stats.replyRate} % de réponse`} tone="accent" />
        <StatCard label="Rebonds" value={`${stats.bounced} · ${stats.bounceRate} %`} hint={stats.sentTotal ? `sur ${stats.sentTotal} envoyés` : 'Aucun envoi pour l’instant'} tone={stats.bounced > 0 ? 'danger' : 'neutral'} />
        <StatCard label="Brouillons à envoyer" value={stats.drafts} hint="Relis puis envoie en une action" />
      </section>

      <div aria-live="polite" aria-atomic="true">
        {toast && (
          <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${TOAST_STYLE[toast.kind]}`}>
            <span>{toast.text}</span>
            <span className="flex gap-2">
              {toast.go && <button type="button" onClick={() => { setTab(toast.go as Tab); setToast(null) }} className={BTN_SMALL}>Voir « {TAB_LABEL[toast.go]} »</button>}
              <button type="button" onClick={() => setToast(null)} className={BTN_SMALL}>Fermer</button>
            </span>
          </div>
        )}
      </div>

      <section ref={pipelineRef} aria-label="Pipeline de prospection" className="scroll-mt-24 rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111216]">
        <div role="tablist" aria-label="Étapes de prospection" className="flex gap-1 overflow-x-auto border-b border-gray-200/80 dark:border-white/[0.08] p-2">
          {(['queue', 'drafts', 'tracking'] as const).map((value) => (
            <button key={value} type="button" role="tab" id={`onglet-${value}`} aria-selected={tab === value} aria-controls={`panneau-${value}`} onClick={() => setTab(value)} className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold ${tab === value ? 'bg-gray-100 dark:bg-white/[0.1] text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'}`}>
              {TAB_LABEL[value]}<span className="rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 font-mono text-xs">{counts[value]}</span>
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panneau-${tab}`} aria-labelledby={`onglet-${tab}`} className="p-5">
          {tab === 'queue' && <AcquisitionQueue items={data.queue} notify={notify} refresh={refresh} />}
          {tab === 'drafts' && <AcquisitionDrafts drafts={data.drafts} remainingToday={remainingToday} notify={notify} refresh={refresh} />}
          {tab === 'tracking' && <AcquisitionTracking messages={data.tracking} notify={notify} refresh={refresh} />}
        </div>
      </section>
      <AcquisitionAdd notify={notify} refresh={refresh} />
      <details className="rounded-xl border border-sky-400/20 bg-sky-400/5 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-sky-900 dark:text-sky-100">Maintenance de la prospection</summary>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-sky-900 dark:text-sky-100">Actualise les emails et signaux de tous les prospects sans supprimer leurs domaines.</p>
        <button type="button" onClick={() => void rescanAll()} disabled={rescanning} className={BTN_SMALL}>{rescanning ? 'Réanalyse en cours…' : 'Tout réanalyser'}</button>
        </div>
      </details>
    </div>
  )
}
