'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowPathIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { useActions, useDashboardMutations, useOverview } from '@/lib/hooks/useDashboard'
import { formatDate, type OverviewReady } from '@/lib/feedback/types'
import { ErrorState, Skeleton } from '@/components/dashboard/ui'
import { LaunchBanner, LaunchButton, LaunchCard, LaunchEmpty, LaunchTabs, UsageBar } from '@/components/dashboard/ui/launch'
import { RecommendationCard } from '@/components/dashboard/RecommendationCard'
import { DEMO_RECOMMENDATION } from '@/lib/demo/weekly-recommendations'

type Tab = 'recommendations' | 'details'

export function WeeklyPage() {
  const { data, isLoading, isError, refetch } = useOverview()
  if (isLoading) return <div role="status" aria-label="Chargement de Cette semaine" className="space-y-5"><Skeleton className="h-20" /><Skeleton className="h-12" /><Skeleton className="h-96" /></div>
  if (isError || !data) return <ErrorState message="Impossible de charger vos recommandations. Réessayez pour retrouver vos avis et votre usage." onRetry={() => refetch()} />
  if (data.state === 'no_project') return <LaunchEmpty title="Créez votre premier projet" body="Un projet regroupe les avis de votre produit ou de votre site." href="/onboarding" label="Créer mon projet" />
  return <WeeklyScreen key={data.project.id} data={data} />
}

function WeeklyScreen({ data }: { data: OverviewReady }) {
  const params = useSearchParams()
  const [tab, setTab] = useState<Tab>(params.get('tab') === 'details' ? 'details' : 'recommendations')
  const [notice, setNotice] = useState('')
  const { generateSynthesis, setActionStatus } = useDashboardMutations()
  useEffect(() => { setTab(params.get('tab') === 'details' ? 'details' : 'recommendations') }, [params])
  const generate = () => { setNotice(''); generateSynthesis.mutate(data.project.id) }
  const quota = Boolean(data.usage.nextSynthesisAt && Date.parse(data.usage.nextSynthesisAt) > Date.now())
  const busy = generateSynthesis.isPending || setActionStatus.isPending
  const decide = (id: string, decision: 'accept' | 'later' | 'dismiss') => {
    setNotice('')
    setActionStatus.mutate({ id, siteId: data.project.id, status: decision === 'accept' ? 'accepted' : decision === 'dismiss' ? 'dismissed' : 'open', ...(decision === 'later' ? { postpone: true as const } : {}) }, { onSuccess: () => setNotice(decision === 'accept' ? 'Recommandation acceptée.' : decision === 'later' ? 'Recommandation reportée dans les suivantes.' : 'Recommandation écartée.') })
  }

  return <div className="space-y-6 pb-6 text-ink-primary">
    <header><h1 className="text-3xl font-semibold tracking-tight">Cette semaine</h1><p className="mt-2 text-sm text-ink-secondary">Les recommandations tirées de vos avis</p></header>
    <LaunchTabs value={tab} onChange={setTab} items={[{ value: 'recommendations', label: 'Recommandations' }, { value: 'details', label: 'Détails' }]} />
    {notice && <p role="status" className="text-sm text-ink-secondary">{notice}</p>}
    {setActionStatus.error && <ErrorState message="La décision n’a pas été enregistrée. Réessayez : votre recommandation est conservée." onRetry={() => { if (setActionStatus.variables) setActionStatus.mutate(setActionStatus.variables) }} />}
    {tab === 'recommendations' ? <>
      <WeeklyState data={data} generating={generateSynthesis.isPending} error={generateSynthesis.error} quota={quota} onGenerate={generate} />
      {data.state === 'ready' && !generateSynthesis.isPending && <>
        {data.counts.unsynthesized > 0 && <LaunchBanner><span>{data.counts.unsynthesized} nouveaux avis depuis la dernière synthèse.</span><LaunchButton variant="secondary" disabled={quota || busy} onClick={generate}>Actualiser</LaunchButton></LaunchBanner>}
        {data.actions[0] ? <RecommendationCard recommendation={data.actions[0]} total={data.counts.total} disabled={busy} onDecision={(decision) => decide(data.actions[0].id, decision)} /> : <LaunchEmpty title="Toutes les recommandations ont été traitées" body="Vos décisions sont enregistrées. Ajoutez des avis pour préparer la prochaine synthèse." href="/dashboard/collection" label="Ajouter des avis" />}
        {data.actions.length > 1 && <LaunchCard><h2 className="px-5 pt-5 text-sm font-semibold">Autres recommandations</h2><div className="mt-3 divide-y divide-border">{data.actions.slice(1).map((action, index) => <details key={action.id}><summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 px-5 py-3 text-sm"><span className="min-w-0"><span className="mr-3 font-mono text-ink-muted">{index + 2}.</span>{action.title}</span><span className="shrink-0 font-mono text-xs text-ink-secondary">{action.feedback_ids.length} avis{action.decided_at ? ' · Plus tard' : ''}</span></summary><div className="px-5 pb-5"><RecommendationCard recommendation={action} total={data.counts.total} compact /><div className="mt-4 flex flex-wrap gap-2"><LaunchButton variant="secondary" disabled={busy} onClick={() => decide(action.id, 'accept')}>Accepter</LaunchButton><LaunchButton variant="secondary" disabled={busy} onClick={() => decide(action.id, 'later')}>Plus tard</LaunchButton><LaunchButton variant="secondary" disabled={busy} onClick={() => decide(action.id, 'dismiss')}>Écarter</LaunchButton></div></div></details>)}</div></LaunchCard>}
      </>}
      {data.synthesis && <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-ink-secondary"><span>Synthèse du <time dateTime={data.synthesis.created_at}>{formatDate(data.synthesis.created_at)}</time></span><LaunchButton variant="secondary" disabled={quota || busy || data.counts.total < 3} onClick={generate}>Actualiser</LaunchButton></footer>}
    </> : <WeeklyDetails data={data} />}
  </div>
}

function WeeklyState({ data, generating, error, quota, onGenerate }: { data: OverviewReady; generating: boolean; error: Error | null; quota: boolean; onGenerate: () => void }) {
  if (generating) return <LaunchCard className="p-8"><div role="status" className="flex items-center gap-3"><ArrowPathIcon className="h-5 w-5 animate-spin motion-reduce:animate-none" /><p>Lecture de vos avis…</p></div><p className="mt-3 text-sm text-ink-secondary">Vos recommandations seront disponibles à la fin de la synthèse.</p></LaunchCard>
  if (error) return <LaunchBanner tone="danger"><div><p>La synthèse n’a pas abouti. Votre quota n’a pas été consommé.</p><p className="mt-1 text-xs">{error.message}</p></div><LaunchButton variant="secondary" onClick={onGenerate}>Réessayer</LaunchButton></LaunchBanner>
  if (data.state === 'empty') return <div className="space-y-5"><LaunchBanner><span><strong>Exemple fictif.</strong> Voici comment une recommandation s’appuie sur des avis. Ces données ne représentent pas vos clients.</span><Link href="/dashboard/collection" className="launch-primary">Ajouter mes avis</Link></LaunchBanner><RecommendationCard recommendation={DEMO_RECOMMENDATION} total={3} example /><p className="text-sm text-ink-secondary">Ajoutez au moins 3 avis pour obtenir votre première recommandation.</p></div>
  if (data.state === 'warming') return <LaunchCard className="p-6"><h2 className="text-lg font-semibold">Encore {data.counts.missingForSynthesis} avis pour votre première recommandation</h2><p className="mt-2 text-sm text-ink-secondary">Ajoutez au moins 3 avis pour obtenir votre première recommandation.</p><UsageBar value={data.counts.total} limit={3} label="Avis avant la première synthèse" /><Link href="/dashboard/collection" className="launch-primary mt-5">Ajouter des avis</Link></LaunchCard>
  if (quota) return <LaunchBanner tone="warning"><div><p>Prochaine synthèse possible le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(data.usage.nextSynthesisAt!))}.</p><p className="mt-1 text-xs">{data.usage.monthlySyntheses} / {data.usage.monthlySynthesisLimit} synthèses ce mois-ci. Les avis et recommandations restent consultables.</p></div>{data.usage.plan === 'free' && <Link href="/pricing" className="launch-secondary">Voir Pro</Link>}</LaunchBanner>
  if (data.state === 'ready_to_synthesize') return <LaunchCard className="p-6"><h2 className="text-lg font-semibold">Vous avez {data.counts.total} avis.</h2><p className="mt-2 text-sm text-ink-secondary">Lancez votre première synthèse pour obtenir des recommandations sourcées.</p><LaunchButton className="mt-5" onClick={onGenerate}>Générer mes recommandations</LaunchButton></LaunchCard>
  return null
}

function WeeklyDetails({ data }: { data: OverviewReady }) {
  const highest = data.weekly.themes[0]
  return <div className="space-y-6"><dl className="grid grid-cols-2 gap-5 border-y border-border py-5 lg:grid-cols-4">{[['Avis au total', data.usage.feedback], ['Avis cette semaine', data.weekly.total], ['Thème n°1', highest?.name ?? '—'], ['Recommandations en attente', data.counts.pendingActions]].map(([label, value]) => <div key={label}><dt className="text-xs text-ink-secondary">{label}</dt><dd className="mt-2 break-words text-xl font-semibold">{value}</dd></div>)}</dl>
    <LaunchCard className="p-5"><h2 className="text-base font-semibold">Volume des avis</h2><p className="mt-1 text-sm text-ink-secondary">Les huit dernières semaines</p><div className="mt-6 grid h-40 grid-cols-8 gap-2">{data.weekly.series.map((point) => <div key={point.date} className="flex min-w-0 flex-col items-center justify-end text-center"><span className="font-mono text-xs text-ink-secondary">{point.total}</span><div className="mt-2 w-full flex-1 flex items-end"><div className="min-h-px w-full rounded-t bg-ink-muted/40" style={{ height: `${point.total / Math.max(...data.weekly.series.map((row) => row.total), 1) * 100}%` }} /></div><span className="mt-2 font-mono text-[9px] text-ink-secondary">{formatDate(point.date)}</span></div>)}</div></LaunchCard>
    <LaunchCard><h2 className="px-5 pt-5 text-base font-semibold">Sujets dans vos avis</h2>{data.weekly.themes.length ? <ul className="mt-3 divide-y divide-border">{data.weekly.themes.map((theme) => <li key={theme.name}><Link className="flex min-h-14 items-center justify-between gap-3 px-5 py-3 hover:bg-elevated" href={`/dashboard/feedback?theme=${encodeURIComponent(theme.name)}`}><span>{theme.name}</span><span className="font-mono text-xs text-ink-secondary">{theme.current} avis · {theme.delta > 0 ? '+' : ''}{theme.delta} sur 7 jours</span></Link></li>)}</ul> : <p className="p-5 text-sm text-ink-secondary">Les sujets apparaîtront après le classement de vos avis.</p>}</LaunchCard>
    {data.usage.plan === 'free' ? <LaunchCard className="p-5"><h2 className="flex items-center gap-2 text-base font-semibold"><LockClosedIcon className="h-4 w-4" />Historique des décisions</h2><p className="mt-2 text-sm text-ink-secondary">Disponible avec Pro.</p><Link href="/pricing" className="launch-secondary mt-4">Voir Pro</Link></LaunchCard> : <DecisionHistory />}
  </div>
}

function DecisionHistory() {
  const { data = [], isLoading, isError, refetch } = useActions()
  if (isLoading) return <Skeleton className="h-32" />
  if (isError) return <ErrorState message="Impossible de charger l’historique des décisions." onRetry={() => refetch()} />
  const history = data.filter((item) => item.status !== 'open')
  return <LaunchCard><h2 className="px-5 pt-5 text-base font-semibold">Historique des décisions</h2>{history.length ? <ul className="mt-3 divide-y divide-border">{history.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"><span className="text-sm">{item.title}</span><span className="text-xs text-ink-secondary">{item.status === 'dismissed' ? 'Écartée' : item.status === 'done' ? 'Faite' : 'Acceptée'}{item.decided_at ? ` · ${formatDate(item.decided_at)}` : ''}</span></li>)}</ul> : <p className="p-5 text-sm text-ink-secondary">Vos recommandations acceptées ou écartées apparaîtront ici.</p>}</LaunchCard>
}
