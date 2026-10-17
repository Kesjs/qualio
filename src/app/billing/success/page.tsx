import Link from 'next/link'

export default function BillingSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfbfb] px-5 dark:bg-[#0b0c0e]">
      <section className="max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#181B21]">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">
          Paiement validé
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-gray-950 dark:text-white">
          Félicitations, votre abonnement est actif.
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-zinc-400">
          Votre paiement a bien été confirmé. Votre nouveau plan et l’ensemble de ses fonctionnalités sont immédiatement disponibles sur votre espace.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-lg px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
          style={{ background: '#c2410c' }}
        >
          Accéder à mon espace
        </Link>
      </section>
    </main>
  )
}
