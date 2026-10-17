'use client'

import { useQuery } from '@tanstack/react-query'

import type { PlanId } from '@/lib/billing/plans'

export interface BillingStatus {
  plan: PlanId
  label: string
  status: string
  source: 'stripe' | 'manual' | null
  provider?: 'stripe' | 'geniuspay' | string
  interval: 'month' | 'year' | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  limits: { projects: number; feedbackPerProject: number; synthesisCooldownHours: number; synthesisQuota: { count: number; windowDays: number } | null; widget: boolean }
  usage: { projects: number }
  /** Projets modifiables pour le plan (doc 2.3) : les autres sont en lecture seule. */
  writableSiteIds: string[]
  site: { feedback: number; feedbackLimit: number; lockedFeedback: number; id: string; lockedPreview: Array<{ excerpt: string; created_at: string }>; lastSynthesisAt: string | null; nextSynthesisAt: string | null } | null
}

/** Plan et usage du projet actif, pour l'en-tête (doc 3.2). */
export function useBillingStatus(siteId?: string) {
  return useQuery({
    queryKey: ['billing-status-header', siteId ?? null],
    queryFn: async () => {
      const url = siteId ? `/api/billing/status?siteId=${encodeURIComponent(siteId)}` : '/api/billing/status'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Impossible de charger le plan.')
      return (await response.json()) as BillingStatus
    },
    staleTime: 60_000,
  })
}
