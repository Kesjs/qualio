'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { useActiveSite } from '@/lib/hooks/useActiveSite'
import { ApiError, useActions, useDashboardMutations, useSyntheses } from '@/lib/hooks/useDashboard'
import { formatDate, type ActionItem } from '@/lib/feedback/types'
import { ConfidenceChip } from '@/components/dashboard/weekly/ConfidenceChip'
import { EffectLine } from '@/components/dashboard/weekly/DecisionsInProgress'
import { ShareMenu } from '@/components/dashboard/weekly/ShareMenu'
import { useBillingStatus } from '@/components/dashboard/useBillingStatus'
import { card, EmptyState, ErrorState, PageHeader, primaryButton, PriorityBadge, secondaryButton, Skeleton } from '@/components/dashboard/ui'

type Tab = 'open' | 'accepted' | 'done' | 'dismissed' | 'history'
const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'open', label: 'À décider' },
  { id: 'accepted', label: 'En cours' },
  { id: 'done', label: 'Faites' },
  { id: 'dismissed', label: 'Rejetées' },
  { id: 'history', label: 'Synthèses' },
]

export function ActionsPage() {
  return <Suspense fallback={<Skeleton className="h-96" />}><ActionsInner /></Suspense>
}

function ActionsInner() {
  const params = useSearchParams()
  const { activeSite } = useActiveSite()
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'history' ? 'history' : 'open')
  const { data: actions = [], isLoading, isError, refetch } = useActions()
  const { generateSynthesis } = useDashboardMutations()
  const quotaReached = generateSynthesis.error instanceof ApiError && generateSynthesis.error.status === 429 && typeof generateSynthesis.error.body.monthlyLimit === 'number'

  const counts = (status: ActionItem['status']) => actions.filter((action) => action.status === status).length
  const visible = actions.filter((action) => action.status === tab)

  return (
    <div className="space-y-6 pb-16">
      <PageHeader eyebrow="Actions" title="Les décisions qui attendent votre équipe" description="Chaque action est une proposition sourcée par vos avis. Rien n’est appliqué sur votre produit sans vous."
        actions={<button type="button" disabled={!activeSite || generateSynthesis.isPending} onClick={() => activeSite && generateSynthesis.mutate(activeSite.id)} className={secondaryButton}><SparklesIcon className="h-4 w-4" />{generateSynthesis.isPending ? 'Analyse en cours…' : 'Nouvelle synthèse'}</button>} />
      {generateSynthesis.error && (
        <p role="alert" className={`rounded-lg border p-3 text-xs ${quotaReached ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100' : 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200'}`}>
          {generateSynthesis.error.message}{quotaReached && <> <Link href="/pricing" className="font-bold underline">Voir les plans</Link></>}
        </p>
      )}

      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-white/[0.08]">
        {tabs.map((item) => {
          const count = item.id === 'history' ? 0 : counts(item.id)
          return (
            <button key={item.id} role="tab" aria-selected={tab === item.id} type="button" onClick={() => setTab(item.id)}
              className={`-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition ${tab === item.id ? 'border-[#ee6018] text-gray-950 dark:text-white' : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'}`}>
              {item.label}{count > 0 && <span className="ml-2 rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600 dark:bg-white/10 dark:text-zinc-300">{count}</span>}
            </button>
          )
        })}
      </div>

      {tab === 'history' ? <History /> : isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-32" />)}</div>
      ) : isError ? (
        <ErrorState message="Impossible de charger les actions." onRetry={() => refetch()} />
      ) : visible.length === 0 ? (
        <EmptyState title={emptyTitle[tab]} body={emptyBody[tab]} href={tab === 'open' ? '/dashboard/feedback' : undefined} label={tab === 'open' ? 'Voir les avis' : undefined} />
      ) : (
        <div className="space-y-3">{visible.map((action) => <ActionCard key={action.id} action={action} siteId={activeSite?.id ?? ''} />)}</div>
      )}
    </div>
  )
}

const emptyTitle: Record<Exclude<Tab, 'history'>, string> = {
  open: 'Rien à décider pour l’instant',
  accepted: 'Aucune action en cours',
  done: 'Aucune action terminée',
  dismissed: 'Aucune action rejetée',
}
const emptyBody: Record<Exclude<Tab, 'history'>, string> = {
  open: 'Qualio propose de nouvelles actions à chaque synthèse. Lancez-en une quand de nouveaux avis sont arrivés.',
  accepted: 'Les actions que vous acceptez apparaissent ici jusqu’à ce que vous les marquiez comme faites.',
  done: 'Les actions terminées restent ici, avec leur effet sur vos avis.',
  dismissed: 'Une action rejetée reste ici, et Qualio ne la reproposera pas sans nouveau signal.',
}

function ActionCard({ action, siteId }: { action: ActionItem; siteId: string }) {
  const { mutate, isPending } = useDashboardMutations().setActionStatus
  const [copied, setCopied] = useState(false)
  const { data: billing } = useBillingStatus(siteId || undefined)
  const plan = billing?.plan
  const set = (status: ActionItem['status']) => mutate({ id: action.id, siteId, status })
  const detail = action.action ?? action.description

  async function copyMarkdown() {
    const markdown = `## ${action.title}\n\n${detail ?? ''}\n${action.rationale ? `\nPourquoi : ${action.rationale}\n` : ''}\n- Priorité : ${action.priority ?? 'moyenne'}\n- Avis sources : ${action.feedback_ids.length}${action.theme ? `\n- Thème : ${action.theme}` : ''}\n`
    try { await navigator.clipboard.writeText(markdown); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
  }

  return (
    <article className={`${card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-6 text-gray-950 dark:text-white">{action.title}</h3>
        <div className="flex flex-wrap items-center gap-3">{action.priority && <PriorityBadge priority={action.priority} />}<ConfidenceChip confidence={action.confidence} /></div>
      </div>
      {detail && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700 dark:text-zinc-300">{detail}</p>}
      {action.rationale && <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-zinc-400"><span className="font-semibold text-gray-700 dark:text-zinc-300">Pourquoi : </span>{action.rationale}</p>}
      {action.uncertainty && <p className="mt-2 text-xs leading-5 text-amber-800 dark:text-amber-300">À vérifier : {action.uncertainty}</p>}
      {(action.status === 'accepted' || action.status === 'done') && <EffectLine action={action} plan={plan} />}
      <p className="mt-3 text-xs text-gray-500 dark:text-zinc-400">
        {action.feedback_ids.length} {action.feedback_ids.length > 1 ? 'avis sources' : 'avis source'}
        {action.theme && <> · <Link href={`/dashboard/feedback?theme=${encodeURIComponent(action.theme)}`} className="font-semibold text-[#c95720] hover:underline dark:text-orange-300">{action.theme}</Link></>}
        {' · '}{formatDate(action.created_at)}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {action.status === 'open' && <>
          <button type="button" disabled={isPending} onClick={() => set('accepted')} className={primaryButton}>Accepter</button>
          <button type="button" disabled={isPending} onClick={() => set('dismissed')} className={secondaryButton}>Rejeter</button>
        </>}
        {action.status === 'accepted' && <>
          <button type="button" disabled={isPending} onClick={() => set('done')} className={primaryButton}>Marquer comme faite</button>
          <button type="button" onClick={copyMarkdown} className={secondaryButton}>{copied ? 'Copié ✓' : 'Copier en Markdown'}</button>
          <ShareMenu siteId={siteId} action={action} plan={plan} />
          <button type="button" disabled={isPending} onClick={() => set('open')} className={secondaryButton}>Remettre à décider</button>
        </>}
        {action.status === 'done' && <button type="button" disabled={isPending} onClick={() => set('accepted')} className={secondaryButton}>Rouvrir</button>}
        {action.status === 'dismissed' && <button type="button" disabled={isPending} onClick={() => set('open')} className={secondaryButton}>Remettre à décider</button>}
      </div>
    </article>
  )
}

function History() {
  const { data: syntheses = [], isLoading } = useSyntheses()
  if (isLoading) return <Skeleton className="h-40" />
  if (syntheses.length === 0) return <EmptyState title="Aucune synthèse pour l’instant" body="Ajoutez au moins trois avis puis lancez une synthèse : Qualio regroupe les thèmes et propose des actions." href="/dashboard/collection" label="Ajouter des avis" />
  return (
    <div className="space-y-3">
      {syntheses.map((synthesis) => (
        <article key={synthesis.id} className={`${card} p-5`}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-950 dark:text-white">{synthesis.title}</h3>
            <span className="shrink-0 text-xs text-gray-400">{formatDate(synthesis.created_at)}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-300">{synthesis.summary}</p>
          {synthesis.themes?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {synthesis.themes.map((theme) => <span key={theme.name} className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-white/[0.06] dark:text-zinc-300">{theme.name} · {theme.count}</span>)}
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
