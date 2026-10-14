'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import { ApiError } from '@/lib/hooks/useDashboard'
import type { ActionItem, OverviewReady } from '@/lib/feedback/types'
import type { BillingStatus } from '@/components/dashboard/useBillingStatus'
import { Banner, btnPrimary, btnSecondary, formatDayMonth, GeneratingPanel, surface } from './bricks'
import { orderRecommendations } from './priority'
import { CompactRecommendation, LargeRecommendation, type Decision } from './RecommendationCard'
import { DemoRecommendations } from './DemoRecommendations'

export interface WeeklyScreenProps {
  data: OverviewReady
  actions: ActionItem[]
  billing: BillingStatus | undefined
  postponedIds: string[]
  generating: boolean
  generateError: Error | null
  onGenerate: () => void
  onStatus: (action: ActionItem, status: ActionItem['status']) => Promise<unknown>
  onPostpone: (id: string) => void
}

/**
 * Un seul composant choisit quoi afficher (doc 3.9, règle 4) :
 * A compte neuf · B échauffement · C prêt à générer · D génération · E synthèse prête ·
 * F quota atteint · G erreur · H limite d'avis atteinte.
 */
export function WeeklyScreen(props: WeeklyScreenProps) {
  const { data, actions, billing, postponedIds, generating, generateError, onGenerate, onStatus, onPostpone } = props
  const { counts } = data
  const siteId = data.project.id
  const isFree = billing?.plan === 'free'

  // H : limite d'avis atteinte (le bandeau s'ajoute aux autres états, les anciens avis restent visibles)
  const site = billing?.site
  const limitReached = Boolean(site && site.feedbackLimit > 0 && site.feedback >= site.feedbackLimit)

  // F : quota de synthèse
  const quotaError = generateError instanceof ApiError && generateError.status === 429 && generateError.body.quota === 'synthesis'
  const nextAt = (quotaError && typeof generateError.body.nextAvailableAt === 'string' ? generateError.body.nextAvailableAt : null) ?? site?.nextSynthesisAt ?? null
  const quotaBlocked = quotaError || Boolean(nextAt && new Date(nextAt).getTime() > Date.now())
  const nextLabel = formatDayMonth(nextAt)

  // G : erreur autre que le quota
  const failed = Boolean(generateError) && !quotaError

  const quotaMessage = quotaBlocked && (
    <p className="text-sm text-gray-700 dark:text-zinc-300">
      {nextLabel ? `Prochaine synthèse possible le ${nextLabel}.` : 'Votre prochaine synthèse n’est pas encore disponible.'}
      {isFree && <> Avec Pro, elle est automatique chaque semaine. <Link href="/pricing" className="font-semibold text-gray-950 underline underline-offset-4 dark:text-white">Passer à Pro</Link></>}
    </p>
  )

  const errorBanner = failed && (
    <Banner tone="alert" action={<button type="button" onClick={onGenerate} disabled={generating} className={btnSecondary}>Réessayer</button>}>
      La synthèse n’a pas abouti. Votre quota n’a pas été consommé.
    </Banner>
  )

  const limitBanner = limitReached && site && (
    <Banner tone="warn" action={isFree ? <Link href="/pricing" className={btnPrimary}>Passer à Pro</Link> : undefined}>
      Vous avez atteint {site.feedbackLimit} avis.{isFree ? ' Passez à Pro pour en ajouter.' : ' Archivez des avis pour en ajouter.'} Vos anciens avis restent visibles.
    </Banner>
  )

  // A : compte neuf
  if (data.state === 'empty') return <DemoRecommendations />

  // B : échauffement (1 ou 2 avis)
  if (data.state === 'warming') {
    const missing = counts.missingForSynthesis
    return (
      <div className="space-y-5">
        {limitBanner}
        <section className={`${surface} p-6 sm:p-8`}>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-gray-950 dark:text-white">Encore {missing} avis pour votre première recommandation</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-400">Ajoutez au moins 3 avis pour obtenir votre première recommandation.</p>
          <div className="mt-5 h-2 max-w-sm overflow-hidden rounded-full bg-gray-100 dark:bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={3} aria-valuenow={Math.min(3, counts.total)} aria-label="Avis avant la première synthèse">
            <div className="h-full rounded-full bg-gray-900 transition-all motion-reduce:transition-none dark:bg-white" style={{ width: `${Math.min(100, (counts.total / 3) * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-600 dark:text-zinc-400">{counts.total} / 3 avis</p>
          <Link href="/dashboard/collection" className={`${btnPrimary} mt-6`}>Ajouter des avis</Link>
        </section>
      </div>
    )
  }

  // D : génération en cours (boutons désactivés)
  if (generating && data.state === 'ready_to_synthesize') return <GeneratingPanel />

  // C : prêt à générer
  if (data.state === 'ready_to_synthesize') {
    return (
      <div className="space-y-5">
        {limitBanner}
        {errorBanner}
        <section className={`${surface} p-6 sm:p-8`}>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-gray-950 dark:text-white">Vous avez {counts.total} avis. Lancez votre première synthèse.</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-400">Qualio lit vos avis, regroupe ce qui revient et cite les avis qui justifient chaque conseil.</p>
          <button type="button" onClick={onGenerate} disabled={quotaBlocked} className={`${btnPrimary} mt-6`}>Générer ma première synthèse</button>
          {quotaMessage && <div className="mt-3">{quotaMessage}</div>}
        </section>
      </div>
    )
  }

  // E : synthèse prête
  const ordered = orderRecommendations(actions, postponedIds)
  const [first, ...others] = ordered
  const busy = generating

  const decision: Decision = {
    onAccept: (action) => {
      void onStatus(action, 'accepted').then(() => toast.success('Recommandation acceptée', { action: { label: 'Annuler', onClick: () => { void onStatus(action, 'open') } } })).catch((error: Error) => toast.error(error.message))
    },
    onDismiss: (action) => {
      void onStatus(action, 'dismissed').then(() => toast('Recommandation écartée', { action: { label: 'Annuler', onClick: () => { void onStatus(action, 'open') } } })).catch((error: Error) => toast.error(error.message))
    },
    onLater: (action) => {
      onPostpone(action.id)
      toast('Reportée : elle passe dans les autres recommandations')
    },
  }

  const lastSynthesis = formatDayMonth(data.synthesis?.created_at ?? site?.lastSynthesisAt)
  const refreshDisabled = generating || quotaBlocked

  return (
    <div className="space-y-5">
      {limitBanner}
      {errorBanner}
      {generating && <GeneratingPanel />}
      {!generating && counts.unsynthesized > 0 && (
        <Banner action={<button type="button" onClick={onGenerate} disabled={refreshDisabled} className={btnSecondary}>Actualiser</button>}>
          {counts.unsynthesized} {counts.unsynthesized > 1 ? 'nouveaux avis' : 'nouvel avis'} depuis la dernière synthèse.
        </Banner>
      )}

      {first ? (
        <LargeRecommendation siteId={siteId} action={first} total={counts.total} decision={decision} busy={busy} />
      ) : (
        <section className={`${surface} p-6 sm:p-8`}>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-gray-950 dark:text-white">Rien à décider cette semaine</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-400">Les prochains avis seront classés automatiquement. Vos décisions passées sont dans l’onglet Détails.</p>
          <Link href="/dashboard/feedback" className={`${btnPrimary} mt-6`}>Voir les avis</Link>
        </section>
      )}

      {others.length > 0 && (
        <section className={`${surface} overflow-hidden`} aria-labelledby="other-recs">
          <h3 id="other-recs" className="border-b border-gray-200/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-gray-600 dark:border-white/[0.08] dark:text-zinc-400 sm:px-5">Autres recommandations</h3>
          <ul>
            {others.map((action, index) => (
              <CompactRecommendation key={action.id} siteId={siteId} action={action} rank={index + 2} total={counts.total} decision={decision} busy={busy} />
            ))}
          </ul>
        </section>
      )}

      {/* F : pied de page, date de la dernière synthèse et quota */}
      <footer className="flex flex-col gap-2 border-t border-gray-200/80 pt-4 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600 dark:text-zinc-400">{lastSynthesis ? `Synthèse du ${lastSynthesis}` : 'Aucune synthèse'}</p>
        <div className="flex flex-col gap-2 sm:items-end">
          <button type="button" onClick={onGenerate} disabled={refreshDisabled} className={btnSecondary}>Actualiser</button>
          {quotaMessage}
        </div>
      </footer>
    </div>
  )
}
