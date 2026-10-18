import type { ActionItem } from '@/lib/feedback/types'

const CONFIDENCE = {
  high: { label: 'Confiance élevée', hint: 'Beaucoup d’avis concordants appuient cette recommandation.', dot: 'bg-emerald-600' },
  medium: { label: 'Confiance moyenne', hint: 'Plusieurs avis vont dans ce sens, vérifiez avant de décider.', dot: 'bg-amber-500' },
  low: { label: 'Confiance faible', hint: 'Peu d’avis appuient cette recommandation : à vérifier.', dot: 'bg-gray-400' },
} as const

/** Confiance de la recommandation : une puce et un libellé (jamais la couleur seule). */
export function ConfidenceChip({ confidence }: { confidence: ActionItem['confidence'] }) {
  if (!confidence || !(confidence in CONFIDENCE)) return null
  const item = CONFIDENCE[confidence]
  return (
    <span title={item.hint} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-zinc-300">
      <span className={`h-2 w-2 rounded-full ${item.dot}`} aria-hidden="true" />
      {item.label}
    </span>
  )
}
