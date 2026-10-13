import Link from 'next/link'
import { Banner, btnPrimary, surface } from './bricks'
import { PRIORITY } from './priority'

/** État A : exemple fixe, étiqueté « Exemple », sans bouton de décision. Disparaît dès le premier vrai avis. */
const DEMO = {
  title: 'Rendre la facturation visible dans le menu',
  count: 14,
  total: 40,
  quotes: [
    ['« Je n’arrive jamais à retrouver ma facture »', '12/10'],
    ['« Où sont les factures ? »', '09/10'],
    ['« Facturation introuvable »', '03/10'],
  ],
  others: [['Réduire le délai de livraison annoncé', 9], ['Ajouter le paiement mobile', 7], ['Clarifier la politique de retour', 5]],
} as const

export function DemoRecommendations() {
  return (
    <div className="space-y-5">
      <Banner action={<Link href="/dashboard/collection" className={btnPrimary}>Ajouter mes avis</Link>}>
        Voici un exemple, avec des avis fictifs. Ajoutez vos avis pour obtenir vos propres recommandations.
      </Banner>
      <article className={`${surface} p-6 sm:p-8`} aria-label="Exemple de recommandation">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-600 dark:text-zinc-400">Recommandation n°1 <span className="ml-2 rounded-md bg-gray-100 px-2 py-1 normal-case tracking-normal text-gray-700 dark:bg-white/[0.06] dark:text-zinc-300">Exemple</span></p>
          <span className={`rounded-md px-2 py-1 text-xs font-semibold ${PRIORITY.high.chip}`}>{PRIORITY.high.label}</span>
        </div>
        <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.03em] text-gray-950 dark:text-white sm:text-[32px]">{DEMO.title}</h2>
        <p className="mt-3 text-base leading-7 text-gray-900 dark:text-zinc-100"><span className="font-semibold">{DEMO.count} avis sur {DEMO.total}</span> portent sur ce sujet.</p>
        <ul className="mt-5 space-y-2">
          {DEMO.quotes.map(([text, date]) => (
            <li key={text} className="rounded-lg bg-gray-50 px-3.5 py-3 dark:bg-white/[0.04]">
              <p className="text-sm leading-6 text-gray-900 dark:text-zinc-100">{text}</p>
              <p className="mt-1 text-xs text-gray-600 dark:text-zinc-400">{date} · Exemple</p>
            </li>
          ))}
        </ul>
      </article>
      <section className={`${surface} overflow-hidden`} aria-label="Autres recommandations d’exemple">
        <p className="border-b border-gray-200/80 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-gray-600 dark:border-white/[0.08] dark:text-zinc-400">Autres recommandations</p>
        <ul>
          {DEMO.others.map(([title, count], index) => (
            <li key={title} className="flex items-center justify-between gap-3 border-b border-gray-200/80 px-5 py-3.5 text-sm last:border-b-0 dark:border-white/[0.08]">
              <span className="text-gray-950 dark:text-white"><span className="text-gray-600 dark:text-zinc-400">{index + 2}.</span> {title}</span>
              <span className="shrink-0 text-xs text-gray-600 dark:text-zinc-400">{count} avis</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
