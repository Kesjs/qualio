'use client'

import { BTN_PRIMARY, BTN_SECONDARY } from '@/components/admin/ui'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-red-400/30 bg-red-400/[0.06] p-8">
      <h1 className="text-2xl font-semibold">Cette page n’a pas pu se charger</h1>
      <p className="mt-3 text-sm leading-6 text-stone-300">Une erreur est survenue en lisant les données. Vos informations n’ont pas été modifiées. Réessayez, ou revenez à la vue d’ensemble.</p>
      {error.digest && <p className="mt-3 font-mono text-xs text-stone-400">Référence : {error.digest}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className={BTN_PRIMARY}>Réessayer</button>
        <a href="/admin" className={BTN_SECONDARY}>Vue d’ensemble</a>
      </div>
    </div>
  )
}
