'use client'

import { useEffect, useState } from 'react'
import { ApiError } from '@/lib/hooks/useDashboard'
import type { BillingStatus } from '@/components/dashboard/useBillingStatus'
import { btnSecondary } from './bricks'

/** Date de la prochaine synthèse possible (erreur 429 en priorité, sinon quota du projet). */
export function getNextSynthesisAt(generateError: Error | null, billing: BillingStatus | undefined): string | null {
  const quotaError = generateError instanceof ApiError && generateError.status === 429 && generateError.body.quota === 'synthesis'
  const fromError = quotaError && typeof generateError.body.nextAvailableAt === 'string' ? generateError.body.nextAvailableAt : null
  return fromError ?? billing?.site?.nextSynthesisAt ?? null
}

/** « dans 4 h » tant qu'il reste plus d'une heure, « dans 45 min » ensuite, « dans moins d'une minute » à la fin. */
export function formatCountdown(ms: number): string {
  const minutes = Math.ceil(ms / 60_000)
  if (minutes > 60) {
    const hours = Math.ceil(minutes / 60)
    return `dans ${hours} h`
  }
  if (minutes > 1) return `dans ${minutes} min`
  return 'dans moins d’une minute'
}

export function SynthesisRefresh({ generateError, billing, generating, onGenerate }: {
  generateError: Error | null
  billing: BillingStatus | undefined
  generating: boolean
  onGenerate: () => void
}) {
  const nextAt = getNextSynthesisAt(generateError, billing)
  const target = nextAt ? new Date(nextAt).getTime() : NaN
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (Number.isNaN(target) || target <= Date.now()) return
    const id = setInterval(() => setNow(Date.now()), 15_000)
    setNow(Date.now())
    return () => clearInterval(id)
  }, [target])

  const remaining = target - now
  const blocked = !Number.isNaN(target) && remaining > 0

  return (
    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
      {blocked && (
        <p className="text-sm text-gray-600 dark:text-zinc-400" aria-live="polite">Synthèse {formatCountdown(remaining)}</p>
      )}
      <button type="button" onClick={onGenerate} disabled={blocked || generating} className={btnSecondary}>
        {generating ? 'Actualisation…' : 'Actualiser'}
      </button>
    </div>
  )
}
