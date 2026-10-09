'use client'

import Link from 'next/link'
import { useState } from 'react'

const plans = [
  { id: 'free', name: 'Gratuit', price: '0 €', detail: '1 synthèse d’essai puis 1 par mois', description: 'Pour découvrir Qualio avec vos premiers avis.', cta: 'Commencer gratuitement' },
  { id: 'essential', name: 'Essentiel', price: '15 €', detail: '4 synthèses par mois', description: 'Pour suivre les retours avec un rythme régulier.', cta: 'Choisir Essentiel', featured: true },
  { id: 'pro', name: 'Pro', price: '39 €', detail: '12 synthèses par mois', description: 'Pour transformer les avis en rituel produit.', cta: 'Choisir Pro' },
] as const

export function PricingPlans() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function choose(plan: typeof plans[number]['id']) {
    if (plan === 'free') return
    setLoading(plan); setError(null)
    try {
      const response = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) })
      const result = await response.json().catch(() => ({}))
      if (response.status === 401) return window.location.assign(`/login?redirectTo=${encodeURIComponent(`/pricing?plan=${plan}`)}`)
      if (!response.ok || !result.url) return setError(result.error ?? 'Le paiement n’est pas encore configuré.')
      window.location.assign(result.url)
    } finally { setLoading(null) }
  }

  return <main className="min-h-screen bg-[#fbfbfb] px-5 py-16 text-gray-950 dark:bg-[#0b0c0e] dark:text-white"><div className="mx-auto max-w-6xl"><Link href="/" className="text-sm font-semibold text-gray-500 hover:text-[#ee6018]">← Qualio</Link><div className="mx-auto mt-16 max-w-2xl text-center"><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c95720]">Tarifs</span><h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">Un plan simple pour chaque rythme d’écoute.</h1><p className="mt-4 text-base leading-7 text-gray-500 dark:text-zinc-400">Les paiements sont sécurisés par Stripe. Votre plan n’est activé qu’après confirmation du paiement.</p></div>{error && <p role="alert" className="mx-auto mt-8 max-w-xl rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-800">{error}</p>}<div className="mt-12 grid gap-4 md:grid-cols-3">{plans.map((plan) => { const featured = 'featured' in plan && plan.featured; return <article key={plan.id} className={`flex min-h-[330px] flex-col rounded-2xl border bg-white p-6 dark:bg-[#181B21] ${featured ? 'border-[#ee6018] shadow-lg shadow-[#ee6018]/10' : 'border-gray-200 dark:border-white/10'}`}>{featured && <span className="mb-5 self-start rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#c95720] dark:bg-orange-500/10 dark:text-orange-300">Le plus choisi</span>}<span className="text-sm font-semibold text-gray-500 dark:text-zinc-400">{plan.name}</span><strong className="mt-6 text-4xl tracking-[-0.06em]">{plan.price}<small className="ml-1 text-xs font-medium tracking-normal text-gray-400">/mois</small></strong><p className="mt-4 text-sm font-semibold">{plan.detail}</p><p className="mt-2 text-sm leading-6 text-gray-500 dark:text-zinc-400">{plan.description}</p><div className="mt-auto pt-7">{plan.id === 'free' ? <Link href="/login?mode=register" className="block rounded-lg border border-gray-200 px-4 py-3 text-center text-xs font-bold hover:border-gray-400 dark:border-white/10">{plan.cta}</Link> : <button type="button" onClick={() => choose(plan.id)} disabled={Boolean(loading)} className="block w-full rounded-lg bg-[#ee6018] px-4 py-3 text-xs font-bold text-white hover:bg-[#d95514] disabled:opacity-50">{loading === plan.id ? 'Ouverture du paiement…' : plan.cta}</button>}</div></article> })}</div></div></main>
}
