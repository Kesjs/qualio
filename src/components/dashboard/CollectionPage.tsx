'use client'

import { useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowDownTrayIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useInvalidateAll } from '@/lib/hooks/useDashboard'
import { analyzeCsv, CSV_MAX_BYTES, splitByContent, toCsv, type CsvAnalysis } from '@/lib/csv'
import { ColumnPickers, CsvPreview } from '@/components/dashboard/CsvPreview'
import { useProjectAccess } from '@/components/dashboard/useProjectAccess'
import { Banner, surface } from '@/components/dashboard/weekly/bricks'
import { EmptyState, focusRing, inputClass, PageHeader, pressable, primaryButton, secondaryButton, selectClass, Tabs } from '@/components/dashboard/ui'
import { Select } from '@/components/dashboard/Select'

type Tab = 'csv' | 'manual' | 'widget'
const TABS = [
  { id: 'csv' as const, label: 'Fichier CSV' },
  { id: 'manual' as const, label: 'Saisie manuelle' },
  { id: 'widget' as const, label: 'Widget' },
]

export function CollectionPage() {
  const access = useProjectAccess()
  const [tab, setTab] = useState<Tab>('csv')
  const tabs = TABS

  return (
    <div className="space-y-6 pb-16">
      <PageHeader eyebrow="Ajouter des avis" title="Ajouter des avis" description="Trois façons de remplir votre espace. Chaque avis est classé automatiquement dès son arrivée." />

      {!access.isLoading && !access.activeSite ? (
        <EmptyState title="Aucun projet actif" body="Créez un projet pour importer des avis, en saisir ou installer le widget." href="/onboarding" label="Créer un projet" />
      ) : (
        <>
          {access.readOnly
            ? <Banner tone="warn" action={access.isFree ? <Link href="/pricing" className={primaryButton}>Passer à Pro</Link> : undefined}>{access.blockReason}</Banner>
            : access.blockReason && <Banner tone="warn" action={access.isFree ? <Link href="/pricing" className={primaryButton}>Passer à Pro</Link> : undefined}>{access.blockReason}</Banner>}

          <Tabs label="Mode d’ajout" tabs={tabs} value={tab} onChange={setTab} />

          <div role="tabpanel" aria-label={TABS.find((item) => item.id === tab)?.label} className="motion-safe:animate-[qualio-fade_200ms_ease-out]">
            {tab === 'csv' && <CsvPanel />}
            {tab === 'manual' && <ManualPanel />}
            {tab === 'widget' && <WidgetPanel />}
          </div>
        </>
      )}
    </div>
  )
}

function notifyChange(message?: string) {
  window.dispatchEvent(new Event('app:refresh'))
  return message
}

/* ------------------------------------------------------------------ CSV */

function CsvPanel() {
  const access = useProjectAccess()
  const { invalidate } = useInvalidateAll()
  const [analysis, setAnalysis] = useState<CsvAnalysis | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [textCol, setTextCol] = useState(-1)
  const [authorCol, setAuthorCol] = useState(-1)
  const [dateCol, setDateCol] = useState(-1)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const headers = analysis?.headers ?? []
  const split = useMemo(() => splitByContent(analysis?.rows ?? [], textCol, dateCol), [analysis, textCol, dateCol])
  const hasErrors = (analysis?.errors.length ?? 0) > 0
  const blocked = Boolean(access.blockReason) || !access.activeSite
  const remaining = access.site ? Math.max(0, access.site.feedbackLimit - access.site.feedback) : null

  function reset() { setAnalysis(null); setFileName(null) }

  function loadFiles(fileList: FileList | File[] | null | undefined) {
    setStatus(null); setProgress(0)
    const files = Array.from(fileList ?? [])
    if (!files.length) return
    if (files.some((file) => file.size > CSV_MAX_BYTES) || files.reduce((total, file) => total + file.size, 0) > CSV_MAX_BYTES) {
      reset()
      return setStatus({ tone: 'error', text: 'Les fichiers CSV ne doivent pas dépasser 5 Mo au total.' })
    }
    void Promise.all(files.map(async (file) => analyzeCsv(await file.text()))).then((analyses) => {
      const first = analyses[0]
      const firstHeaders = first.headers.map((header) => header.trim().toLowerCase())
      const mismatched = analyses.slice(1).some((result) => result.headers.length !== first.headers.length || result.headers.some((header, index) => header.trim().toLowerCase() !== firstHeaders[index]))
      const invalid = analyses.find((result) => result.errors.length > 0 || !result.headers.length || !result.rows.length)
      if (invalid || mismatched) {
        reset()
        return setStatus({ tone: 'error', text: mismatched ? 'Pour fusionner plusieurs CSV, utilisez la même structure de colonnes dans chaque fichier.' : invalid?.errors[0]?.message ?? 'Les fichiers doivent contenir des avis valides.' })
      }
      const merged = analyzeCsv(toCsv([first.headers, ...analyses.flatMap((result) => result.rows.map((row) => row.cells))]))
      setAnalysis(merged); setFileName(files.length === 1 ? files[0].name : `${files.length} fichiers CSV`)
      setTextCol(merged.detected.text); setAuthorCol(merged.detected.author); setDateCol(merged.detected.date)
    }).catch(() => setStatus({ tone: 'error', text: 'Les fichiers n’ont pas pu être lus.' }))
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault(); setDragging(false)
    if (!blocked) loadFiles(event.dataTransfer.files)
  }

  function downloadSample() {
    const blob = new Blob(['content,author_name,created_at\n"Le parcours est clair",Camille,2026-10-01\n"J’ai besoin de comprendre le prix",Nora,2026-10-02\n"Le support répond vite",Moussa,2026-10-03\n'], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = 'qualio-exemple.csv'; anchor.click()
    URL.revokeObjectURL(url)
  }

  async function importRows() {
    if (!access.activeSite || textCol < 0 || blocked || hasErrors) return
    const body = split.valid.map(({ cells }) => [cells[textCol] ?? '', authorCol >= 0 ? cells[authorCol] ?? '' : '', dateCol >= 0 ? cells[dateCol] ?? '' : ''])
    const skippedEmpty = split.ignored
    if (!body.length) return setStatus({ tone: 'error', text: 'Aucune ligne avec un texte à importer dans la colonne choisie.' })

    setBusy(true); setStatus(null); setProgress(30)
    try {
      const csv = toCsv([['content', 'author_name', 'created_at'], ...body])
      const response = await fetch('/api/feedback/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: access.activeSite.id, csv }) })
      setProgress(100)
      const result = await response.json().catch(() => ({}))
      if (!response.ok) return setStatus({ tone: 'error', text: result.error ?? 'Le fichier n’a pas pu être importé.' })
      const ignored = (result.skipped ?? 0) + skippedEmpty
      const text = result.limitReached
        ? `${result.imported ?? 0} avis importés, ${result.overflow ?? 0} ignorés car la limite de votre plan est atteinte.`
        : `${result.imported ?? 0} avis importés${ignored ? `, ${ignored} ignoré(s)` : ''}.`
      setStatus({ tone: 'ok', text })
      reset()
      await invalidate(); await access.refetchBilling(); notifyChange()
    } catch {
      setStatus({ tone: 'error', text: 'Import impossible pour le moment. Réessayez.' })
    } finally { setBusy(false) }
  }

  return (
    <section className={`${surface} space-y-5 p-5 sm:p-6`} aria-labelledby="csv-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="csv-title" className="text-lg font-semibold text-gray-950 dark:text-white">Importer un fichier CSV</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600 dark:text-zinc-400">Une colonne de texte est obligatoire. Le nom et la date sont facultatifs. UTF-8, virgule ou point-virgule, 5 Mo et 5 000 lignes maximum.</p>
        </div>
        <button type="button" onClick={downloadSample} className={`${secondaryButton} shrink-0`}><ArrowDownTrayIcon className="h-4 w-4" aria-hidden />Modèle CSV</button>
      </div>

      {!fileName && (
        <label
          onDragOver={(event) => { event.preventDefault(); if (!blocked) setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center text-sm transition duration-150 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#c2410c] ${blocked ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-white/10 dark:bg-white/[0.02] dark:text-zinc-600' : dragging ? 'cursor-pointer border-gray-950 bg-gray-100 text-gray-950 dark:border-white dark:bg-white/[0.08] dark:text-white' : 'cursor-pointer border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-500 dark:border-white/15 dark:bg-white/[0.03] dark:text-zinc-300'}`}
        >
          <span className="font-semibold">Glissez votre fichier ici</span>
          <span className="mt-1 text-gray-500 dark:text-zinc-400">ou touchez pour le choisir</span>
          <input type="file" accept=".csv,text/csv" multiple disabled={blocked} onChange={(event) => loadFiles(event.target.files)} className="sr-only" />
        </label>
      )}

      {fileName && analysis && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="min-w-0 font-medium text-gray-900 dark:text-white"><span className="break-all font-mono">{fileName}</span> · <span className="font-mono">{analysis.rows.length}</span> lignes</p>
            <button type="button" onClick={reset} className={`${secondaryButton} min-h-9 px-3 text-xs`}>Choisir un autre fichier</button>
          </div>

          <ColumnPickers headers={headers} textCol={textCol} authorCol={authorCol} dateCol={dateCol} onText={setTextCol} onAuthor={setAuthorCol} onDate={setDateCol} />

          <CsvPreview analysis={analysis} textCol={textCol} authorCol={authorCol} dateCol={dateCol} />

          {progress > 0 && busy && <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Import en cours"><div className="h-full rounded-full bg-gray-950 transition-[width] duration-300 motion-reduce:transition-none dark:bg-white" style={{ width: `${progress}%` }} /></div>}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={() => void importRows()} disabled={busy || blocked || textCol < 0 || hasErrors || split.valid.length === 0} className={primaryButton}>
              {busy ? 'Import en cours…' : `Importer ${split.valid.length} avis`}
            </button>
            {remaining !== null && !blocked && <p className="font-mono text-xs text-gray-500 dark:text-zinc-400">{remaining} avis encore disponibles dans ce projet</p>}
          </div>
        </div>
      )}

      {status && <p role={status.tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border p-3 text-sm ${status.tone === 'error' ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200' : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100'}`}>{status.text}</p>}
      {status?.tone === 'ok' && <SynthesisHint />}
    </section>
  )
}

/* -------------------------------------------------------------- Manuel */

function ManualPanel() {
  const access = useProjectAccess()
  const { invalidate } = useInvalidateAll()
  const today = useMemo(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }), [])
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [date, setDate] = useState(today)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [addedTotal, setAddedTotal] = useState<number | null>(null)
  const blocked = Boolean(access.blockReason) || !access.activeSite

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (blocked || !access.activeSite || !content.trim()) return
    setBusy(true); setStatus(null)
    const response = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: access.activeSite.id, content, authorName, createdAt: date || undefined, source: 'manual' }) })
    const result = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok) return setStatus({ tone: 'error', text: result.error ?? 'Impossible d’enregistrer cet avis.' })
    setAddedTotal((access.site?.feedback ?? 0) + 1)
    setContent(''); setAuthorName(''); setDate(today)
    setStatus({ tone: 'ok', text: 'Avis ajouté.' })
    await invalidate(); await access.refetchBilling(); notifyChange()
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <form onSubmit={submit} className={`${surface} space-y-5 p-5 sm:p-6`} aria-labelledby="manual-title">
        <div>
          <h2 id="manual-title" className="text-lg font-semibold text-gray-950 dark:text-white">Ajouter un avis reçu ailleurs</h2>
          {access.activeSite && <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Projet : {access.activeSite.name || access.activeSite.url || 'sans nom'}</p>}
        </div>
        <label className="block text-sm font-semibold text-gray-800 dark:text-zinc-200">
          Avis
          <textarea value={content} onChange={(event) => setContent(event.target.value)} required maxLength={2000} rows={5} disabled={blocked} placeholder="Collez le texte de l’avis…" className={`${inputClass} mt-2 min-h-32 py-3 text-sm leading-6`} />
          <span className="mt-1 block text-right font-mono text-[11px] font-normal text-gray-500 dark:text-zinc-500">{content.length} / 2000</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-gray-800 dark:text-zinc-200">
            Date de l’avis
            <input type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} disabled={blocked} className={`${inputClass} mt-2 font-mono text-sm`} />
          </label>
          <label className="block text-sm font-semibold text-gray-800 dark:text-zinc-200">
            Nom <span className="font-normal text-gray-500 dark:text-zinc-400">(facultatif)</span>
            <input value={authorName} onChange={(event) => setAuthorName(event.target.value)} maxLength={160} disabled={blocked} className={`${inputClass} mt-2 text-sm`} />
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="submit" disabled={busy || blocked || !content.trim()} className={primaryButton}>{busy ? 'Enregistrement…' : 'Ajouter l’avis'}</button>
          {status && <p role={status.tone === 'error' ? 'alert' : 'status'} className={`text-sm ${status.tone === 'error' ? 'text-red-700 dark:text-red-300' : 'text-emerald-800 dark:text-emerald-300'}`}>{status.text}</p>}
        </div>
        {status?.tone === 'ok' && addedTotal !== null && addedTotal >= 3 && <SynthesisHint />}
      </form>

      <aside className="space-y-3" aria-label="Conseils">
        <Tip title="Import CSV" body="Pour vos avis passés, utilisez l’onglet Fichier CSV : plus rapide pour plusieurs centaines d’avis." />
        <Tip title="Recommandations" body="Dès 3 avis, Qualio peut générer vos premières recommandations sourcées." />
      </aside>
    </div>
  )
}

/* -------------------------------------------------------------- Widget */

type WidgetSource = { id: string; public_key: string; active: boolean; accent_color?: string; position?: string; button_label?: string }

function WidgetPanel() {
  const access = useProjectAccess()
  const site = access.activeSite
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const sourcesQuery = useQuery({
    queryKey: ['feedback-sources', site?.id],
    queryFn: async () => {
      const response = await fetch(`/api/feedback/sources?siteId=${encodeURIComponent(site!.id)}`)
      if (!response.ok) throw new Error('Impossible de charger le widget.')
      return response.json() as Promise<WidgetSource[]>
    },
    enabled: Boolean(site?.id),
  })
  const source = sourcesQuery.data?.[0]
  const [settings, setSettings] = useState({ accentColor: '#ee6018', position: 'right', buttonLabel: 'Laisser un avis' })
  useEffect(() => {
    if (source) setSettings({ accentColor: source.accent_color ?? '#ee6018', position: source.position ?? 'right', buttonLabel: source.button_label ?? 'Laisser un avis' })
  }, [source])

  if (!site) return null

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const script = source ? `<script src="${origin}/widget.js" data-key="${source.public_key}" data-accent="${escapeAttr(settings.accentColor)}" data-position="${settings.position}" data-label="${escapeAttr(settings.buttonLabel)}"></script>` : ''
  const writeBlocked = Boolean(access.blockReason)

  async function action(kind: 'create' | 'disable' | 'enable' | 'regenerate' | 'settings') {
    if (!site) return
    if (kind === 'disable' && !window.confirm('Désactiver le widget ? Les avis déjà reçus restent conservés.')) return
    if (kind === 'regenerate' && !window.confirm('Régénérer la clé ? Le script actuellement installé cessera de fonctionner.')) return
    setBusy(true); setMessage(null)
    const init = kind === 'create'
      ? { method: 'POST', body: { siteId: site.id } }
      : { method: 'PATCH', body: kind === 'settings' ? { siteId: site.id, action: 'settings', ...settings } : { siteId: site.id, action: kind } }
    const response = await fetch('/api/feedback/sources', { method: init.method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(init.body) })
    const result = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok) return setMessage(result.error ?? 'Impossible de modifier le widget.')
    await sourcesQuery.refetch()
    setMessage({ create: 'Widget prêt. Copiez le script sur votre site.', disable: 'Widget désactivé.', enable: 'Widget réactivé.', regenerate: 'Nouvelle clé créée. Copiez le nouveau script.', settings: 'Apparence enregistrée.' }[kind])
  }

  async function copyScript() {
    try { await navigator.clipboard.writeText(script) } catch { return setMessage('La copie automatique a échoué. Sélectionnez le script puis copiez-le.') }
    setCopied(true); window.setTimeout(() => setCopied(false), 2000)
  }

  async function verify() {
    if (!site) return
    setBusy(true)
    const response = await fetch(`/api/feedback?siteId=${encodeURIComponent(site.id)}`)
    const list = await response.json().catch(() => [])
    setBusy(false)
    setMessage(Array.isArray(list) && list.some((item: { source?: string }) => item.source === 'widget') ? 'Installation vérifiée : un avis widget est bien arrivé.' : 'Aucun avis widget reçu pour le moment. Envoyez un avis test depuis votre page.')
  }

  return (
    <section className={`${surface} space-y-5 p-5 sm:p-6`} aria-labelledby="widget-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="widget-title" className="text-lg font-semibold text-gray-950 dark:text-white">Recevoir les prochains avis</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600 dark:text-zinc-400">Collez ce script dans votre site. La clé permet uniquement d’écrire un avis pour ce projet.</p>
        </div>
        {source && <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${source.active ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-zinc-300'}`}>{source.active ? 'Actif' : 'Désactivé'}</span>}
      </div>

      {!source ? (
        <button type="button" onClick={() => void action('create')} disabled={busy || writeBlocked} className={primaryButton}>{busy ? 'Préparation…' : 'Préparer le widget'}</button>
      ) : (
        <>
          <div className="relative overflow-x-auto rounded-xl bg-gray-950 p-4 pr-14 font-mono text-xs leading-6 text-gray-200">
            <code className="whitespace-pre-wrap break-all">{script}</code>
            <button type="button" onClick={() => void copyScript()} aria-label="Copier le script du widget" className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white hover:bg-white/10 ${pressable} ${focusRing}`}>
              {copied ? <CheckIcon className="h-4 w-4" aria-hidden /> : <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />}
            </button>
          </div>

          <div className="grid gap-3 rounded-xl border border-gray-200 p-4 dark:border-white/[0.08] sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">Texte du bouton
              <input value={settings.buttonLabel} maxLength={60} onChange={(event) => setSettings((current) => ({ ...current, buttonLabel: event.target.value }))} className={`${inputClass} mt-2 text-sm`} />
            </label>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">Couleur
              <input type="color" value={settings.accentColor} onChange={(event) => setSettings((current) => ({ ...current, accentColor: event.target.value }))} aria-label="Couleur du widget" className="mt-2 h-11 w-16 cursor-pointer rounded-lg border border-gray-300 bg-white p-1 dark:border-white/15" />
            </label>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">Position
              <Select label="Position" value={settings.position} onChange={(position) => setSettings((current) => ({ ...current, position }))} className="mt-2" buttonClassName={`${selectClass} h-11 w-full`} options={[{ value: 'right', label: 'Droite' }, { value: 'left', label: 'Gauche' }]} />
            </label>
            <button type="button" onClick={() => void action('settings')} disabled={busy || !settings.buttonLabel.trim()} className={`${secondaryButton} sm:col-span-3 sm:justify-self-start`}>Enregistrer l’apparence</button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void verify()} disabled={busy} className={primaryButton}>Vérifier l’installation</button>
            {source.active
              ? <button type="button" onClick={() => void action('disable')} disabled={busy} className={secondaryButton}>Désactiver</button>
              : <button type="button" onClick={() => void action('enable')} disabled={busy || writeBlocked} className={secondaryButton}>Réactiver</button>}
            <button type="button" onClick={() => void action('regenerate')} disabled={busy} className={secondaryButton}>Régénérer la clé</button>
          </div>
        </>
      )}

      {message && <p role="status" className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-white/[0.05] dark:text-zinc-200">{message}</p>}

      <div className="grid gap-3 border-t border-gray-100 pt-5 dark:border-white/[0.06] sm:grid-cols-3">
        <Tip title="HTML simple" body="Ajoutez le script avant la balise de fermeture body, puis rechargez la page." />
        <Tip title="Webflow, WordPress" body="Collez le script dans le code personnalisé du site ou dans un bloc HTML." />
        <Tip title="Shopify" body="Ajoutez le script dans le code du thème, juste avant la balise de fermeture body." />
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- Divers */

function SynthesisHint() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200">
      <span>Dès 3 avis, vous pouvez obtenir vos recommandations.</span>
      <Link href="/dashboard" className={secondaryButton}>Voir les recommandations</Link>
    </div>
  )
}

function Tip({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-white/[0.08] dark:bg-[#181B21]">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1.5 text-xs leading-5 text-gray-500 dark:text-zinc-400">{body}</p>
    </div>
  )
}

function escapeAttr(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)
}
