'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useActiveSite } from '@/lib/hooks/useActiveSite'
import { useBillingStatus } from './useBillingStatus'
import { getUsageLevel, type UsageLevel } from '@/lib/billing/usage'

const BAR: Record<UsageLevel, string> = { ok: 'bg-gray-400 dark:bg-zinc-500', warn: 'bg-[#c2410c]', full: 'bg-red-600' }
const TEXT: Record<UsageLevel, string> = { ok: 'text-gray-600 dark:text-zinc-400', warn: 'text-[#c2410c] dark:text-orange-400', full: 'text-red-600 dark:text-red-400' }
const HINT: Record<UsageLevel, string | null> = { ok: null, warn: 'Vous approchez de la limite', full: 'Limite atteinte' }

export function UpgradeButton({ className = '' }: { className?: string }) {
  return <Link href="/pricing" className={`inline-flex min-h-9 items-center rounded-lg bg-[#c2410c] px-3 text-xs font-semibold text-white hover:opacity-90 ${className}`}>Passer à Pro</Link>
}

/** Pastille de plan, compteur d'usage et bouton « Passer à Pro » (visible seulement en Gratuit). */
export function PlanUsage({ compact = false }: { compact?: boolean }) {
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
      <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-700 dark:border-white/[0.08] dark:bg-[#16181E] dark:text-zinc-200">{isFree ? 'Gratuit' : data.label}</span>
      {isFree && <UpgradeButton />}
    </div>
  )
}
