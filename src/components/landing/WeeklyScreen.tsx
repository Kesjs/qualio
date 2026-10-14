import type { ReactNode } from 'react'
import { ACCENT_INK, ACCENT_SOFT, INK, LINE, MUTED, R_BUTTON, R_CARD, R_CHIP, SOFT } from './tokens'

/*
 * Reproduction statique de l'écran « Cette semaine » (doc 3.3) avec des avis d'exemple.
 * Trois repères numérotés : 1 la recommandation, 2 les avis qui la prouvent, 3 votre décision.
 * À remplacer par une vraie capture d'écran une fois l'écran construit dans le dashboard.
 */

export const WEEKLY_LEGEND = [
  { n: 1, title: 'La recommandation', body: 'Un conseil clair, avec le nombre d’avis qui le justifient.' },
  { n: 2, title: 'Les avis qui la prouvent', body: 'Les avis cités, avec leur date. Vous pouvez tous les relire.' },
  { n: 3, title: 'Votre décision', body: 'Vous acceptez, reportez ou écartez. Rien n’est appliqué sans vous.' },
] as const

function Marker({ n }: { n: number }) {
  return (
    <span
      className="absolute -left-2 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold text-white shadow-sm sm:-left-3"
      style={{ background: INK }}
      aria-hidden="true"
    >
      {n}
    </span>
  )
}

function Mark({ n, children, className = '' }: { n: number; children: ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Marker n={n} />
      {children}
    </div>
  )
}

export function WeeklyScreen({ full = true }: { full?: boolean }) {
  return (
    <figure className={`border bg-white ${R_CARD}`} style={{ borderColor: LINE }}>
      <figcaption className="sr-only">
        Exemple de l’écran « Cette semaine » avec des avis d’exemple : une recommandation, les avis qui la justifient et les boutons pour décider.
      </figcaption>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6" style={{ borderColor: LINE }}>
        <div>
          <p className="text-[15px] font-semibold tracking-tight" style={{ color: INK }}>Cette semaine</p>
          <p className="text-xs" style={{ color: MUTED }}>Les recommandations tirées de vos avis</p>
        </div>
        <span className={`px-2 py-1 text-[11px] font-semibold ${R_CHIP}`} style={{ background: SOFT, color: MUTED }}>Exemple</span>
      </div>

      <div className="space-y-4 p-4 sm:p-6" style={{ background: '#fafafa' }}>
        <div className="flex gap-1 text-xs font-medium" role="presentation">
          <span className={`px-3 py-1.5 ${R_BUTTON}`} style={{ background: '#fff', border: `1px solid ${LINE}`, color: INK }}>Recommandations</span>
          <span className={`px-3 py-1.5 ${R_BUTTON}`} style={{ color: MUTED }}>Détails</span>
        </div>

        <div className={`border bg-white p-5 sm:p-7 ${R_CARD}`} style={{ borderColor: LINE }}>
          <Mark n={1} className="pl-8">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Recommandation n°1</span>
              <span className={`px-2 py-0.5 text-[11px] font-semibold ${R_CHIP}`} style={{ background: ACCENT_SOFT, color: ACCENT_INK }}>Priorité haute</span>
            </div>
            <h3 className="mt-3 text-[22px] font-semibold leading-tight tracking-[-0.02em] sm:text-[28px]" style={{ color: INK }}>
              Rendre la facturation visible dans le menu
            </h3>
            <p className="mt-2 text-[15px]" style={{ color: MUTED }}>14 avis sur 40 mentionnent la difficulté à retrouver leurs factures.</p>
          </Mark>

          <Mark n={2} className="mt-6 border-t pt-5 pl-8" >
            <div className="rounded-lg border p-3 sm:p-4" style={{ borderColor: LINE, background: '#fafafa' }}>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Avis qui la prouvent</p>
              <ul className="divide-y text-[14px]" style={{ color: INK }}>
                <li className="py-2 first:pt-0">« Je n’arrive jamais à retrouver ma facture » <span style={{ color: MUTED }}>— 12/10</span></li>
                <li className="py-2">« Où sont les factures ? » <span style={{ color: MUTED }}>— 09/10</span></li>
                <li className="pb-0 pt-2">« Facturation introuvable » <span style={{ color: MUTED }}>— 03/10</span></li>
              </ul>
              <p className="mt-3 text-[13px] font-medium underline underline-offset-4" style={{ color: INK }}>Voir les 14 avis</p>
            </div>
          </Mark>

          <Mark n={3} className="mt-6 border-t pt-5 pl-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px]" style={{ color: MUTED }}>Quelle suite pour cette recommandation ?</p>
              <div className="flex flex-wrap gap-2">
              <span className={`px-5 py-2.5 text-[14px] font-semibold text-white ${R_BUTTON}`} style={{ background: ACCENT_INK }}>Accepter</span>
              <span className={`border px-5 py-2.5 text-[14px] font-semibold ${R_BUTTON}`} style={{ borderColor: LINE, color: INK }}>Plus tard</span>
              <span className={`px-5 py-2.5 text-[14px] font-medium ${R_BUTTON}`} style={{ color: MUTED }}>Écarter</span>
              </div>
            </div>
          </Mark>
        </div>

        {full && (
          <>
            <div className={`border bg-white ${R_CARD}`} style={{ borderColor: LINE }}>
              <p className="border-b px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ borderColor: LINE, color: MUTED }}>Autres recommandations</p>
              {[
                ['2. Réduire le délai de livraison annoncé', '9 avis'],
                ['3. Ajouter le paiement mobile', '7 avis'],
                ['4. Clarifier la politique de retour', '5 avis'],
              ].map(([t, n]) => (
                <div key={t} className="flex items-center justify-between gap-3 border-b px-5 py-3 text-[14px] last:border-b-0" style={{ borderColor: LINE, color: INK }}>
                  <span>{t}</span>
                  <span className="shrink-0 text-xs" style={{ color: MUTED }}>{n}</span>
                </div>
              ))}
            </div>
            <p className="text-xs" style={{ color: MUTED }}>Synthèse du 13/10 · Prochaine possible : 27/10 (Gratuit)</p>
          </>
        )}
      </div>
    </figure>
  )
}

export function WeeklyLegend() {
  return (
    <ol className="space-y-5">
      {WEEKLY_LEGEND.map((l) => (
        <li key={l.n} className="flex gap-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white" style={{ background: INK }}>{l.n}</span>
          <div>
            <h3 className="text-[17px] font-semibold tracking-tight">{l.title}</h3>
            <p className="mt-1 text-[15px] leading-relaxed" style={{ color: MUTED }}>{l.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
