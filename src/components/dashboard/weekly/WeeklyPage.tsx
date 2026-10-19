'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { usePeriod } from '@/lib/hooks/useDashboardPrefs'
import { useActions, useDashboardMutations, useOverview } from '@/lib/hooks/useDashboard'
import type { ActionItem } from '@/lib/feedback/types'
import { ErrorState, PageHeader, Skeleton } from '@/components/dashboard/ui'
import { useBillingStatus } from '@/components/dashboard/useBillingStatus'
import { usePostponed } from './usePostponed'
import { WeeklyScreen } from './WeeklyScreen'
import { DetailsTab } from './DetailsTab'
import { SynthesisRefresh } from './SynthesisRefresh'

type Tab = 'recommendations' | 'details'
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'recommendations', label: 'Recommandations' },
  { id: 'details', label: 'Détails' },
]

/** Écran « Cette semaine » (doc 3.3) : une décision par écran. */
export function WeeklyPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [days, setDays] = usePeriod()
  const [tab, setTab] = useState<Tab>('recommendations')
  const { data, isLoading, isError, refetch } = useOverview()
  const actionsQuery = useActions()
  const { generateSynthesis, setActionStatus } = useDashboardMutations()
  const siteId = data && data.state !== 'no_project' ? data.project.id : undefined
  const { data: billing } = useBillingStatus(siteId)
  const { postponedIds, postpone } = usePostponed(siteId)

  // Quelle que soit la façon de se connecter (mot de passe, code, Google, GitHub), un compte sans projet passe par l'onboarding.
  const noProject = data?.state === 'no_project'
  useEffect(() => { if (noProject) router.replace('/onboarding') }, [noProject, router])

  const header = (
    <PageHeader
      title="Cette semaine"
      description="Les recommandations tirées de vos avis"
      actions={data && data.state !== 'no_project' ? (
        <SynthesisRefresh generateError={generateSynthesis.error} billing={billing} generating={generateSynthesis.isPending}
          onGenerate={() => generateSynthesis.mutate(data.project.id, { onSettled: () => { void queryClient.invalidateQueries({ queryKey: ['billing-status-header'] }) } })} />
      ) : undefined}
    />
  )

  if (isLoading) return <div className="space-y-6 pb-16">{header}<Skeleton className="h-72" /><Skeleton className="h-32" /></div>
  // Pendant un rafraîchissement, conserver les données déjà affichées : une erreur
  // réseau transitoire ne doit pas remplacer l'accueil par un écran rouge.
  if (isError && !data) return <div className="space-y-6 pb-16">{header}<ErrorState message="Impossible de charger vos recommandations. Vérifiez votre connexion puis réessayez." onRetry={() => refetch()} /></div>
  if (!data) return <div className="space-y-6 pb-16">{header}<Skeleton className="h-72" /><Skeleton className="h-32" /></div>
  // Redirection vers l'onboarding en cours (cas rare : projet supprimé pendant la session) : aucun contenu intermédiaire.
  if (data.state === 'no_project') return <div className="space-y-6 pb-16">{header}<Skeleton className="h-72" /></div>

  const generate = () => {
    generateSynthesis.mutate(data.project.id, { onSettled: () => { void queryClient.invalidateQueries({ queryKey: ['billing-status-header'] }) } })
  }
  const changeStatus = (action: ActionItem, status: ActionItem['status']) =>
    setActionStatus.mutateAsync({ id: action.id, siteId: data.project.id, status })

  return (
    <div className="space-y-6 pb-16">
      {header}

      <div role="tablist" aria-label="Affichage de l’écran" className="flex gap-1 border-b border-gray-200 dark:border-white/[0.08]">
        {TABS.map((item) => (
          <button key={item.id} role="tab" id={`tab-${item.id}`} aria-selected={tab === item.id} aria-controls={`panel-${item.id}`} type="button" onClick={() => setTab(item.id)}
            className={`-mb-px min-h-11 border-b-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c2410c] ${tab === item.id ? 'border-gray-950 text-gray-950 dark:border-white dark:text-white' : 'border-transparent text-gray-600 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white'}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'recommendations' ? (
          <WeeklyScreen
            data={data}
            actions={actionsQuery.data ?? []}
            billing={billing}
            postponedIds={postponedIds}
            generating={generateSynthesis.isPending}
            generateError={generateSynthesis.error}
            onGenerate={generate}
            onStatus={changeStatus}
            onPostpone={postpone}
          />
        ) : (
          <DetailsTab data={data} actions={actionsQuery.data ?? []} billing={billing} days={days} onDays={setDays} />
        )}
      </div>
    </div>
  )
}
