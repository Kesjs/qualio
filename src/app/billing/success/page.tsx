"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BillingSuccessPage() {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    const check = async () => {
      attempts += 1
      try {
        const response = await fetch('/api/billing/status', { cache: 'no-store' })
        const data = await response.json()
        if (!cancelled && data.plan !== 'free' && ['active', 'trialing'].includes(data.status)) {
          setConfirmed(true)
          window.setTimeout(() => router.replace('/onboarding'), 1200)
          return
        }
      } catch {
        // Le webhook peut encore être en cours ; on continue à vérifier.
      }
      if (!cancelled && attempts < 12) window.setTimeout(check, 1500)
    }
    void check()
    return () => { cancelled = true }
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfbfb] px-5 dark:bg-[#0b0c0e]">
      <section className="max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#181B21]">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">
          {confirmed ? 'Paiement validé' : 'Paiement reçu'}
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-gray-950 dark:text-white">
          {confirmed ? 'Votre abonnement est actif.' : 'Nous confirmons votre paiement.'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-zinc-400">
          {confirmed
            ? 'Votre paiement est confirmé. Nous vous guidons maintenant dans la configuration de votre espace avant son ouverture.'
            : 'Votre paiement a été transmis. La confirmation finale arrive dans quelques secondes, puis vous passerez par la configuration de votre espace.'}
        </p>
        <Link
          href="/onboarding"
          className="mt-6 inline-flex rounded-lg px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
          style={{ background: '#c2410c' }}
        >
          {confirmed ? 'Continuer vers la configuration' : 'Continuer'}
        </Link>
      </section>
    </main>
  )
}
