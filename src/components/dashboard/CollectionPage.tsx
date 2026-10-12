'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useActiveSite } from '@/lib/hooks/useActiveSite'
import { useInvalidateAll } from '@/lib/hooks/useDashboard'
import { PageHeader } from '@/components/dashboard/ui'

export function CollectionPage() {
  return (
    <div className="space-y-6 pb-16">
      <PageHeader eyebrow="Collecte" title="Les sources de vos avis" description="Le widget reçoit les nouveaux avis. L’import CSV et l’ajout manuel complètent votre historique dans le même espace. Chaque avis est classé automatiquement." />
      <CollectionPanel />
    </div>
  )
}

function EmptyPanel({ title, body, href, label }: { title: string; body: string; href: string; label: string }) { return <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 dark:border-white/10 dark:bg-white/[0.03]"><h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-300">{body}</p><Link href={href} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#ee6018] px-4 text-xs font-bold text-white">{label}</Link></div> }
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
  return <div id="manual" className="space-y-5"><CsvImportPanel siteId={activeSite?.id} /><ManualCollectionFields /></div>
}

function CsvImportPanel({ siteId }: { siteId?: string }) {
  const { invalidate } = useInvalidateAll()
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
      await invalidate()
    } catch { setStatus('Import impossible pour le moment. Réessayez.') } finally { setBusy(false) }
  }
  return <section className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181B21]"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ee6018]">Import CSV</p><h2 className="mt-2 text-xl font-semibold text-gray-950 dark:text-white">Retrouver votre historique</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-zinc-400"><code>content</code> est obligatoire. <code>author_name</code>, <code>created_at</code> et <code>source</code> sont facultatives. UTF-8, virgule ou point-virgule, 5 Mo et 5 000 lignes maximum.</p></div><button type="button" onClick={downloadSample} className="min-h-11 shrink-0 rounded-lg border border-gray-200 px-3 text-xs font-bold dark:border-white/10">Télécharger l’exemple</button></div><label className="mt-5 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 text-center text-sm text-gray-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-300"><span>{file ? file.name : 'Déposez un CSV ou touchez pour le choisir'}</span><input type="file" accept=".csv,text/csv" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} className="sr-only" /></label>{preview.length ? <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-white/10"><table className="min-w-full text-left text-xs"><tbody>{preview.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-gray-100 last:border-0 dark:border-white/[0.06]">{row.slice(0, 5).map((cell, cellIndex) => <td key={cellIndex} className="max-w-56 px-3 py-2 text-gray-700 dark:text-zinc-300">{cell}</td>)}</tr>)}</tbody></table></div> : null}{progress > 0 && <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]"><div className="h-full bg-[#ee6018] transition-all" style={{ width: `${progress}%` }} /></div>}<div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={() => void importFile()} disabled={busy || !file} className="min-h-11 rounded-lg bg-[#ee6018] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Import en cours…' : 'Importer les avis'}</button>{status ? <p role="status" aria-live="polite" className="text-xs text-gray-600 dark:text-zinc-300">{status}</p> : null}</div></section>
}

function ManualCollectionFields() {
  const { isLoading, activeSite } = useActiveSite()
  const { invalidate } = useInvalidateAll()
  const [feedback, setFeedback] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const site = activeSite

  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setStatus(null); if (!site?.id || !feedback.trim()) return setStatus('Sélectionnez un projet et saisissez un retour.'); const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: site.id, content: feedback, authorName }) }); const result = await response.json().catch(() => ({})); if (!response.ok) return setStatus(result.error ?? 'Impossible d’enregistrer ce retour.'); setFeedback(''); setAuthorName(''); await invalidate(); setStatus('Retour enregistré. Il apparaît maintenant dans Accueil et Avis.') }

  if (isLoading) return <div className="rounded-xl border border-gray-200/80 bg-white p-6 text-sm text-gray-500 dark:border-white/[0.08] dark:bg-[#181B21]">Chargement du projet…</div>
  if (!site) return <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 dark:border-white/10 dark:bg-white/[0.03]"><h2 className="text-base font-semibold text-gray-900 dark:text-white">Aucun projet disponible</h2><p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">Créez d’abord un projet pour enregistrer des retours.</p><Link href="/onboarding" className="mt-4 inline-flex rounded-lg bg-gray-950 px-4 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-gray-950">Créer un espace</Link></div>
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.7fr)]"><form onSubmit={submit} className="rounded-xl border border-gray-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181B21]"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ee6018]">Ajout manuel</p><h2 className="mt-2 text-xl font-semibold text-gray-950 dark:text-white">Ajouter un avis reçu</h2><p className="mt-2 text-sm leading-6 text-gray-500 dark:text-zinc-400">Projet actif : {site.name || site.url || 'sans nom'}.</p><Link href="/onboarding" className="mt-5 inline-flex rounded-lg bg-[#ee6018] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#d95514]">Préparer le widget</Link><div className="mt-8 border-t border-gray-100 pt-6 dark:border-white/[0.06]"><label className="mt-3 block text-xs font-semibold text-gray-700 dark:text-zinc-300">Avis<textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} required maxLength={2000} rows={5} placeholder="Collez un avis reçu ailleurs…" className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none transition focus:border-[#ee6018] dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white" /></label><label className="mt-4 block text-xs font-semibold text-gray-700 dark:text-zinc-300">Nom (facultatif)<input value={authorName} onChange={(event) => setAuthorName(event.target.value)} maxLength={160} className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#ee6018] dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white" /></label>{status && <p role="status" aria-live="polite" className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-white/[0.04] dark:text-zinc-300">{status}</p>}<button type="submit" className="mt-5 min-h-11 rounded-lg border border-gray-200 px-4 text-xs font-bold hover:border-gray-400 dark:border-white/10">Enregistrer l’avis</button></div></form><div className="space-y-3"><SourceCard title="Import CSV" body="Importez vos avis passés depuis l’onboarding pour les analyser avec les nouveaux." /><SourceCard title="Synthèse IA" body="Une synthèse apparaît quand Qualio dispose d’assez de nouveaux avis à comparer." /><SourceCard title="Widget" body="Recevez les prochains avis directement depuis votre site." /></div></div>
}

function SourceCard({ title, body }: { title: string; body: string }) { return <div className="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-white/[0.08] dark:bg-[#181B21]"><h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-gray-500 dark:text-zinc-400">{body}</p></div> }
function escapeHtmlAttribute(value: string) { return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character) }
