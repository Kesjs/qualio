'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useActiveSite } from '@/lib/hooks/useActiveSite'
import { useBillingStatus } from './useBillingStatus'
import { getUsageLevel, type UsageLevel } from '@/lib/billing/usage'

const BAR: Record<UsageLevel, string> = { ok: 'bg-gray-400 dark:bg-zinc-500', warn: 'bg-[#c2410c]', full: 'bg-red-600' }
const TEXT: Record<UsageLevel, string> = { ok: 'text-gray-600 dark:text-zinc-400', warn: 'text-[#c2410c] dark:text-orange-400', full: 'text-red-600 dark:text-red-400' }
const HINT: Record<UsageLevel, string | null> = { ok: null, warn: 'Vous approchez de la limite', full: 'Limite atteinte' }

export function UpgradeButton({ className = '', subtle = false }: { className?: string; subtle?: boolean }) {
  const { activeSite } = useActiveSite()
  const { data } = useBillingStatus(activeSite?.id)
  if (data?.plan === 'agency') return null
  const label = data?.plan === 'pro' ? 'Passer à Agence' : 'Passer à Pro'
  const look = subtle
    ? 'border border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:text-gray-950 dark:border-white/[0.1] dark:bg-transparent dark:text-zinc-300 dark:hover:border-white/30 dark:hover:text-white'
    : 'bg-[#c2410c] text-white hover:opacity-90'
  return <Link href="/pricing" className={`inline-flex min-h-9 items-center rounded-lg px-3 text-xs font-semibold ${look} ${className}`}>{label}</Link>
}

/** État du plan gratuit pour l'incitation à passer à Pro : visible seulement en Gratuit, « urgent » quand une limite est touchée. */
export function useFreePlanUpgrade() {
  const { activeSite } = useActiveSite()
  const { data } = useBillingStatus(activeSite?.id)
  if (!data || data.plan !== 'free') return { show: false, urgent: false, hint: '' }
  const site = data.site
  const level = site ? getUsageLevel(site.feedback, site.feedbackLimit) : 'ok'
  const synthesisBlocked = Boolean(site?.nextSynthesisAt && new Date(site.nextSynthesisAt).getTime() > Date.now())
  const hint = level === 'full' && site ? `Vous avez atteint ${site.feedbackLimit} avis.`
    : level === 'warn' && site ? `Vous approchez de la limite de ${site.feedbackLimit} avis.`
    : synthesisBlocked ? 'Votre prochaine synthèse n’est pas encore disponible.'
    : 'Avec Pro, la synthèse est automatique chaque semaine.'
  return { show: true, urgent: level !== 'ok' || synthesisBlocked, hint }
}

/** Pastille de plan et compteur d'usage. Le bouton « Passer à Pro » vit dans la barre latérale. */
export function PlanUsage({ compact = false }: { compact?: boolean }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { activeSite } = useActiveSite()
  const { data, refetch } = useBillingStatus(activeSite?.id)

  useEffect(() => {
    const onRefresh = () => { void refetch() }
    window.addEventListener('app:refresh', onRefresh)
    return () => window.removeEventListener('app:refresh', onRefresh)
  }, [refetch])

  if (!data) return null
  const isFree = data.plan === 'free'
  const site = data.site
  const level = site ? getUsageLevel(site.feedback, site.feedbackLimit) : 'ok'
  const pct = site && site.feedbackLimit > 0 ? Math.min(100, Math.round((site.feedback / site.feedbackLimit) * 100)) : 0

  return (
    <div className="flex items-center gap-3">
      {site && !compact && (
        <div className="hidden min-w-0 flex-col gap-1 lg:flex" aria-live="polite">
          <div className={`flex items-center justify-between gap-3 text-xs font-medium ${TEXT[level]}`}>
            <span>{site.feedback} / {site.feedbackLimit} avis</span>
            {HINT[level] && <span className="font-semibold">{HINT[level]}</span>}
          </div>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={site.feedbackLimit} aria-valuenow={site.feedback} aria-label="Avis utilisés dans ce projet">
            <div className={`h-full rounded-full transition-all ${BAR[level]}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setDetailsOpen(true)}
        aria-label="Voir le détail du quota d’avis"
        className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${TEXT[level]} ${level === 'full' ? 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10' : level === 'warn' ? 'border-orange-200 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10' : 'border-gray-200 bg-gray-50 dark:border-white/[0.08] dark:bg-[#16181E]'} hover:border-gray-400 dark:hover:border-white/25`}
      >
        {compact && site ? `${isFree ? 'Gratuit' : data.label} · ${site.feedback}/${site.feedbackLimit}` : isFree ? 'Gratuit' : data.label}
      </button>
      {detailsOpen && site && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-3 sm:items-center sm:p-6" role="presentation" onClick={() => setDetailsOpen(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="usage-sheet-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-white/[0.1] dark:bg-[#16181E]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-zinc-400">Quota du projet</p>
                <h2 id="usage-sheet-title" className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">{isFree ? 'Gratuit' : data.label}</h2>
              </div>
              <button type="button" onClick={() => setDetailsOpen(false)} className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/10">Fermer</button>
            </div>
            <div className="mt-5 space-y-3 text-sm text-gray-700 dark:text-zinc-300">
              <div className="flex justify-between gap-4"><span>Avis utilisés</span><strong className={TEXT[level]}>{site.feedback} / {site.feedbackLimit}</strong></div>
              <div className="flex justify-between gap-4"><span>Avis restants</span><strong>{Math.max(0, site.feedbackLimit - site.feedback)}</strong></div>
              <div className="flex justify-between gap-4"><span>Renouvellement</span><strong>{data.currentPeriodEnd ? new Date(data.currentPeriodEnd).toLocaleDateString('fr-FR') : 'Selon votre plan'}</strong></div>
            </div>
            {!isFree && <Link href="/pricing" onClick={() => setDetailsOpen(false)} className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-[#c2410c] px-3 text-xs font-semibold text-white hover:opacity-90">Passer au plan supérieur</Link>}
            {isFree && <Link href="/pricing" onClick={() => setDetailsOpen(false)} className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-[#c2410c] px-3 text-xs font-semibold text-white hover:opacity-90">Passer à Pro</Link>}
          </section>
        </div>,
        document.body,
      )}
    </div>
  )
}
