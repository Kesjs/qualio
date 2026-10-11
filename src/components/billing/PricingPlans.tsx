'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BILLING_PLANS, type PaidPlan } from '@/lib/billing/plans'

const planIds = ['free', 'pro'] as const

export function PricingPlans() {
  const [loading, setLoading] = useState<PaidPlan | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function choose(plan: PaidPlan) {
    setLoading(plan)
    setError(null)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const result = await response.json().catch(() => ({}))
      if (response.status === 401) {
        window.location.assign(`/login?redirectTo=${encodeURIComponent('/pricing?plan=pro')}`)
        return
      }
      if (!response.ok || !result.url) {
        setError(result.error ?? 'Le paiement n’est pas encore disponible.')
        return
      }
      window.location.assign(result.url)
    } catch {
      setError('Impossible d’ouvrir le paiement. Réessayez dans un instant.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfbfb] px-5 py-16 text-gray-950 dark:bg-[#0b0c0e] dark:text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-gray-500 hover:text-[#ee6018]">← Qualio</Link>
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c95720]">Tarifs</span>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">Transformez vos avis en décisions.</h1>
          <p className="mt-4 text-base leading-7 text-gray-500 dark:text-zinc-400">Deux offres, sans promesse cachée. L’essai Pro dure 14 jours sans carte bancaire.</p>
        </div>
        {error ? <p role="alert" className="mx-auto mt-8 max-w-xl rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">{error}</p> : null}
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {planIds.map((id) => {
            const plan = BILLING_PLANS[id]
            const isPro = id === 'pro'
            return (
              <article key={id} className={`flex min-h-[420px] flex-col rounded-2xl border bg-white p-6 dark:bg-[#181B21] ${isPro ? 'border-[#ee6018] shadow-lg shadow-[#ee6018]/10' : 'border-gray-200 dark:border-white/10'}`}>
                {isPro ? <span className="mb-5 self-start rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c95720] dark:bg-orange-500/10 dark:text-orange-300">14 jours offerts</span> : null}
                <span className="text-sm font-semibold text-gray-500 dark:text-zinc-400">{plan.label}</span>
                <strong className="mt-6 text-4xl tracking-[-0.06em]">{plan.priceEur} €{isPro ? <small className="ml-1 text-xs font-medium tracking-normal text-gray-400">/mois</small> : null}</strong>
                <ul className="mt-6 space-y-3 border-t border-gray-100 pt-6 text-sm text-gray-700 dark:border-white/[0.06] dark:text-zinc-300">
                  {plan.features.map((feature) => <li key={feature} className="flex gap-2"><span className="text-[#ee6018]">✓</span><span>{feature}</span></li>)}
                </ul>
                <div className="mt-auto pt-8">
                  {isPro ? <button type="button" onClick={() => choose('pro')} disabled={loading !== null} className="block min-h-11 w-full rounded-xl bg-[#ee6018] px-4 py-3 text-sm font-bold text-white hover:bg-[#d95514] disabled:opacity-50">{loading === 'pro' ? 'Ouverture du paiement…' : 'Passer en Pro'}</button> : <Link href="/login?mode=register" className="block min-h-11 rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-bold hover:border-gray-400 dark:border-white/10">Commencer gratuitement</Link>}
                </div>
              </article>
            )
          })}
        </div>
        <p className="mt-8 text-center text-sm text-gray-500 dark:text-zinc-400">Vos données sont conservées si vous repassez en Gratuit.</p>
      </div>
    </main>
  )
}
