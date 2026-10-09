'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRightIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useSites } from '@/lib/hooks/useSites'

type FeedbackItem = {
  id: string
  site_id: string
  source: string
  content: string
  author_name: string | null
  theme: string | null
  sentiment: string | null
  confidence: number | null
  status: 'open' | 'reviewed' | 'archived'
  created_at: string
}

async function fetchFeedback(siteId?: string) {
  const query = siteId ? `?siteId=${encodeURIComponent(siteId)}` : ''
  const response = await fetch(`/api/feedback${query}`)
  if (!response.ok) throw new Error('Impossible de charger les retours')
  return response.json() as Promise<FeedbackItem[]>
}

export function FeedbackDashboardOverview() {
  const { data: sites, isLoading: sitesLoading } = useSites()
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null)
  const activeSite = sites?.[0]
  const { data: feedback = [], isLoading, isError } = useQuery({
    queryKey: ['feedback', activeSite?.id],
    queryFn: () => fetchFeedback(activeSite?.id),
    enabled: Boolean(activeSite?.id),
  })
  const selected = feedback.find((item) => item.id === selectedFeedbackId) ?? feedback[0]
  const openCount = feedback.filter((item) => item.status === 'open').length
  const themesCount = new Set(feedback.map((item) => item.theme).filter(Boolean)).size
  const sourceCount = new Set(feedback.map((item) => item.source)).size
  const statusText = sitesLoading ? 'Chargement du projet…' : activeSite ? activeSite.name || activeSite.url : 'Aucun projet'
  const sourceLabel = useMemo(() => ({ manual: 'Ajout manuel', widget: 'Widget', public_link: 'Source externe', csv: 'CSV' } as Record<string, string>), [])

  return (
    <div className="feedback-dashboard space-y-6 pb-16">
      <div className="flex flex-col gap-4 border-b border-gray-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-white/[0.08]">
        <div>
          <div className="mb-2 flex items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Données connectées</span><span className="text-[11px] text-gray-400 dark:text-zinc-500">{statusText}</span></div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-gray-950 dark:text-white">Voici ce que vos utilisateurs essaient de dire.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-zinc-400">Les retours réellement enregistrés dans votre projet, leur état de traitement et les thèmes à examiner.</p>
        </div>
        <Link href="/dashboard/collection" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#ee6018] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#ee6018]/20 transition hover:bg-[#d95514]"><PlusIcon className="h-4 w-4" />Ajouter un retour</Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Retours reçus" value={String(feedback.length)} note="Depuis la collecte" /><Metric label="À examiner" value={String(openCount)} note="Statut ouvert" /><Metric label="Thèmes actifs" value={String(themesCount)} note="Sur les retours classés" /><Metric label="Sources" value={String(sourceCount)} note="Connectées au projet" /></div>

      {!activeSite && !sitesLoading && <EmptyState title="Ajoutez un projet pour commencer" body="Le dashboard s’alimente à partir d’un projet Qualio. Créez-en un, puis utilisez la collecte pour enregistrer vos premiers retours." href="/onboarding" label="Créer mon espace" />}
      {activeSite && isError && <EmptyState title="Impossible de charger les retours" body="La session ou la table de collecte n’est pas disponible. Vérifiez la migration feedback_workspace et reconnectez-vous." href="/dashboard/collection" label="Ouvrir la collecte" />}
      {activeSite && !isError && <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
        <section className="overflow-hidden rounded-xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]"><div className="flex items-center justify-between border-b border-gray-200/80 px-5 py-4 dark:border-white/[0.08]"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ee6018]">Retours récents</p><h2 className="mt-1 text-base font-semibold text-gray-950 dark:text-white">Les signaux qui méritent votre attention</h2></div><Link href="/dashboard/feedback" className="inline-flex items-center gap-1 text-xs font-bold text-[#c95720] hover:text-[#ee6018]">Voir tout<ArrowUpRightIcon className="h-3.5 w-3.5" /></Link></div>{isLoading ? <div className="px-5 py-10 text-sm text-gray-500">Chargement…</div> : feedback.length === 0 ? <div className="px-5 py-10"><p className="text-sm font-semibold text-gray-900 dark:text-white">Aucun retour enregistré.</p><p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Ajoutez un retour manuellement ou importez votre CSV depuis Collecte.</p></div> : <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">{feedback.slice(0, 8).map((item) => <button type="button" key={item.id} onClick={() => setSelectedFeedbackId(item.id)} className={`flex w-full items-start gap-3 px-5 py-4 text-left transition ${selected?.id === item.id ? 'bg-[#f7faf7] dark:bg-white/[0.04]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.025]'}`}><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.sentiment === 'negative' ? 'bg-red-500' : item.sentiment === 'positive' ? 'bg-emerald-500' : 'bg-[#ee6018]'}`} /><span className="min-w-0 flex-1"><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-zinc-500">{sourceLabel[item.source] ?? item.source} · {item.theme ?? 'Non classé'}</span><span className="mt-1 block text-sm font-semibold leading-5 text-gray-900 dark:text-zinc-100">{item.content}</span><span className="mt-1 block text-xs text-gray-500 dark:text-zinc-500">{item.author_name ?? 'Anonyme'} · {formatDate(item.created_at)}</span></span><ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-gray-300 dark:text-zinc-600" /></button>)}</div>}</section>
        <section className="rounded-xl border border-gray-200/80 bg-[#f4f8f4] p-5 dark:border-white/[0.08] dark:bg-[#151b17]"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Analyse sélectionnée</p><h2 className="mt-1 text-base font-semibold text-gray-950 dark:text-white">Ce que le signal indique</h2></div></div>{selected ? <><span className="mt-5 inline-flex rounded-md bg-orange-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">{sourceLabel[selected.source] ?? selected.source}</span><h3 className="mt-3 text-lg font-semibold leading-6 tracking-[-0.02em] text-gray-950 dark:text-white">{selected.content}</h3><div className="mt-5 space-y-0 divide-y divide-emerald-900/10 dark:divide-white/[0.08]"><Detail label="Thème" value={selected.theme ?? 'Non classé'} /><Detail label="Confiance" value={selected.confidence ? `${Math.round(selected.confidence * 100)} %` : 'Non calculée'} valueClass="text-emerald-700 dark:text-emerald-300" /><Detail label="Statut" value={selected.status === 'open' ? 'À examiner' : selected.status === 'reviewed' ? 'Examiné' : 'Archivé'} /></div></> : <p className="mt-5 text-sm leading-6 text-gray-500 dark:text-zinc-400">Sélectionnez un retour pour afficher son analyse.</p>}</section>
      </div>}

      <section className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181B21]"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ee6018]">Sources</p><h2 className="mt-1 text-base font-semibold text-gray-950 dark:text-white">Comment les avis arrivent</h2><div className="mt-4 grid gap-2 sm:grid-cols-3">{[['Widget', 'Nouveaux avis', 'Script à copier'], ['Import CSV', 'Historique', 'Importer un fichier'], ['IA', 'Synthèses', 'Après assez de matière']].map(([title, status, detail]) => <div key={title} className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.04]"><span className="block text-sm font-semibold text-gray-900 dark:text-zinc-100">{title}</span><span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-600 dark:text-emerald-300">{status}</span><span className="mt-1 block text-xs text-gray-500 dark:text-zinc-500">{detail}</span></div>)}</div><Link href="/dashboard/collection" className="mt-4 inline-flex text-xs font-bold text-[#c95720]">Gérer les sources →</Link></section>
    </div>
  )
}

function EmptyState({ title, body, href, label }: { title: string; body: string; href: string; label: string }) { return <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 dark:border-white/10 dark:bg-white/[0.03]"><h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 dark:text-zinc-400">{body}</p><Link href={href} className="mt-5 inline-flex rounded-lg bg-gray-950 px-4 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-gray-950">{label}</Link></div> }
function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <div className="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-white/[0.08] dark:bg-[#181B21]"><span className="block text-xs text-gray-500 dark:text-zinc-500">{label}</span><strong className="mt-3 block text-3xl font-semibold tracking-[-0.05em] text-gray-950 dark:text-white">{value}</strong><span className="mt-1 block text-[10px] font-medium text-emerald-600 dark:text-emerald-300">{note}</span></div> }
function Detail({ label, value, valueClass = 'text-gray-900 dark:text-zinc-100' }: { label: string; value: string; valueClass?: string }) { return <div className="flex items-center justify-between py-2.5 text-xs"><span className="text-gray-500 dark:text-zinc-500">{label}</span><strong className={valueClass}>{value}</strong></div> }
function formatDate(value: string) { return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) }
