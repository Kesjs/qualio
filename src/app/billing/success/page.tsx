'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { startBillingConfirmationPoll, type BillingConfirmationState } from '@/lib/billing/success-poll'

export default function BillingSuccessPage() {
  const router = useRouter()
  const [state, setState] = useState<BillingConfirmationState>('checking')
  const stopPollingRef = useRef<(() => void) | null>(null)
  const redirectTimerRef = useRef<number | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    stopPollingRef.current?.()
    setState('checking')

    stopPollingRef.current = startBillingConfirmationPoll({
      fetchStatus: async () => {
        try {
          const response = await fetch('/api/billing/status', { cache: 'no-store' })
          if (response.status === 401) return { state: 'unauthorized' as const }
          if (!response.ok) return { state: 'pending' as const }
          const data = await response.json() as { plan?: string; status?: string }
          if (data.plan !== 'free' && (data.status === 'active' || data.status === 'trialing')) return { state: 'confirmed' as const, data }
          return { state: 'pending' as const }
        } catch {
          return { state: 'pending' as const }
        }
      },
      onState: (nextState) => {
        if (cancelled) return
        setState(nextState)
        if (nextState === 'confirmed') redirectTimerRef.current = window.setTimeout(() => router.replace('/onboarding'), 1_200)
      },
    })

    return () => {
      cancelled = true
      stopPollingRef.current?.()
      stopPollingRef.current = null
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }
  }, [retryKey, router])

  const checking = state === 'checking'
  const confirmed = state === 'confirmed'
  const unauthorized = state === 'unauthorized'
  const delayed = state === 'delayed'

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfbfb] px-5 dark:bg-[#0b0c0e]">
      <section className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#181B21]" aria-live="polite">
        <span className={`text-xs font-bold uppercase tracking-[0.14em] ${confirmed ? 'text-emerald-600' : unauthorized ? 'text-red-600' : delayed ? 'text-amber-600' : 'text-gray-500 dark:text-zinc-400'}`}>
          {confirmed ? 'Paiement validé' : unauthorized ? 'Session expirée' : delayed ? 'Confirmation en retard' : 'Paiement reçu'}
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-gray-950 dark:text-white">
          {confirmed ? 'Votre abonnement est actif.' : unauthorized ? 'Reconnectez-vous pour voir votre abonnement.' : delayed ? 'La confirmation prend plus de temps que prévu.' : 'Nous confirmons votre paiement.'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-zinc-400">
          {confirmed ? 'Votre paiement est confirmé. Nous vous guidons maintenant dans la configuration de votre espace avant son ouverture.' : unauthorized ? 'Votre session a expiré. Reconnectez-vous pour vérifier l’activation de votre abonnement.' : delayed ? 'Votre paiement a bien été transmis, mais la confirmation prend plus de temps que prévu. Votre accès sera activé automatiquement, vous n’avez rien à repayer.' : 'Votre paiement a été transmis. Nous attendons la confirmation sécurisée de GeniusPay.'}
        </p>
        {checking && <div className="mx-auto mt-6 h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[#c2410c] motion-reduce:animate-none" role="status" aria-label="Vérification en cours" />}
        {confirmed && <Link href="/onboarding" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#c2410c] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#9a3412]">Continuer vers la configuration</Link>}
        {delayed && <div className="mt-6 flex flex-col items-center gap-3"><button type="button" onClick={() => setRetryKey((key) => key + 1)} className="inline-flex min-h-11 items-center rounded-lg bg-[#c2410c] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#9a3412]">Revérifier maintenant</button><Link href="/contact" className="text-sm font-semibold text-gray-600 underline underline-offset-4 dark:text-zinc-300">Contacter le support</Link></div>}
        {unauthorized && <Link href="/login" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#c2410c] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#9a3412]">Se reconnecter</Link>}
      </section>
    </main>
  )
}
