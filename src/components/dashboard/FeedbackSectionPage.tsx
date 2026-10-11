'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useActiveSite } from '@/lib/hooks/useActiveSite'
import { FeedbackInbox } from '@/components/dashboard/FeedbackInbox'

const content = {
  feedback: { label: 'Avis', title: 'Tous les avis, au même endroit.', body: 'Recherchez, filtrez et traitez chaque avis avant de le relier à un thème ou une décision.' },
  analysis: { label: 'Thèmes', title: 'Les thèmes qui reviennent dans vos avis.', body: 'Repérez les sujets récurrents et ouvrez les avis qui les justifient.' },
  syntheses: { label: 'Synthèses', title: 'Comprendre avant de décider.', body: 'Chaque synthèse relie les thèmes et les recommandations aux avis qui les justifient.' },
  recommendations: { label: 'Recommandations', title: 'Les décisions qui attendent votre équipe.', body: 'Une recommandation est une proposition sourcée, jamais une action automatique sur votre produit.' },
  collection: { label: 'Collecte', title: 'Gérez les sources de vos avis.', body: 'Le widget collecte les nouveaux avis. L’import CSV conserve votre historique dans le même espace.' },
} as const

type FeedbackItem = { id: string; content: string; source: string; theme: string | null; status: string; created_at: string; author_name: string | null; metadata?: { is_example?: boolean } | null }

export function FeedbackSectionPage({ section }: { section: keyof typeof content }) {
  const page = content[section]
  const { activeSite: site } = useActiveSite()
  const { data: feedback = [], isLoading, isError, refetch: refetchFeedback } = useQuery({
    queryKey: ['feedback', site?.id],
    queryFn: async () => {
      const response = await fetch(`/api/feedback?siteId=${encodeURIComponent(site!.id)}`)
      if (!response.ok) throw new Error('Impossible de charger les retours')
      return response.json() as Promise<FeedbackItem[]>
    },
    enabled: Boolean(site?.id) && ['analysis', 'feedback', 'syntheses'].includes(section),
  })

  const hasExamples = feedback.some((item) => item.metadata?.is_example === true)
  return <div className="space-y-6 pb-16"><Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#ee6018] dark:text-zinc-400"><ArrowLeftIcon className="h-4 w-4" />Retour à la vue d’ensemble</Link><div className="rounded-xl border border-gray-200/80 bg-white p-6 dark:border-white/[0.08] dark:bg-[#181B21]"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ee6018]">{page.label}</span><h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-gray-950 dark:text-white">{page.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-zinc-400">{page.body}</p></div>{hasExamples && site?.id ? <ExampleBanner siteId={site.id} /> : null}{section === 'collection' ? <CollectionPanel /> : section === 'feedback' ? <FeedbackInbox siteId={site?.id} /> : section === 'analysis' ? <FeedbackCards feedback={feedback} isLoading={isLoading} isError={isError} onRetry={() => void refetchFeedback()} /> : section === 'syntheses' ? <SynthesisPanel siteId={site?.id} feedbackCount={feedback.length} /> : <RecommendationsPanel siteId={site?.id} />}</div>
}

type Synthesis = { id: string; title: string; summary: string; themes: Array<{ name: string; count: number; insight: string; feedback_ids: string[] }>; recommendations: Array<{ title: string; action: string; rationale: string; priority: string; feedback_ids: string[] }>; created_at: string }

function SynthesisPanel({ siteId, feedbackCount }: { siteId?: string; feedbackCount: number }) {
  const [status, setStatus] = useState<string | null>(null)
  const [quotaReached, setQuotaReached] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const { data: syntheses = [], isLoading, isError, refetch } = useQuery({ queryKey: ['feedback-syntheses', siteId], queryFn: async () => { const response = await fetch(`/api/feedback/synthesis?siteId=${encodeURIComponent(siteId!)}`); if (!response.ok) throw new Error('Impossible de charger les synthèses'); return response.json() as Promise<Synthesis[]> }, enabled: Boolean(siteId) })
  const latest = syntheses[0]
  if (!siteId) return <EmptyPanel title="Aucun projet actif" body="Créez un projet pour générer une synthèse de vos avis." href="/onboarding" label="Créer un projet" />
  if (isLoading) return <div className="space-y-4"><div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.06]" /><div className="h-56 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.06]" /></div>
  if (isError) return <ErrorPanel onRetry={() => void refetch()} />
  if (quotaReached) return <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/10"><h2 className="text-lg font-semibold text-amber-950 dark:text-amber-100">Quota de synthèses atteint</h2><p role="status" aria-live="polite" className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-100">{status}</p><Link href="/pricing" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#ee6018] px-4 py-2 text-xs font-bold text-white">Passer en Pro</Link></section>

  async function generate() {
    if (!siteId) return
    setStatus(null); setIsGenerating(true)
    try {
      const response = await fetch('/api/feedback/synthesis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (response.status === 429) {
          const resetLabel = result.resetAt ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date(result.resetAt)) : 'le début du mois prochain'
          setQuotaReached(true)
          setStatus(`${result.usedThisMonth ?? 0} synthèse(s) utilisée(s) sur ${result.monthlyLimit ?? 0} ce mois-ci. Le quota revient le ${resetLabel}.`)
        } else setStatus(result.error ?? 'Impossible de générer la synthèse.')
        return
      }
      setQuotaReached(false)
      await refetch(); setStatus('Synthèse générée et recommandations enregistrées.')
    } catch { setStatus('La génération est momentanément indisponible. Réessayez.') } finally { setIsGenerating(false) }
  }

  return <section className="rounded-xl border border-orange-200/80 bg-[#fffaf6] p-5 dark:border-orange-500/20 dark:bg-orange-500/[0.06]"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c95720]">Synthèse IA sourcée</p><h2 className="mt-2 text-xl font-semibold text-gray-950 dark:text-white">Comprendre avant de décider</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-zinc-300">Qualio utilise les avis enregistrés, cite les retours qui justifient chaque thème et propose des actions que vous validez vous-même.</p></div><button type="button" onClick={generate} disabled={!siteId || feedbackCount < 3 || isGenerating} className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#ee6018] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#d95514] disabled:cursor-not-allowed disabled:opacity-50">{isGenerating ? 'Génération…' : latest ? 'Générer une nouvelle synthèse' : 'Générer la synthèse'}</button></div>{feedbackCount < 3 && <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Ajoutez encore {3 - feedbackCount} avis pour lancer une synthèse fiable.</p>}{status && <p className="mt-4 rounded-lg bg-white/80 p-3 text-xs text-gray-700 dark:bg-white/[0.06] dark:text-zinc-200">{status}</p>}{latest && <div className="mt-5 rounded-xl border border-orange-200/70 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181B21]"><div className="flex items-center justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">Dernière synthèse</span><h3 className="mt-1 text-lg font-semibold text-gray-950 dark:text-white">{latest.title}</h3></div><span className="text-xs text-gray-400">{formatDate(latest.created_at)}</span></div><p className="mt-3 text-sm leading-6 text-gray-600 dark:text-zinc-300">{latest.summary}</p><div className="mt-5 grid gap-3 md:grid-cols-2">{latest.themes.map((theme) => <div key={theme.name} className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.04]"><div className="flex items-center justify-between gap-2"><strong className="text-sm text-gray-900 dark:text-white">{theme.name}</strong><span className="text-[10px] font-bold uppercase text-[#c95720]">{theme.count} avis</span></div><p className="mt-2 text-xs leading-5 text-gray-500 dark:text-zinc-400">{theme.insight}</p></div>)}</div></div>}</section>
}

function FeedbackCards({ feedback, isLoading, isError, onRetry }: { feedback: FeedbackItem[]; isLoading: boolean; isError: boolean; onRetry: () => void }) {
  if (isLoading) return <div className="grid gap-4 md:grid-cols-2"><div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.06]" /><div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.06]" /></div>
  if (isError) return <ErrorPanel onRetry={onRetry} />
  if (feedback.length === 0) return <EmptyPanel title="Aucun avis classé" body="Les avis apparaîtront ici dès que votre widget, votre CSV ou votre ajout manuel en aura enregistré." href="/dashboard/collection" label="Ajouter des avis" />
  return <div className="grid gap-4 md:grid-cols-2">{feedback.map((item) => <article key={item.id} className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181B21]"><div className="flex items-center justify-between"><span className="rounded-md bg-orange-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#c95720] dark:bg-orange-500/10 dark:text-orange-300">{item.source}</span><span className="text-xs text-gray-400">{formatDate(item.created_at)}</span></div><h2 className="mt-4 text-base font-semibold leading-6 text-gray-950 dark:text-white">{item.content}</h2><p className="mt-2 text-sm leading-6 text-gray-500 dark:text-zinc-400">{item.author_name ?? 'Anonyme'}</p><div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs dark:border-white/[0.06]"><span className="text-gray-400">Thème · {item.theme ?? 'Non classé'}</span><span className="font-semibold text-emerald-600 dark:text-emerald-300">{item.status === 'open' ? 'À examiner' : item.status}</span></div></article>)}</div>
}
type Recommendation = { id: string; title: string; description?: string | null; action?: string | null; rationale?: string | null; priority?: 'high' | 'medium' | 'low' | null; status: 'open' | 'accepted' | 'dismissed' | 'done'; feedback_ids: string[]; created_at: string; effect?: { label: string; baselineCount: number; currentCount: number } | null }

function RecommendationsPanel({ siteId }: { siteId?: string }) {
  const query = useQuery({
    queryKey: ['feedback-recommendations', siteId],
    queryFn: async () => {
      const response = await fetch(`/api/feedback/recommendations?siteId=${encodeURIComponent(siteId!)}`)
      if (!response.ok) throw new Error('Impossible de charger les recommandations.')
      return response.json() as Promise<Recommendation[]>
    },
    enabled: Boolean(siteId),
  })
  const [activeStatus, setActiveStatus] = useState<Recommendation['status']>('open')
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  async function updateStatus(id: string, status: Recommendation['status']) {
    if (!siteId) return
    const response = await fetch('/api/feedback/recommendations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, siteId, status }) })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) return setActionMessage(result.error ?? 'Impossible de mettre à jour cette recommandation.')
    setActionMessage('Recommandation mise à jour.')
    await query.refetch()
    window.setTimeout(() => setActionMessage(null), 2500)
  }

  if (!siteId) return <EmptyPanel title="Aucun projet actif" body="Créez un projet pour recevoir des recommandations liées à vos avis." href="/onboarding" label="Créer un projet" />
  if (query.isLoading) return <div className="grid gap-4 md:grid-cols-2"><div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.06]" /><div className="h-48 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.06]" /></div>
  if (query.isError) return <ErrorPanel onRetry={() => query.refetch()} />
  const recommendations = query.data ?? []
  const visible = recommendations.filter((recommendation) => (recommendation.status ?? 'open') === activeStatus)
  const tabs: Array<[Recommendation['status'], string]> = [['open', 'À décider'], ['accepted', 'En cours'], ['done', 'Faites'], ['dismissed', 'Rejetées']]
  return <section className="space-y-4"><div className="flex gap-2 overflow-x-auto pb-1">{tabs.map(([status, label]) => <button key={status} type="button" onClick={() => setActiveStatus(status)} className={`min-h-11 shrink-0 rounded-lg px-3 text-xs font-semibold ${activeStatus === status ? 'bg-[#ee6018] text-white' : 'border border-gray-200 text-gray-600 dark:border-white/10 dark:text-zinc-300'}`}>{label} ({recommendations.filter((item) => (item.status ?? 'open') === status).length})</button>)}</div>{actionMessage && <p role="status" aria-live="polite" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">{actionMessage}</p>}{!recommendations.length ? <EmptyPanel title="Aucune recommandation enregistrée" body="Générez une synthèse depuis Synthèses pour obtenir des actions sourcées." href="/dashboard/syntheses" label="Générer une synthèse" /> : !visible.length ? <div className="rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-600 dark:border-white/10 dark:text-zinc-300">Aucune recommandation dans cet onglet.</div> : <div className="grid gap-4 md:grid-cols-2">{visible.map((recommendation) => <article key={recommendation.id} className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181B21]"><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#ee6018]">Priorité {recommendation.priority ?? 'à préciser'}</span><h2 className="mt-2 text-lg font-semibold text-gray-950 dark:text-white">{recommendation.title}</h2></div><span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600 dark:bg-white/[0.06] dark:text-zinc-300">{recommendation.status === 'open' ? 'À décider' : recommendation.status === 'accepted' ? 'En cours' : recommendation.status === 'done' ? 'Faite' : 'Rejetée'}</span></div><p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600 dark:text-zinc-300">{recommendation.action ?? recommendation.description ?? 'Action à préciser.'}</p>{recommendation.rationale && <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-zinc-400">Pourquoi : {recommendation.rationale}</p>}{recommendation.effect ? <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs leading-5 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">Effet mesuré : {recommendation.effect.label}{recommendation.effect.label !== 'Trop tôt pour conclure' ? ` (${Math.round((recommendation.effect.currentCount - recommendation.effect.baselineCount) / recommendation.effect.baselineCount * 100)} %)` : ''}</p> : null}<div className="mt-4 flex flex-wrap gap-2">{recommendation.feedback_ids.map((feedbackId) => <Link key={feedbackId} href={`/dashboard/feedback?feedbackId=${encodeURIComponent(feedbackId)}`} className="min-h-11 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-[#ee6018] dark:border-white/10 dark:text-zinc-300">Avis source {feedbackId.slice(0, 8)}</Link>)}</div>{recommendation.status === 'open' && <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-white/[0.06]"><button type="button" onClick={() => updateStatus(recommendation.id, 'accepted')} className="min-h-11 rounded-lg bg-[#ee6018] px-3 py-2 text-xs font-bold text-white">Accepter</button><button type="button" onClick={() => updateStatus(recommendation.id, 'dismissed')} className="min-h-11 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-white/10 dark:text-zinc-300">Refuser</button></div>}{recommendation.status === 'accepted' && <button type="button" onClick={() => updateStatus(recommendation.id, 'done')} className="mt-5 min-h-11 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Marquer comme faite</button>}</article>)}</div>}</section>
}

function EmptyPanel({ title, body, href, label }: { title: string; body: string; href: string; label: string }) { return <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 dark:border-white/10 dark:bg-white/[0.03]"><h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-300">{body}</p><Link href={href} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#ee6018] px-4 text-xs font-bold text-white">{label}</Link></div> }
function ErrorPanel({ onRetry }: { onRetry: () => void }) { return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10"><h2 className="text-base font-semibold text-red-900 dark:text-red-100">Impossible de charger les recommandations</h2><p className="mt-2 text-sm text-red-800 dark:text-red-200">Vérifiez votre connexion puis réessayez.</p><button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-lg border border-red-300 px-4 text-xs font-bold text-red-900 dark:border-red-400/40 dark:text-red-100">Réessayer</button></div> }

function CollectionPanel() {
  const { activeSite: site, isLoading: siteLoading } = useActiveSite()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const sourcesQuery = useQuery({ queryKey: ['feedback-sources', site?.id], queryFn: async () => { const response = await fetch(`/api/feedback/sources?siteId=${encodeURIComponent(site!.id)}`); if (!response.ok) throw new Error(); return response.json() as Promise<Array<{ id: string; public_key: string; active: boolean; accent_color?: string; position?: string; button_label?: string }>> }, enabled: Boolean(site?.id) })
  const source = sourcesQuery.data?.[0]
  const [widgetSettings, setWidgetSettings] = useState({ accentColor: '#ee6018', position: 'right', buttonLabel: 'Laisser un avis' })
  useEffect(() => { if (source) setWidgetSettings({ accentColor: source.accent_color ?? '#ee6018', position: source.position ?? 'right', buttonLabel: source.button_label ?? 'Laisser un avis' }) }, [source])
  const script = source ? `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-key="${source.public_key}" data-accent="${escapeHtmlAttribute(widgetSettings.accentColor)}" data-position="${widgetSettings.position}" data-label="${escapeHtmlAttribute(widgetSettings.buttonLabel)}"></script>` : ''
  async function sourceAction(action: 'create' | 'disable' | 'enable' | 'regenerate') {
    if (!site?.id) return
    if (action === 'disable' && !window.confirm('Désactiver la clé widget ? Les avis déjà reçus restent conservés.')) return
    if (action === 'regenerate' && !window.confirm('Régénérer la clé ? Le script actuellement installé cessera de fonctionner.')) return
    setBusy(true); setMessage(null)
    const response = await fetch('/api/feedback/sources', { method: action === 'create' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action === 'create' ? { siteId: site.id } : { siteId: site.id, action }) })
    const result = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok) return setMessage(result.error ?? 'Impossible de modifier la collecte.')
    await sourcesQuery.refetch(); setMessage(action === 'disable' ? 'Widget désactivé.' : action === 'regenerate' ? 'Nouvelle clé créée. Copiez le nouveau script.' : 'Collecte prête.')
  }
  async function saveWidgetSettings() {
    if (!site?.id) return
    setBusy(true); setMessage(null)
    const response = await fetch('/api/feedback/sources', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: site.id, action: 'settings', ...widgetSettings }) })
    const result = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok) return setMessage(result.error ?? 'Impossible d’enregistrer l’apparence du widget.')
    await sourcesQuery.refetch(); setMessage('Apparence du widget enregistrée.')
  }
  async function copyScript() {
    if (!script) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(script)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = script
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        textarea.remove()
      }
    } catch {
      setMessage('La copie automatique a échoué. Sélectionnez le script puis copiez-le manuellement.')
      return
    }
    setCopyState('copied'); window.setTimeout(() => setCopyState('idle'), 2200)
  }
  async function verifyInstallation() {
    if (!site?.id) return
    setBusy(true); const response = await fetch(`/api/feedback?siteId=${encodeURIComponent(site.id)}`); const feedback = await response.json().catch(() => []); setBusy(false)
    setMessage(Array.isArray(feedback) && feedback.some((item: { source?: string }) => item.source === 'widget') ? 'Installation vérifiée : un avis widget est arrivé.' : 'Aucun avis widget reçu pour le moment. Envoyez un avis test depuis votre page.')
  }
  if (siteLoading) return <div className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.06]" />
  if (!site) return <EmptyPanel title="Aucun projet actif" body="Créez un projet pour préparer votre widget ou ajouter un avis manuellement." href="/onboarding" label="Créer un projet" />
  return <div className="space-y-5"><section className="rounded-xl border border-orange-200/80 bg-[#fffaf6] p-5 dark:border-orange-500/20 dark:bg-orange-500/[0.06]"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c95720]">Widget</p><h2 className="mt-2 text-xl font-semibold text-gray-950 dark:text-white">Recevoir les prochains avis</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-zinc-300">Collez ce script dans votre site. La clé permet uniquement d’écrire un avis pour ce projet.</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${source?.active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-zinc-300'}`}>{source?.active ? 'Actif' : 'Désactivé'}</span></div>{source ? <><div className="relative mt-5 overflow-x-auto rounded-xl bg-gray-950 p-4 pr-14 font-mono text-xs leading-6 text-gray-200"><code>{script}</code><button type="button" onClick={() => void copyScript()} aria-label="Copier le script widget" className="absolute right-3 top-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/10 text-xs text-white">{copyState === 'copied' ? '✓' : 'Copier'}</button></div><div className="mt-4 grid gap-3 rounded-xl border border-gray-200 bg-white/60 p-4 dark:border-white/[0.08] dark:bg-white/[0.03] sm:grid-cols-[1fr_auto_auto]"><label className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Texte du bouton<input value={widgetSettings.buttonLabel} onChange={(event) => setWidgetSettings((current) => ({ ...current, buttonLabel: event.target.value }))} maxLength={60} className="mt-2 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-base font-normal dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /></label><label className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Couleur<input type="color" value={widgetSettings.accentColor} onChange={(event) => setWidgetSettings((current) => ({ ...current, accentColor: event.target.value }))} aria-label="Couleur du widget" className="mt-2 h-11 w-full min-w-16 cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-white/[0.04]" /></label><label className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Position<select value={widgetSettings.position} onChange={(event) => setWidgetSettings((current) => ({ ...current, position: event.target.value }))} className="mt-2 min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-white"><option value="right">Droite</option><option value="left">Gauche</option></select></label><button type="button" onClick={() => void saveWidgetSettings()} disabled={busy || !widgetSettings.buttonLabel.trim()} className="min-h-11 rounded-lg border border-gray-300 px-4 text-xs font-bold dark:border-white/10 sm:col-span-3 sm:justify-self-start">Enregistrer l’apparence</button></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void verifyInstallation()} disabled={busy} className="min-h-11 rounded-lg bg-[#ee6018] px-4 text-xs font-bold text-white">Vérifier l’installation</button>{source.active ? <button type="button" onClick={() => void sourceAction('disable')} disabled={busy} className="min-h-11 rounded-lg border border-gray-200 px-4 text-xs font-semibold dark:border-white/10">Désactiver</button> : <button type="button" onClick={() => void sourceAction('enable')} disabled={busy} className="min-h-11 rounded-lg border border-gray-200 px-4 text-xs font-semibold dark:border-white/10">Réactiver</button>}<button type="button" onClick={() => void sourceAction('regenerate')} disabled={busy} className="min-h-11 rounded-lg border border-gray-200 px-4 text-xs font-semibold dark:border-white/10">Régénérer la clé</button></div></> : <button type="button" onClick={() => void sourceAction('create')} disabled={busy} className="mt-5 min-h-11 rounded-lg bg-[#ee6018] px-4 text-xs font-bold text-white">{busy ? 'Préparation…' : 'Préparer le widget'}</button>}{message ? <p role="status" aria-live="polite" className="mt-4 rounded-lg bg-white/80 p-3 text-xs text-gray-700 dark:bg-white/[0.06] dark:text-zinc-200">{message}</p> : null}</section><section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><SourceCard title="HTML simple" body="Ajoutez le script avant </body>, puis rechargez la page." /><SourceCard title="Webflow" body="Collez le script dans les réglages de code personnalisé du projet." /><SourceCard title="WordPress" body="Ajoutez-le dans un bloc HTML ou dans l’insertion de scripts du thème." /><SourceCard title="Shopify" body="Ajoutez-le dans le code du thème, juste avant </body>." /></section><ManualCollectionPanel /></div>
}

function ManualCollectionPanel() {
  const { activeSite } = useActiveSite()
  return <div className="space-y-5"><CsvImportPanel siteId={activeSite?.id} /><ManualCollectionFields /></div>
}

function CsvImportPanel({ siteId }: { siteId?: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  function selectFile(next: File | null) {
    setFile(next); setStatus(null); setProgress(0)
    if (!next) return setPreview([])
    void next.text().then((text) => setPreview(text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean).slice(0, 5).map((line) => line.split(/[;,]/).map((cell) => cell.trim()))))
  }
  function downloadSample() {
    const blob = new Blob(['content,author_name,created_at,source\n"Le parcours est clair",Camille,2026-10-01,import\n"J’ai besoin de comprendre le prix",Nora,2026-10-02,import\n"Le support répond vite",Moussa,2026-10-03,import\n'], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'qualio-exemple.csv'; anchor.click(); URL.revokeObjectURL(url)
  }
  async function importFile() {
    if (!siteId || !file) return setStatus('Choisissez un fichier CSV et un projet actif.')
    setBusy(true); setStatus(null); setProgress(35)
    try {
      const response = await fetch('/api/feedback/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId, csv: await file.text() }) })
      setProgress(100)
      const result = await response.json().catch(() => ({}))
      if (!response.ok) return setStatus(result.error ?? 'Le fichier n’a pas pu être importé.')
      setStatus(`${result.imported ?? 0} avis importés, ${result.skipped ?? 0} ignoré(s).${result.reasons?.length ? ' Ouvrez le détail pour voir pourquoi.' : ''}`)
    } catch { setStatus('Import impossible pour le moment. Réessayez.') } finally { setBusy(false) }
  }
  return <section className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181B21]"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ee6018]">Import CSV</p><h2 className="mt-2 text-xl font-semibold text-gray-950 dark:text-white">Retrouver votre historique</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-zinc-400"><code>content</code> est obligatoire. <code>author_name</code>, <code>created_at</code> et <code>source</code> sont facultatives. UTF-8, virgule ou point-virgule, 5 Mo et 5 000 lignes maximum.</p></div><button type="button" onClick={downloadSample} className="min-h-11 shrink-0 rounded-lg border border-gray-200 px-3 text-xs font-bold dark:border-white/10">Télécharger l’exemple</button></div><label className="mt-5 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 text-center text-sm text-gray-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300"><span>{file ? file.name : 'Déposez un CSV ou touchez pour le choisir'}</span><input type="file" accept=".csv,text/csv" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} className="sr-only" /></label>{preview.length ? <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10"><table className="min-w-full text-left text-xs"><tbody>{preview.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-gray-100 last:border-0 dark:border-white/[0.06]">{row.slice(0, 5).map((cell, cellIndex) => <td key={cellIndex} className="max-w-56 px-3 py-2 text-gray-700 dark:text-zinc-300">{cell}</td>)}</tr>)}</tbody></table></div> : null}{progress > 0 && <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]"><div className="h-full bg-[#ee6018] transition-all" style={{ width: `${progress}%` }} /></div>}<div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={() => void importFile()} disabled={busy || !file} className="min-h-11 rounded-lg bg-[#ee6018] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Import en cours…' : 'Importer les avis'}</button>{status ? <p role="status" aria-live="polite" className="text-xs text-gray-600 dark:text-zinc-300">{status}</p> : null}</div></section>
}

function ManualCollectionFields() {
  const { isLoading, activeSite } = useActiveSite()
  const [feedback, setFeedback] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const site = activeSite

  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setStatus(null); if (!site?.id || !feedback.trim()) return setStatus('Sélectionnez un projet et saisissez un retour.'); const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: site.id, content: feedback, authorName }) }); const result = await response.json().catch(() => ({})); if (!response.ok) return setStatus(result.error ?? 'Impossible d’enregistrer ce retour.'); setFeedback(''); setAuthorName(''); setStatus('Retour enregistré. Il apparaît maintenant dans Accueil et Retours.') }

  if (isLoading) return <div className="rounded-xl border border-gray-200/80 bg-white p-6 text-sm text-gray-500 dark:border-white/[0.08] dark:bg-[#181B21]">Chargement du projet…</div>
  if (!site) return <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 dark:border-white/10 dark:bg-white/[0.03]"><h2 className="text-base font-semibold text-gray-900 dark:text-white">Aucun projet disponible</h2><p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">Créez d’abord un projet pour enregistrer des retours.</p><Link href="/onboarding" className="mt-4 inline-flex rounded-lg bg-gray-950 px-4 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-gray-950">Créer un espace</Link></div>
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.7fr)]"><form onSubmit={submit} className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181B21]"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ee6018]">Ajout manuel</p><h2 className="mt-2 text-xl font-semibold text-gray-950 dark:text-white">Ajouter un avis reçu</h2><p className="mt-2 text-sm leading-6 text-gray-500 dark:text-zinc-400">Projet actif : {site.name || site.url || 'sans nom'}.</p><Link href="/onboarding" className="mt-5 inline-flex rounded-lg bg-[#ee6018] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#d95514]">Préparer le widget</Link><div className="mt-8 border-t border-gray-100 pt-6 dark:border-white/[0.06]"><label className="mt-3 block text-xs font-semibold text-gray-700 dark:text-zinc-300">Avis<textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} required maxLength={2000} rows={5} placeholder="Collez un avis reçu ailleurs…" className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none transition focus:border-[#ee6018] dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white" /></label><label className="mt-4 block text-xs font-semibold text-gray-700 dark:text-zinc-300">Nom (facultatif)<input value={authorName} onChange={(event) => setAuthorName(event.target.value)} maxLength={160} className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#ee6018] dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white" /></label>{status && <p role="status" aria-live="polite" className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-white/[0.04] dark:text-zinc-300">{status}</p>}<button type="submit" className="mt-5 min-h-11 rounded-lg border border-gray-200 px-4 text-xs font-bold hover:border-gray-400 dark:border-white/10">Enregistrer l’avis</button></div></form><div className="space-y-3"><SourceCard title="Import CSV" body="Importez vos avis passés depuis l’onboarding pour les analyser avec les nouveaux." /><SourceCard title="Synthèse IA" body="Une synthèse apparaît quand Qualio dispose d’assez de nouveaux avis à comparer." /><SourceCard title="Widget" body="Recevez les prochains avis directement depuis votre site." /></div></div>
}

function SourceCard({ title, body }: { title: string; body: string }) { return <div className="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-white/[0.08] dark:bg-[#181B21]"><h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-gray-500 dark:text-zinc-400">{body}</p></div> }
function ExampleBanner({ siteId }: { siteId: string }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  async function removeExamples() {
    if (!window.confirm('Supprimer tous les avis d’exemple de ce projet ? Cette action est irréversible.')) return
    setBusy(true); setMessage(null)
    const response = await fetch(`/api/feedback/examples?siteId=${encodeURIComponent(siteId)}`, { method: 'DELETE' })
    const result = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok) return setMessage(result.error ?? 'Impossible de supprimer les exemples.')
    setMessage(`${result.deleted ?? 0} avis d’exemple supprimé(s).`)
    window.setTimeout(() => window.location.reload(), 700)
  }
  return <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between"><span><strong>Ce sont des avis d’exemple.</strong> Ils ne représentent pas vos clients.</span><div className="flex items-center gap-3"><button type="button" onClick={() => void removeExamples()} disabled={busy} className="min-h-11 rounded-lg border border-amber-300 px-3 text-xs font-bold disabled:opacity-50">{busy ? 'Suppression…' : 'Supprimer les exemples'}</button>{message ? <span role="status" className="text-xs">{message}</span> : null}</div></div>
}
function escapeHtmlAttribute(value: string) { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character) }
function formatDate(value: string) { return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value)) }
