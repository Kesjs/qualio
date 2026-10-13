'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { usePeriod } from '@/lib/hooks/useDashboardPrefs'
import { useActions, useDashboardMutations, useOverview } from '@/lib/hooks/useDashboard'
import type { ActionItem } from '@/lib/feedback/types'
import { ErrorState, PageHeader, Skeleton } from '@/components/dashboard/ui'
import { useBillingStatus } from '@/components/dashboard/useBillingStatus'
import { btnPrimary, surface } from './bricks'
import { usePostponed } from './usePostponed'
import { WeeklyScreen } from './WeeklyScreen'
import { DetailsTab } from './DetailsTab'

type Tab = 'recommendations' | 'details'
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'recommendations', label: 'Recommandations' },
  { id: 'details', label: 'Détails' },
]

/** Écran « Cette semaine » (doc 3.3) : une décision par écran. */
export function WeeklyPage() {
  const queryClient = useQueryClient()
  const [days, setDays] = usePeriod()
  const [tab, setTab] = useState<Tab>('recommendations')
  const { data, isLoading, isError, refetch } = useOverview()
  const actionsQuery = useActions()
  const { generateSynthesis, setActionStatus } = useDashboardMutations()
  const siteId = data && data.state !== 'no_project' ? data.project.id : undefined
  const { data: billing } = useBillingStatus(siteId)
  const { postponedIds, postpone } = usePostponed(siteId)

  const header = <PageHeader title="Cette semaine" description="Les recommandations tirées de vos avis" />

  if (isLoading) return <div className="space-y-6 pb-16">{header}<Skeleton className="h-72" /><Skeleton className="h-32" /></div>
  if (isError || !data) return <div className="space-y-6 pb-16">{header}<ErrorState message="Impossible de charger vos recommandations. Vérifiez votre connexion puis réessayez." onRetry={() => refetch()} /></div>
  if (data.state === 'no_project') {
    return (
      <div className="space-y-6 pb-16">
        {header}
        <section className={`${surface} p-6 sm:p-8`}>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-gray-950 dark:text-white">Créez votre premier projet</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:text-zinc-400">Un projet regroupe les avis d’un produit ou d’un site.</p>
          <Link href="/onboarding" className={`${btnPrimary} mt-6`}>Créer un projet</Link>
        </section>
      </div>
    )
  }

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
