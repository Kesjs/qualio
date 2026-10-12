'use client'

import Link from 'next/link'
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { usePeriod } from '@/lib/hooks/useDashboardPrefs'
import { useDashboardMutations, useInvalidateAll, useOverview } from '@/lib/hooks/useDashboard'
import { sourceLabels, timeAgo, type ActionItem, type OverviewReady } from '@/lib/feedback/types'
import { card, Delta, EmptyState, ErrorState, PageHeader, PeriodSelect, primaryButton, PriorityBadge, secondaryButton, SentimentBadge, Skeleton, Sparkline } from '@/components/dashboard/ui'

type Ready = OverviewReady
type OnboardingMethod = 'widget' | 'import'

const ONBOARDING_METHOD_KEY = 'qualio:last-onboarding-method'

export function HomePage() {
  const [days, setDays] = usePeriod()
  const [onboardingMethod, setOnboardingMethod] = useState<OnboardingMethod | null>(null)
  const { data, isLoading, isError, refetch } = useOverview()

  useEffect(() => {
    if (!data || data.state === 'no_project') {
      setOnboardingMethod(null)
      return
    }
    try {
      const saved = JSON.parse(window.localStorage.getItem(ONBOARDING_METHOD_KEY) ?? 'null') as { siteId?: string; method?: OnboardingMethod } | null
      setOnboardingMethod(saved?.siteId === data.project.id && (saved.method === 'widget' || saved.method === 'import') ? saved.method : null)
    } catch {
      setOnboardingMethod(null)
    }
  }, [data])

  if (isLoading) return <HomeSkeleton />
  if (isError || !data) return <ErrorState message="Impossible de charger la vue d’ensemble. Vérifiez votre connexion puis réessayez." onRetry={() => refetch()} />
  if (data.state === 'no_project') return <EmptyState title="Créez votre premier projet" body="Un projet regroupe les avis d’un produit ou d’un site. Ajoutez-en un pour commencer à recevoir et analyser vos retours." href="/onboarding" label="Créer mon espace" />

  return (
    <div className="space-y-8 pb-16">
      <Hero data={data} days={days} onDays={setDays} method={onboardingMethod} />
      {data.exampleCount > 0 && <ExampleBanner siteId={data.project.id} />}
      {data.state === 'empty' && <GettingStarted data={data} method={onboardingMethod} />}
      {data.state !== 'empty' && (
        <>
          <Kpis data={data} days={days} />
          <VolumeChart series={data.series} days={days} />
          <div className="grid gap-6 lg:grid-cols-2">
            <TopThemes data={data} />
            <PriorityActions data={data} />
          </div>
          <RecentFeedback data={data} />
        </>
      )}
    </div>
  )
}

function Hero({ data, days, onDays, method }: { data: Ready; days: 7 | 30 | 90; onDays: (days: 7 | 30 | 90) => void; method: OnboardingMethod | null }) {
  const { mutate: generate, isPending, error } = useDashboardMutations().generateSynthesis
  const { counts } = data
  const trending = data.topThemes.filter((theme) => theme.delta > 0).sort((a, b) => b.delta - a.delta)[0]
  const projectName = data.project.name || data.project.url || 'Mon projet'

  let title = ''
  let description = ''
  let action: React.ReactNode = null

  if (data.state === 'empty') {
    if (method === 'widget' && data.hasSource) {
      title = 'Votre widget est configuré'
      description = 'Qualio attend vos premiers avis pour commencer l’analyse et préparer votre synthèse.'
    } else if (method === 'import') {
      title = 'Votre import CSV est en attente'
      description = 'Importez votre historique d’avis pour préparer votre première synthèse.'
    } else {
      title = 'Recevez vos premiers avis'
      description = 'Choisissez une source : Qualio classe chaque avis dès son arrivée, puis vous propose une synthèse et des actions.'
    }
  } else if (data.state === 'warming') {
    title = `Encore ${counts.missingForSynthesis} avis avant votre première synthèse`
    description = 'La synthèse devient disponible dès que trois avis sont enregistrés.'
    action = <Link href="/dashboard/collection" className={primaryButton}>Ajouter des avis<ArrowRightIcon className="h-4 w-4" /></Link>
  } else if (data.state === 'ready_to_synthesize') {
    title = 'Vos avis sont prêts à être analysés'
    description = `${counts.total} avis enregistrés. La synthèse regroupe les thèmes et propose des actions à décider.`
    action = <button type="button" onClick={() => generate(data.project.id)} disabled={isPending} className={primaryButton}><SparklesIcon className="h-4 w-4" />{isPending ? 'Analyse en cours…' : 'Générer ma première synthèse'}</button>
  } else {
    title = counts.period === 0 ? `Aucun nouvel avis sur ${days} jours` : `${counts.period} ${counts.period > 1 ? 'nouveaux avis' : 'nouvel avis'} sur ${days} jours`
    const parts: string[] = []
    if (trending) parts.push(`Le thème « ${trending.name} » progresse (+${trending.delta}).`)
    if (counts.pendingActions > 0) parts.push(`${counts.pendingActions} ${counts.pendingActions > 1 ? 'actions attendent' : 'action attend'} votre décision.`)
    if (counts.unsynthesized >= 3) parts.push(`${counts.unsynthesized} avis sont arrivés depuis la dernière synthèse.`)
    description = parts.join(' ') || 'Rien d’urgent : les prochains avis seront classés automatiquement.'
    action = counts.pendingActions > 0
      ? <Link href="/dashboard/actions" className={primaryButton}>Traiter les actions<ArrowRightIcon className="h-4 w-4" /></Link>
      : counts.unsynthesized >= 3
        ? <button type="button" onClick={() => generate(data.project.id)} disabled={isPending} className={primaryButton}><SparklesIcon className="h-4 w-4" />{isPending ? 'Analyse en cours…' : 'Mettre à jour la synthèse'}</button>
        : <Link href="/dashboard/feedback" className={primaryButton}>Voir les avis<ArrowRightIcon className="h-4 w-4" /></Link>
  }

  return (
    <div className="space-y-4">
      <PageHeader eyebrow={projectName} title={title} description={description} actions={<>{data.state !== 'empty' && <PeriodSelect days={days} onChange={onDays} />}{action}</>} />
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">{(error as Error).message}</p>}
      {data.state === 'warming' && (
        <div className="h-1.5 max-w-sm overflow-hidden rounded-full bg-gray-100 dark:bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={3} aria-valuenow={counts.total}>
          <div className="h-full rounded-full bg-[#ee6018] transition-all" style={{ width: `${Math.min(100, (counts.total / 3) * 100)}%` }} />
        </div>
      )}
    </div>
  )
}

function GettingStarted({ data, method }: { data: Ready; method: OnboardingMethod | null }) {
  if (method === 'widget' && data.hasSource) {
    return (
      <section className={`${card} p-5`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c95720]">À suivre</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-950 dark:text-white">En attente de vos premiers avis</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-zinc-400">Votre widget est configuré. Dès qu’un avis arrive, Qualio pourra commencer son analyse.</p>
            <p className="mt-3 text-xs font-semibold text-gray-400 dark:text-zinc-500">0/3 avis reçus avant la première synthèse</p>
          </div>
          <Link href="/dashboard/collection" className={`${secondaryButton} shrink-0`}>Vérifier l’installation<ArrowRightIcon className="h-4 w-4" /></Link>
        </div>
      </section>
    )
  }

  if (method === 'import') {
    return (
      <section className={`${card} p-5`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c95720]">À suivre</p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-950 dark:text-white">Votre import CSV est en attente</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-zinc-400">Importez votre historique d’avis pour préparer votre première synthèse.</p>
          </div>
          <Link href="/dashboard/collection" className={`${primaryButton} shrink-0`}>Importer mon CSV<ArrowRightIcon className="h-4 w-4" /></Link>
        </div>
      </section>
    )
  }

  const options = [
    { title: 'Installer le widget', body: 'Recevoir les prochains avis automatiquement.' },
    { title: 'Importer un CSV', body: 'Retrouver votre historique d’avis.' },
    { title: 'Ajouter un avis', body: 'Commencer rapidement avec un retour reçu ailleurs.' },
  ]
  return (
    <section className={`${card} p-5`}>
      <h2 className="text-base font-semibold text-gray-950 dark:text-white">Ajoutez vos premiers avis</h2>
      <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-zinc-400">Choisissez une source pour commencer. Vous pourrez en ajouter d’autres ensuite.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {options.map((option) => <Link key={option.title} href="/dashboard/collection" className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-[#ee6018] dark:border-white/[0.1] dark:bg-[#181B21]"><strong className="block text-sm text-gray-900 dark:text-white">{option.title}</strong><span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-zinc-400">{option.body}</span></Link>)}
      </div>
    </section>
  )
}

function Kpis({ data, days }: { data: Ready; days: number }) {
  const { counts, topThemes } = data
  const periodDelta = counts.period - counts.previousPeriod
  const shareDelta = counts.positiveShare !== null && counts.previousPositiveShare !== null ? counts.positiveShare - counts.previousPositiveShare : null
  const top = topThemes[0]
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi label={`Avis · ${days} j`} value={String(counts.period)} foot={<Delta value={counts.previousPeriod || periodDelta ? periodDelta : null} />} hint="vs période précédente" />
      <Kpi label="Avis positifs" value={counts.positiveShare === null ? '—' : `${counts.positiveShare} %`} foot={<Delta value={shareDelta} suffix=" pt" />} hint="vs période précédente" />
      <Kpi label="Thème n°1" value={top ? top.name : '—'} small foot={top ? <span className="text-[11px] font-medium text-gray-500 dark:text-zinc-400">{top.current} {top.current > 1 ? 'avis' : 'avis'}</span> : null} hint={top ? '' : 'Pas encore de tendance'} />
      <Link href="/dashboard/actions" className="block"><Kpi label="Actions en attente" value={String(counts.pendingActions)} foot={null} hint={counts.pendingActions ? 'À décider' : 'Rien à décider'} emphasis={counts.pendingActions > 0} /></Link>
    </div>
  )
}

function Kpi({ label, value, foot, hint, small = false, emphasis = false }: { label: string; value: string; foot: React.ReactNode; hint: string; small?: boolean; emphasis?: boolean }) {
  return (
    <div className={`h-full rounded-xl border p-4 ${emphasis ? 'border-orange-200 bg-orange-50/60 dark:border-orange-500/20 dark:bg-orange-500/[0.08]' : 'border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]'}`}>
      <span className="block text-xs text-gray-500 dark:text-zinc-500">{label}</span>
      <strong className={`mt-2 block truncate font-semibold tracking-[-0.04em] text-gray-950 dark:text-white ${small ? 'text-xl leading-9' : 'text-3xl'}`}>{value}</strong>
      <span className="mt-1 flex items-center gap-1.5">{foot}{hint && <span className="text-[11px] text-gray-400 dark:text-zinc-500">{hint}</span>}</span>
    </div>
  )
}

export function VolumeChart({ series, days }: { series: Ready['series']; days: number }) {
  const max = Math.max(...series.map((point) => point.total), 1)
  const empty = series.every((point) => point.total === 0)
  return (
    <section className={`${card} p-5`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-950 dark:text-white">Volume d’avis</h2>
        <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#ee6018]" />Avis</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-rose-400" />dont négatifs</span>
        </div>
      </div>
      {empty ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-zinc-400">Aucun avis sur cette période.</p>
      ) : (
        <>
          <div className="mt-4 flex h-32 items-end gap-[3px]" role="img" aria-label={`Volume quotidien d’avis sur ${days} jours`}>
            {series.map((point) => (
              <div key={point.date} className="group relative flex h-full flex-1 flex-col justify-end" title={`${new Date(point.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : ${point.total} avis, ${point.negative} négatifs`}>
                <div className="relative w-full overflow-hidden rounded-t-[3px] bg-[#ee6018]/80 transition-colors group-hover:bg-[#ee6018]" style={{ height: `${Math.max((point.total / max) * 100, point.total ? 4 : 0)}%` }}>
                  {point.negative > 0 && <div className="absolute inset-x-0 bottom-0 bg-rose-400" style={{ height: `${(point.negative / point.total) * 100}%` }} />}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-gray-400 dark:text-zinc-500">
            <span>{new Date(series[0].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            <span>Aujourd’hui</span>
          </div>
        </>
      )}
    </section>
  )
}

function TopThemes({ data }: { data: Ready }) {
  return (
    <section className={card}>
      <SectionHead title="Thèmes principaux" href="/dashboard/themes" label="Tous les thèmes" />
      {data.topThemes.length === 0 ? (
        <p className="px-5 py-8 text-sm leading-6 text-gray-500 dark:text-zinc-400">Les thèmes apparaissent dès que Qualio a classé vos premiers avis.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {data.topThemes.map((theme) => (
            <li key={theme.name}>
              <Link href={`/dashboard/feedback?theme=${encodeURIComponent(theme.name)}`} className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-gray-50 dark:hover:bg-white/[0.025]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">{theme.name}</span>
                  {theme.sample && <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-zinc-400">« {theme.sample} »</span>}
                </span>
                <Sparkline values={theme.spark} />
                <span className="w-14 shrink-0 text-right">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">{theme.current}</span>
                  <Delta value={theme.delta} inverse={theme.negative > theme.positive} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function PriorityActions({ data }: { data: Ready }) {
  const { mutate, isPending, variables } = useDashboardMutations().setActionStatus
  return (
    <section className={card}>
      <SectionHead title="Actions à décider" href="/dashboard/actions" label="Toutes les actions" />
      {data.actions.length === 0 ? (
        <p className="px-5 py-8 text-sm leading-6 text-gray-500 dark:text-zinc-400">{data.synthesis ? 'Aucune action en attente. Bravo !' : 'Les actions recommandées apparaîtront après la première synthèse.'}</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {data.actions.map((action: ActionItem) => (
            <li key={action.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold leading-5 text-gray-900 dark:text-white">{action.title}</p>
                {action.priority && <PriorityBadge priority={action.priority} />}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{action.feedback_ids.length} {action.feedback_ids.length > 1 ? 'avis sources' : 'avis source'}{action.theme ? ` · ${action.theme}` : ''}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={isPending && variables?.id === action.id} onClick={() => mutate({ id: action.id, siteId: data.project.id, status: 'accepted' })} className={`${primaryButton} !px-3 !py-1.5`}>Accepter</button>
                <button type="button" disabled={isPending && variables?.id === action.id} onClick={() => mutate({ id: action.id, siteId: data.project.id, status: 'dismissed' })} className={`${secondaryButton} !px-3 !py-1.5`}>Rejeter</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function RecentFeedback({ data }: { data: Ready }) {
  return (
    <section className={card}>
      <SectionHead title="Derniers avis" href="/dashboard/feedback" label="Voir tout" />
      {data.recent.length === 0 ? (
        <p className="px-5 py-8 text-sm text-gray-500 dark:text-zinc-400">Aucun avis pour le moment.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {data.recent.map((item) => (
            <li key={item.id}>
              <Link href="/dashboard/feedback" className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-gray-50 dark:hover:bg-white/[0.025]">
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-sm leading-5 text-gray-900 dark:text-zinc-100">{item.content}</span>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-zinc-500">{sourceLabels[item.source] ?? item.source} · {timeAgo(item.created_at)}{item.theme ? ` · ${item.theme}` : ''}</span>
                </span>
                <SentimentBadge sentiment={item.sentiment} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function SectionHead({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-white/[0.06]">
      <h2 className="text-sm font-semibold text-gray-950 dark:text-white">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold text-[#c95720] hover:text-[#ee6018] dark:text-orange-300">{label}<ArrowRightIcon className="h-3.5 w-3.5" /></Link>
    </div>
  )
}

function HomeSkeleton() {
  return (
    <div className="space-y-8 pb-16" role="status" aria-label="Chargement de la vue d’ensemble">
      <div className="space-y-3"><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-80 max-w-full" /><Skeleton className="h-4 w-96 max-w-full" /></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-[104px]" />)}</div>
      <Skeleton className="h-48" />
      <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      <span className="sr-only">Chargement…</span>
    </div>
  )
}

function ExampleBanner({ siteId }: { siteId: string }) {
  const { invalidate } = useInvalidateAll()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function removeExamples() {
    if (!window.confirm('Supprimer tous les avis d’exemple de ce projet ? Cette action est irréversible.')) return
    setBusy(true); setMessage(null)
    const response = await fetch(`/api/feedback/examples?siteId=${encodeURIComponent(siteId)}`, { method: 'DELETE' })
    const result = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok) return setMessage(result.error ?? 'Impossible de supprimer les exemples.')
    await invalidate()
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
      <span><strong>Ce sont des avis d’exemple.</strong> Ils ne représentent pas vos clients.</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => void removeExamples()} disabled={busy} className="min-h-9 rounded-lg border border-amber-300 px-3 text-xs font-bold hover:bg-amber-100 disabled:opacity-50 dark:border-amber-500/30 dark:hover:bg-amber-500/10">{busy ? 'Suppression…' : 'Supprimer les exemples'}</button>
        {message && <span role="alert" className="text-xs text-red-700 dark:text-red-300">{message}</span>}
      </div>
    </div>
  )
}
