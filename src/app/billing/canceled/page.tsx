'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function BillingCanceledPage() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference')

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfbfb] px-5 dark:bg-[#0b0c0e]">
      <section className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#181B21]">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">Paiement interrompu</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-gray-950 dark:text-white">Votre abonnement n’a pas été activé.</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-zinc-400">
          Le paiement a été annulé ou n’a pas abouti. Aucun accès payant ne sera accordé sans confirmation reçue par Qualio.
        </p>
        {reference && <p className="mt-3 text-xs text-gray-400 dark:text-zinc-500">Référence : {reference}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/pricing" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#c2410c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9a3412]">Réessayer le paiement</Link>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/[0.05]">Retour au dashboard</Link>
        </div>
      </section>
    </main>
  )
}
