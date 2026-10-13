'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { formatDate, sourceLabels, type ActionItem } from '@/lib/feedback/types'
import { PRIORITY, priorityOf } from './priority'
import { btnPrimary, btnQuiet, btnSecondary, surface } from './bricks'
import { useCitedFeedback } from './useCitedFeedback'

export type Decision = { onAccept: (action: ActionItem) => void; onLater: (action: ActionItem) => void; onDismiss: (action: ActionItem) => void }

function PriorityChip({ priority }: { priority: ActionItem['priority'] }) {
  const style = PRIORITY[priorityOf(priority)]
  return <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-1 text-xs font-semibold ${style.chip}`}>{style.label}</span>
}

/** Avis cités (3 au maximum) avec leur date et leur source, et le lien vers la liste filtrée. */
export function CitedReviews({ siteId, action }: { siteId: string; action: ActionItem }) {
  const { data, isLoading, isError } = useCitedFeedback(siteId, action.feedback_ids)
  const href = action.theme ? `/dashboard/feedback?theme=${encodeURIComponent(action.theme)}` : '/dashboard/feedback'
  return (
    <div className="mt-5">
      {isLoading && <div aria-hidden="true" className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 motion-reduce:animate-none dark:bg-white/[0.06]" />)}</div>}
      {isError && <p className="text-sm text-gray-600 dark:text-zinc-400">Les avis cités ne se sont pas chargés. Ils restent consultables dans la liste des avis.</p>}
      {data && data.length > 0 && (
        <ul className="space-y-2">
          {data.map((item) => (
            <li key={item.id} className="rounded-lg bg-gray-50 px-3.5 py-3 dark:bg-white/[0.04]">
              <blockquote className="line-clamp-2 text-sm leading-6 text-gray-900 dark:text-zinc-100">« {item.content} »</blockquote>
              <p className="mt-1 text-xs text-gray-600 dark:text-zinc-400">{formatDate(item.created_at)} · {sourceLabels[item.source] ?? item.source}</p>
            </li>
          ))}
        </ul>
      )}
      <Link href={href} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-gray-900 underline underline-offset-4 dark:text-white">Voir les {action.feedback_ids.length}</Link>
    </div>
  )
}

function Decisions({ action, decision, busy, large }: { action: ActionItem; decision: Decision; busy: boolean; large: boolean }) {
  return (
    <div className={`mt-5 flex gap-2 ${large ? 'flex-col sm:flex-row sm:items-center' : 'flex-wrap'}`}>
      <button type="button" disabled={busy} onClick={() => decision.onAccept(action)} className={`${btnPrimary} ${large ? 'sm:min-w-44' : ''}`}>Accepter</button>
      <button type="button" disabled={busy} onClick={() => decision.onLater(action)} className={btnSecondary}>Plus tard</button>
      <button type="button" disabled={busy} onClick={() => decision.onDismiss(action)} className={btnQuiet}>Écarter</button>
    </div>
  )
}

function Evidence({ action, total }: { action: ActionItem; total: number }) {
  const count = action.feedback_ids.length
  const detail = action.rationale ?? action.description
  return (
    <>
      <p className="mt-3 text-base leading-7 text-gray-900 dark:text-zinc-100"><span className="font-semibold">{count} avis sur {total}</span> {count > 1 ? 'portent' : 'porte'} sur ce sujet.</p>
      {detail && <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-zinc-400">{detail}</p>}
      {action.uncertainty && <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-300">À vérifier : {action.uncertainty}</p>}
    </>
  )
}

/** Forme grande : la recommandation n°1 (doc 3.8). */
export function LargeRecommendation({ siteId, action, total, decision, busy }: { siteId: string; action: ActionItem; total: number; decision: Decision; busy: boolean }) {
  return (
    <article className={`${surface} p-6 sm:p-8`} aria-labelledby={`rec-${action.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-600 dark:text-zinc-400">Recommandation n°1</p>
        <PriorityChip priority={action.priority} />
      </div>
      <h2 id={`rec-${action.id}`} className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.03em] text-gray-950 dark:text-white sm:text-[32px]">{action.title}</h2>
      <Evidence action={action} total={total} />
      <CitedReviews siteId={siteId} action={action} />
      <Decisions action={action} decision={decision} busy={busy} large />
    </article>
  )
}

/** Forme compacte : une ligne ; un clic déplie la carte complète. */
export function CompactRecommendation({ siteId, action, rank, total, decision, busy }: { siteId: string; action: ActionItem; rank: number; total: number; decision: Decision; busy: boolean }) {
  const [open, setOpen] = useState(false)
  const count = action.feedback_ids.length
  return (
    <li className="border-b border-gray-200/80 last:border-b-0 dark:border-white/[0.08]">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c2410c] sm:px-5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY[priorityOf(action.priority)].dot}`} aria-hidden="true" />
        <span className="min-w-0 flex-1 text-sm font-medium text-gray-950 dark:text-white"><span className="text-gray-600 dark:text-zinc-400">{rank}.</span> {action.title}</span>
        <span className="shrink-0 text-xs text-gray-600 dark:text-zinc-400">{count} avis</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-gray-500 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="px-4 pb-5 sm:px-5">
          <PriorityChip priority={action.priority} />
          <Evidence action={action} total={total} />
          <CitedReviews siteId={siteId} action={action} />
          <Decisions action={action} decision={decision} busy={busy} large={false} />
        </div>
      )}
    </li>
  )
}
