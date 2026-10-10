'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useSites } from '@/lib/hooks/useSites'

type FeedbackItem = {
  id: string
  source: string
  content: string
  author_name: string | null
  theme: string | null
  sentiment: string | null
  status: 'open' | 'reviewed' | 'archived'
  created_at: string
}

const sourceLabels: Record<string, string> = {
  manual: 'Ajout manuel',
  widget: 'Widget',
  public_link: 'Source externe',
  csv: 'Import CSV',
}

async function fetchFeedback(siteId?: string) {
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : ''
  const response = await fetch(`/api/feedback${query}`)
  if (!response.ok) throw new Error('Impossible de charger les avis')
  return response.json() as Promise<FeedbackItem[]>
}

export function FeedbackDashboardOverview() {
  const { data: sites, isLoading: sitesLoading } = useSites()
  const activeSite = sites?.[0]
  const { data: feedback = [], isLoading, isError } = useQuery({
    queryKey: ['feedback', activeSite?.id],
    queryFn: () => fetchFeedback(activeSite?.id),
    enabled: Boolean(activeSite?.id),
  })

  const openFeedback = feedback.filter((item) => item.status === 'open')
  const themesCount = new Set(feedback.map((item) => item.theme).filter(Boolean)).size
  const sourceCount = new Set(feedback.map((item) => item.source)).size
  const projectLabel = sitesLoading ? 'Chargement du projet…' : activeSite ? activeSite.name || activeSite.url : 'Aucun projet'
  const visibleFeedback = openFeedback.length ? openFeedback : feedback.filter((item) => item.status !== 'archived')
  const headline = openFeedback.length === 1 ? '1 avis à examiner' : openFeedback.length > 1 ? `${openFeedback.length} avis à examiner` : feedback.length ? 'Tous vos avis sont traités' : 'Vos avis, au même endroit.'

  return (
    <div className="space-y-6 pb-16">
      <header className="flex flex-col gap-5 border-b border-gray-200/80 pb-6 dark:border-white/[0.08] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Collecte active</span><span className="text-[11px] text-gray-400 dark:text-zinc-500">{projectLabel}</span></div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-gray-950 dark:text-white">{headline}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-zinc-400">Les nouveaux avis arrivent ici. Ouvrez la boîte de réception pour les classer et les traiter.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2"><Link href="/dashboard/feedback" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ee6018] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#ee6018]/20 transition hover:bg-[#d95514]">{openFeedback.length ? 'Voir les avis à examiner' : 'Voir les avis'}<ArrowRightIcon className="h-4 w-4" /></Link><Link href="/dashboard/collection" className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:border-gray-400 dark:border-white/[0.1] dark:text-zinc-300 dark:hover:border-white/30">Gérer la collecte</Link></div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3"><Metric label="Avis reçus" value={String(feedback.length)} note="Depuis la collecte" /><Metric label="À examiner" value={String(openFeedback.length)} note={openFeedback.length ? 'Action recommandée' : 'Aucune action urgente'} emphasis={openFeedback.length > 0} /><Metric label="Thèmes identifiés" value={String(themesCount)} note={themesCount ? 'Sur les avis classés' : 'Pas encore de tendance'} /></div>

      {!activeSite && !sitesLoading && <EmptyState title="Ajoutez un projet pour commencer" body="Le dashboard s’alimente à partir d’un projet Qualio. Créez-en un, puis utilisez la collecte pour enregistrer vos premiers avis." href="/onboarding" label="Créer mon espace" />}
      {activeSite && isError && <EmptyState title="Impossible de charger les avis" body="Actualisez la page et réessayez. Si le problème continue, vérifiez la connexion de votre espace." href="/dashboard/collection" label="Vérifier la collecte" />}
      {activeSite && !isError && <section className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]">
        <div className="flex flex-col gap-2 border-b border-gray-200/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08]"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ee6018]">Prochaine action</p><h2 className="mt-1 text-base font-semibold text-gray-950 dark:text-white">À traiter maintenant</h2></div><Link href="/dashboard/feedback" className="inline-flex items-center gap-1 text-xs font-bold text-[#c95720] hover:text-[#ee6018]">Ouvrir tous les avis<ArrowRightIcon className="h-3.5 w-3.5" /></Link></div>
        {isLoading ? <div className="px-5 py-10 text-sm text-gray-500">Chargement des avis…</div> : visibleFeedback.length === 0 ? <div className="px-5 py-10"><div className="flex items-start gap-3"><CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><div><p className="text-sm font-semibold text-gray-900 dark:text-white">Aucun avis à traiter.</p><p className="mt-1 text-sm leading-6 text-gray-500 dark:text-zinc-400">Le widget est prêt. Les prochains avis apparaîtront automatiquement ici.</p></div></div></div> : <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">{visibleFeedback.slice(0, 8).map((item) => <Link href="/dashboard/feedback" key={item.id} className="flex items-start gap-3 px-5 py-4 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.025]"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.status === 'open' ? 'bg-[#ee6018]' : 'bg-emerald-500'}`} /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 dark:text-zinc-500"><span>{sourceLabels[item.source] ?? item.source}</span><span>·</span><span>{formatDate(item.created_at)}</span></span><span className="mt-1 block line-clamp-2 text-sm font-semibold leading-5 text-gray-900 dark:text-zinc-100">{item.content}</span><span className="mt-1 block text-xs text-gray-500 dark:text-zinc-500">{item.theme ?? 'À classer'} · {item.status === 'open' ? 'À examiner' : 'Examiné'}</span></span><ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-gray-300 dark:text-zinc-600" /></Link>)}</div>}
      </section>}

      {activeSite && <div className="flex flex-col gap-3 rounded-xl border border-gray-200/80 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08] dark:bg-white/[0.03]"><div><p className="text-sm font-semibold text-gray-900 dark:text-white">Collecte active</p><p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{sourceCount || 1} source connectée{(sourceCount || 1) > 1 ? 's' : ''}. Les avis du widget sont enregistrés dans cette boîte de réception.</p></div><Link href="/dashboard/collection" className="text-xs font-bold text-[#c95720] hover:text-[#ee6018]">Gérer les sources<ArrowRightIcon className="ml-1 inline h-3.5 w-3.5" /></Link></div>}
    </div>
  )
}

function EmptyState({ title, body, href, label }: { title: string; body: string; href: string; label: string }) { return <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 dark:border-white/10 dark:bg-white/[0.03]"><h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 dark:text-zinc-400">{body}</p><Link href={href} className="mt-5 inline-flex rounded-lg bg-gray-950 px-4 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-gray-950">{label}</Link></div> }
function Metric({ label, value, note, emphasis = false }: { label: string; value: string; note: string; emphasis?: boolean }) { return <div className={`rounded-xl border p-4 ${emphasis ? 'border-orange-200 bg-orange-50/60 dark:border-orange-500/20 dark:bg-orange-500/[0.08]' : 'border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]'}`}><span className="block text-xs text-gray-500 dark:text-zinc-500">{label}</span><strong className="mt-3 block text-3xl font-semibold tracking-[-0.05em] text-gray-950 dark:text-white">{value}</strong><span className={`mt-1 block text-[10px] font-medium ${emphasis ? 'text-[#c95720] dark:text-orange-300' : 'text-gray-500 dark:text-zinc-500'}`}>{note}</span></div> }
function formatDate(value: string) { return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) }
