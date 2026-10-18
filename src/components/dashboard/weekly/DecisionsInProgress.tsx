'use client'

import Link from 'next/link'
import { formatDate, type ActionItem } from '@/lib/feedback/types'
import type { PlanId } from '@/lib/billing/plans'
import { PRIORITY, priorityOf } from './priority'
import { surface } from './bricks'
import { ConfidenceChip } from './ConfidenceChip'
import { ShareMenu } from './ShareMenu'

/** Ligne d'effet d'une décision : promesse claire (14 jours) tant que la mesure n'est pas faite. */
export function EffectLine({ action, plan }: { action: ActionItem; plan: PlanId | undefined }) {
  const effect = action.effect
  if (plan === 'free' || effect?.locked) {
    return <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-400">L’effet sur vos avis est mesuré avec Pro. <Link href="/pricing" className="font-semibold text-gray-900 underline underline-offset-4 dark:text-white">Voir Pro</Link></p>
  }
  if (!effect) return <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-400">Effet mesuré dans 14 jours.</p>
  const concluded = effect.concluded && effect.changePercent != null
  return (
    <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-zinc-300">
      <span className="font-semibold">{concluded ? 'Effet mesuré' : 'Effet'} :</span> {effect.label.charAt(0).toUpperCase() + effect.label.slice(1)}
      {concluded && <> ({effect.changePercent! > 0 ? '+' : ''}{effect.changePercent} %)</>}
      {!concluded && <span className="text-gray-600 dark:text-zinc-400"> · une tendance sur 14 jours, pas une preuve.</span>}
    </p>
  )
}

/** Tâches en cours : les recommandations acceptées, avec leur effet et le menu « Partager la tâche ». */
export function DecisionsInProgress({ siteId, actions, plan }: { siteId: string; actions: ActionItem[]; plan: PlanId | undefined }) {
  const accepted = actions.filter((action) => action.status === 'accepted')
  if (accepted.length === 0) return null
  return (
    <section className={surface} aria-labelledby="tasks-in-progress">
      <h3 id="tasks-in-progress" className="border-b border-gray-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-gray-600 dark:border-white/[0.08] dark:text-zinc-400 sm:px-5">Vos tâches en cours</h3>
      <ul>
        {accepted.map((action) => (
          <li key={action.id} className="border-b border-gray-200/80 px-4 py-4 last:border-b-0 dark:border-white/[0.08] sm:px-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY[priorityOf(action.priority)].dot}`} aria-hidden="true" />
              <p className="min-w-0 flex-1 text-sm font-semibold text-gray-950 dark:text-white">{action.title}</p>
              <span className="text-xs text-gray-600 dark:text-zinc-400">{PRIORITY[priorityOf(action.priority)].label}</span>
              <ConfidenceChip confidence={action.confidence} />
            </div>
            {(action.rationale ?? action.description) && <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-400">{action.rationale ?? action.description}</p>}
            <EffectLine action={action} plan={plan} />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ShareMenu siteId={siteId} action={action} plan={plan} />
              <span className="text-xs text-gray-600 dark:text-zinc-400">{action.feedback_ids.length} {action.feedback_ids.length > 1 ? 'avis' : 'avis'} · acceptée le {formatDate(action.decided_at ?? action.created_at)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
