'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useSites } from '@/lib/hooks/useSites'

const content = {
  projects: { label: 'Projets', title: 'Les espaces où vos retours prennent du contexte.', body: 'Un projet rassemble son domaine, ses sources de collecte, ses retours et ses rapports.' },
  feedback: { label: 'Retours', title: 'Tous les retours, au même endroit.', body: 'Recherchez, filtrez et ouvrez chaque retour avant de le relier à un thème ou une décision.' },
  analysis: { label: 'Analyses', title: 'Les signaux structurés par Qualio.', body: 'Chaque analyse sépare le résumé, le thème, la confiance et les éléments qui restent incertains.' },
  recommendations: { label: 'Recommandations', title: 'Les décisions qui attendent votre équipe.', body: 'Une recommandation est une proposition sourcée, jamais une action automatique sur votre produit.' },
  reports: { label: 'Rapports', title: 'Une synthèse périodique des retours.', body: 'Retrouvez les thèmes, leur évolution, les exemples sourcés et les données manquantes.' },
  collection: { label: 'Collecte', title: 'Choisissez comment les retours arrivent.', body: 'Ajoutez un retour manuellement pour commencer. Les sources externes utiliseront la même base persistante.' },
} as const

type FeedbackItem = { id: string; content: string; source: string; theme: string | null; status: string; created_at: string; author_name: string | null }

export function FeedbackSectionPage({ section }: { section: keyof typeof content }) {
  const page = content[section]
  const { data: sites } = useSites()
  const site = sites?.[0]
  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ['feedback', site?.id],
    queryFn: async () => {
      const response = await fetch(`/api/feedback?siteId=${encodeURIComponent(site!.id)}`)
      if (!response.ok) throw new Error('Impossible de charger les retours')
      return response.json() as Promise<FeedbackItem[]>
    },
    enabled: Boolean(site?.id) && section !== 'collection',
  })

  return <div className="space-y-6 pb-16"><Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#ee6018] dark:text-zinc-400"><ArrowLeftIcon className="h-4 w-4" />Retour à l’accueil</Link><div className="rounded-xl border border-gray-200/80 bg-white p-6 dark:border-white/[0.08] dark:bg-[#181B21]"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ee6018]">{page.label}</span><h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-gray-950 dark:text-white">{page.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-zinc-400">{page.body}</p></div>{section === 'collection' ? <CollectionPanel /> : section === 'analysis' ? <><SynthesisPanel siteId={site?.id} feedbackCount={feedback.length} /><FeedbackCards feedback={feedback} isLoading={isLoading} /></> : section === 'feedback' || section === 'recommendations' ? <FeedbackCards feedback={feedback} isLoading={isLoading} /> : <InfoCards section={section} />}</div>
}

type Synthesis = { id: string; title: string; summary: string; themes: Array<{ name: string; count: number; insight: string; feedback_ids: string[] }>; recommendations: Array<{ title: string; action: string; rationale: string; priority: string; feedback_ids: string[] }>; created_at: string }

function SynthesisPanel({ siteId, feedbackCount }: { siteId?: string; feedbackCount: number }) {
  const [status, setStatus] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { data: syntheses = [], refetch } = useQuery({ queryKey: ['feedback-syntheses', siteId], queryFn: async () => { const response = await fetch(`/api/feedback/synthesis?siteId=${encodeURIComponent(siteId!)}`); if (!response.ok) throw new Error('Impossible de charger les synthèses'); return response.json() as Promise<Synthesis[]> }, enabled: Boolean(siteId) })
  const latest = syntheses[0]

  async function generate() {
    if (!siteId) return
    setStatus(null); setIsGenerating(true)
    try {
      const response = await fetch('/api/feedback/synthesis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) return setStatus(result.error ?? 'Impossible de générer la synthèse.')
      await refetch(); setStatus('Synthèse générée et recommandations enregistrées.')
    } finally { setIsGenerating(false) }
  }

  return <section className="rounded-xl border border-orange-200/80 bg-[#fffaf6] p-5 dark:border-orange-500/20 dark:bg-orange-500/[0.06]"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c95720]">Synthèse IA sourcée</p><h2 className="mt-2 text-xl font-semibold text-gray-950 dark:text-white">Comprendre avant de décider</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-zinc-300">Qualio utilise les avis enregistrés, cite les retours qui justifient chaque thème et propose des actions que vous validez vous-même.</p></div><button type="button" onClick={generate} disabled={!siteId || feedbackCount < 3 || isGenerating} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#ee6018] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#d95514] disabled:cursor-not-allowed disabled:opacity-50">{isGenerating ? 'Génération…' : latest ? 'Générer une nouvelle synthèse' : 'Générer la synthèse'}</button></div>{feedbackCount < 3 && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Ajoutez encore {3 - feedbackCount} avis pour lancer une synthèse fiable.</p>}{status && <p className="mt-4 rounded-lg bg-white/80 p-3 text-xs text-gray-700 dark:bg-white/[0.06] dark:text-zinc-200">{status}</p>}{latest && <div className="mt-5 rounded-xl border border-orange-200/70 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181B21]"><div className="flex items-center justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">Dernière synthèse</span><h3 className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">{latest.title}</h3></div><span className="text-xs text-gray-400">{formatDate(latest.created_at)}</span></div><p className="mt-3 text-sm leading-6 text-gray-600 dark:text-zinc-300">{latest.summary}</p><div className="mt-5 grid gap-3 md:grid-cols-2">{latest.themes.map((theme) => <div key={theme.name} className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.04]"><div className="flex items-center justify-between gap-2"><strong className="text-sm text-gray-900 dark:text-white">{theme.name}</strong><span className="text-[10px] font-bold uppercase text-[#c95720]">{theme.count} avis</span></div><p className="mt-2 text-xs leading-5 text-gray-500 dark:text-zinc-400">{theme.insight}</p></div>)}</div></div>}</section>
}

function FeedbackCards({ feedback, isLoading }: { feedback: FeedbackItem[]; isLoading: boolean }) { return <div className="grid gap-4 md:grid-cols-2">{isLoading ? <p className="text-sm text-gray-500">Chargement…</p> : feedback.length === 0 ? <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-white/10 dark:text-zinc-400">Aucun retour enregistré pour ce projet. Utilisez Collecte pour en ajouter un.</div> : feedback.map((item) => <article key={item.id} className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181B21]"><div className="flex items-center justify-between"><span className="rounded-md bg-orange-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#c95720] dark:bg-orange-500/10 dark:text-orange-300">{item.source}</span><span className="text-xs text-gray-400">{formatDate(item.created_at)}</span></div><h2 className="mt-4 text-base font-semibold leading-6 text-gray-950 dark:text-white">{item.content}</h2><p className="mt-2 text-sm leading-6 text-gray-500 dark:text-zinc-400">{item.author_name ?? 'Anonyme'}</p><div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs dark:border-white/[0.06]"><span className="text-gray-400">Thème · {item.theme ?? 'Non classé'}</span><span className="font-semibold text-emerald-600 dark:text-emerald-300">{item.status === 'open' ? 'À examiner' : item.status}</span></div></article>)}</div> }
function InfoCards({ section }: { section: keyof typeof content }) { const labels = section === 'projects' ? ['Projets connectés', 'Domaine', 'Équipe'] : ['Rapport périodique', 'Évolution des thèmes', 'Export']; return <div className="grid gap-4 md:grid-cols-3">{labels.map((item) => <article key={item} className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181B21]"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">Disponible</span><h2 className="mt-3 text-lg font-semibold text-gray-950 dark:text-white">{item}</h2><p className="mt-2 text-sm leading-6 text-gray-500 dark:text-zinc-400">Cette vue sera alimentée par les données persistées de votre espace.</p></article>)}</div> }

function CollectionPanel() {
  const { data: sites, isLoading } = useSites()
  const [feedback, setFeedback] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const site = sites?.[0]

  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setStatus(null); if (!site?.id || !feedback.trim()) return setStatus('Sélectionnez un projet et saisissez un retour.'); const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: site.id, content: feedback, authorName }) }); const result = await response.json().catch(() => ({})); if (!response.ok) return setStatus(result.error ?? 'Impossible d’enregistrer ce retour.'); setFeedback(''); setAuthorName(''); setStatus('Retour enregistré. Il apparaît maintenant dans Accueil et Retours.') }

  if (isLoading) return <div className="rounded-xl border border-gray-200/80 bg-white p-6 text-sm text-gray-500 dark:border-white/[0.08] dark:bg-[#181B21]">Chargement du projet…</div>
  if (!site) return <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 dark:border-white/10 dark:bg-white/[0.03]"><h2 className="text-base font-semibold text-gray-900 dark:text-white">Aucun projet disponible</h2><p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">Créez d’abord un projet pour enregistrer des retours.</p><Link href="/onboarding" className="mt-4 inline-flex rounded-lg bg-gray-950 px-4 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-gray-950">Créer un espace</Link></div>
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.7fr)]"><form onSubmit={submit} className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181B21]"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ee6018]">Source widget</p><h2 className="mt-2 text-xl font-semibold text-gray-950 dark:text-white">Recevoir les prochains avis</h2><p className="mt-2 text-sm leading-6 text-gray-500 dark:text-zinc-400">Le script se génère depuis l’onboarding. Projet actif : {site.name || site.url}.</p><Link href="/onboarding" className="mt-5 inline-flex rounded-lg bg-[#ee6018] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#d95514]">Préparer le widget</Link><div className="mt-8 border-t border-gray-100 pt-6 dark:border-white/[0.06]"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Ajout ponctuel</p><label className="mt-3 block text-xs font-semibold text-gray-700 dark:text-zinc-300">Retour<textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} required maxLength={10000} rows={5} placeholder="Copier un avis reçu ailleurs…" className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none transition focus:border-[#ee6018] dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white" /></label><label className="mt-4 block text-xs font-semibold text-gray-700 dark:text-zinc-300">Nom (facultatif)<input value={authorName} onChange={(event) => setAuthorName(event.target.value)} maxLength={160} className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#ee6018] dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white" /></label>{status && <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-white/[0.04] dark:text-zinc-300">{status}</p>}<button type="submit" className="mt-5 rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-bold hover:border-gray-400 dark:border-white/10">Enregistrer ponctuellement</button></div></form><div className="space-y-3"><SourceCard title="Import CSV" body="Importez vos avis passés depuis l’onboarding pour les analyser avec les nouveaux." /><SourceCard title="Synthèse IA" body="Une synthèse apparaît quand Qualio dispose d’assez de nouveaux avis à comparer." /><SourceCard title="Pas de formulaire à recréer" body="Qualio se concentre sur le widget et l’import, sans analyse automatique de votre site." /></div></div>
}

function SourceCard({ title, body }: { title: string; body: string }) { return <div className="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-white/[0.08] dark:bg-[#181B21]"><h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-gray-500 dark:text-zinc-400">{body}</p></div> }
function formatDate(value: string) { return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) }
