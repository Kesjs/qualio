'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ClipboardDocumentIcon, DocumentArrowUpIcon, SparklesIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'

type Choice = 'import' | 'widget'
type Site = { id: string; name: string | null; url: string | null }
type OnboardingDraft = { projectName?: string; projectUrl?: string; choice?: Choice | null; widgetKey?: string | null; importedCount?: number; previewRows?: string[][]; csvFileName?: string | null }
const ONBOARDING_DRAFT_KEY = 'qualio:onboarding-draft'

export default function OnboardingPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [choice, setChoice] = useState<Choice | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectUrl, setProjectUrl] = useState('')
  const [site, setSite] = useState<Site | null>(null)
  const [widgetKey, setWidgetKey] = useState<string | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvFileName, setCsvFileName] = useState<string | null>(null)
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle')
  const [promptCopyStatus, setPromptCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle')
  const [busy, setBusy] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const { data: sites } = useQuery({ queryKey: ['sites'], queryFn: async () => { const response = await fetch('/api/sites'); if (!response.ok) throw new Error(); return response.json() as Promise<Site[]> } })

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as OnboardingDraft
      if (typeof draft.projectName === 'string') setProjectName(draft.projectName)
      if (typeof draft.projectUrl === 'string') setProjectUrl(draft.projectUrl)
      if (draft.choice === 'import' || draft.choice === 'widget') setChoice(draft.choice)
      if (typeof draft.widgetKey === 'string') setWidgetKey(draft.widgetKey)
      if (typeof draft.importedCount === 'number') setImportedCount(draft.importedCount)
      if (Array.isArray(draft.previewRows)) setPreviewRows(draft.previewRows)
      if (typeof draft.csvFileName === 'string') setCsvFileName(draft.csvFileName)
    } catch {
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY)
    } finally {
      setDraftLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!draftLoaded) return
    const draft: OnboardingDraft = { projectName, projectUrl, choice, widgetKey, importedCount, previewRows, csvFileName }
    window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft))
  }, [choice, csvFileName, draftLoaded, importedCount, previewRows, projectName, projectUrl, widgetKey])

  async function createProject(event: React.FormEvent) {
    event.preventDefault(); setStatus(null); if (!projectName.trim() && !projectUrl.trim()) return setStatus('Ajoutez un nom de projet ou une URL.'); setBusy(true)
    try { const response = await fetch('/api/sites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: projectUrl, name: projectName || undefined }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); setSite(result); await queryClient.invalidateQueries({ queryKey: ['sites'] }); setStatus(null) } catch (error) { setStatus(error instanceof Error ? error.message : 'Impossible de créer le projet.') } finally { setBusy(false) }
  }

  async function prepareWidget() { const target = site ?? sites?.[0]; if (!target) return setStatus('Créez d’abord votre projet.'); setBusy(true); const response = await fetch('/api/feedback/sources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: target.id }) }); const result = await response.json(); setBusy(false); if (!response.ok) return setStatus(result.error ?? 'Impossible de préparer le widget.'); setSite(target); setWidgetKey(result.public_key) }
  async function importCsv() { const target = site ?? sites?.[0]; if (!target || !csvFile) return setStatus('Sélectionnez un projet et un fichier CSV.'); setBusy(true); const text = await csvFile.text(); const response = await fetch('/api/feedback/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: target.id, csv: text }) }); const result = await response.json().catch(() => ({})); setBusy(false); if (!response.ok) return setStatus(result.error ?? 'Impossible d’importer ce fichier.'); setImportedCount(result.imported ?? 0); setStatus(`${result.imported} avis importés. ${result.skipped} ligne(s) ignorée(s).`); setSite(target) }
  async function selectCsvFile(file: File | null) { setCsvFile(file); setCsvFileName(file?.name ?? null); setPreviewRows([]); if (!file) return; const text = (await file.text()).replace(/^\uFEFF/, ''); setPreviewRows(text.split(/\r?\n/).filter(Boolean).slice(0, 6).map((line) => line.split(/[,;]/).slice(0, 5))) }
  async function generateFirstSynthesis() { const target = site ?? sites?.[0]; if (!target) return; setBusy(true); const response = await fetch('/api/feedback/synthesis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: target.id }) }); const result = await response.json().catch(() => ({})); setBusy(false); if (!response.ok) return setStatus(result.error ?? 'Impossible de générer la synthèse.'); router.push('/dashboard/syntheses') }
  async function addExamples() { const target = site ?? sites?.[0]; if (!target) return; setBusy(true); const response = await fetch('/api/feedback/examples', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: target.id }) }); const result = await response.json().catch(() => ({})); setBusy(false); if (!response.ok) return setStatus(result.error ?? 'Impossible de charger les exemples.'); setImportedCount(result.imported ?? 15); setStatus(`${result.imported ?? 15} avis d’exemple ajoutés. Ils seront clairement signalés et supprimables.`); setSite(target) }
  function downloadSample() { const csv = 'content,author_name,created_at,source\n"Le parcours est clair",Camille,2026-10-01,import\n"J’aimerais recevoir une réponse plus vite",Samir,2026-10-02,import\n'; const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = 'qualio-exemple-avis.csv'; link.click(); URL.revokeObjectURL(url) }
  async function copyText(value: string) {
    try {
      let copied = false
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(value)
          copied = true
        } catch {
          copied = false
        }
      }
      if (!copied) {
        const textarea = document.createElement('textarea')
        textarea.value = value
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        textarea.setSelectionRange(0, value.length)
        copied = document.execCommand('copy')
        textarea.remove()
        if (!copied) throw new Error('Copy command failed')
      }
    } catch (error) {
      throw error
    }
  }
  async function copyWidgetScript() {
    const script = `<script src="${window.location.origin}/widget.js" data-key="${widgetKey}"></script>`
    setCopyStatus('copying')
    try {
      await copyText(script)
      setCopyStatus('copied')
      window.setTimeout(() => setCopyStatus('idle'), 2200)
    } catch {
      setCopyStatus('error')
    }
  }
  async function copyAgentPrompt() {
    const script = `<script src="${window.location.origin}/widget.js" data-key="${widgetKey}"></script>`
    const prompt = `Tu es mon agent de code. Intègre le widget de collecte d’avis Qualio sur mon site.

Objectif : permettre aux visiteurs de laisser un avis et envoyer les retours dans mon espace Qualio.

Ajoute exactement ce script juste avant la balise </body> :
${script}

Consignes :
- conserve exactement l’URL du script et la valeur data-key ;
- adapte l’intégration au framework et à la structure existante du projet ;
- ne remplace pas le système de consentement, d’authentification ou de styles existant ;
- vérifie que le widget se charge sur la page publique et que son ouverture fonctionne ;
- indique-moi les fichiers modifiés et les vérifications effectuées.`
    setPromptCopyStatus('copying')
    try {
      await copyText(prompt)
      setPromptCopyStatus('copied')
      window.setTimeout(() => setPromptCopyStatus('idle'), 3000)
    } catch {
      setPromptCopyStatus('error')
    }
  }
  function finishOnboarding() { window.localStorage.removeItem(ONBOARDING_DRAFT_KEY); router.push('/dashboard') }
  function goBack() { setStatus(null); if (choice) { setChoice(null); return } router.push('/dashboard') }
  const activeSite = site ?? sites?.[0]
  const step = !activeSite ? 1 : !choice ? 2 : 3

  return <main className="min-h-screen bg-[#fbfbfb] px-5 py-8 text-gray-950 dark:bg-[#0b0c0e] dark:text-white sm:px-8"><div className="mx-auto max-w-5xl"><header className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-950 p-1.5 dark:bg-black"><img src="/qualio-logo/export/mark/monogram-orange.svg" alt="Qualio" className="h-full w-full" /></div><div><strong className="block text-sm">Qualio</strong><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400">Première configuration</span></div></div><button type="button" onClick={() => router.push('/dashboard')} className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">Passer pour l’instant</button></header><div className="mx-auto mt-12 max-w-3xl"><div className="mb-6 flex items-center"><button type="button" onClick={goBack} disabled={step === 1} aria-label="Revenir à l’étape précédente" title="Revenir à l’étape précédente" className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:border-gray-400 hover:text-gray-950 disabled:pointer-events-none disabled:opacity-0 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-white/30 dark:hover:text-white`}><ArrowLeftIcon className="h-5 w-5" /></button></div><div className="mb-8 flex items-center gap-2">{[1, 2, 3].map((item) => <div key={item} className={`h-1.5 flex-1 rounded-full ${item <= step ? 'bg-[#ee6018]' : 'bg-gray-200 dark:bg-white/10'}`} />)}</div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c95720]">Étape {step} sur 3</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-gray-950 dark:text-white">{!activeSite ? 'Créons votre espace.' : !choice ? 'Comment voulez-vous commencer ?' : choice === 'widget' ? 'Ajoutez les nouveaux avis.' : 'Rassemblez vos avis existants.'}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-gray-500 dark:text-zinc-400">{!activeSite ? 'Un projet correspond à votre produit ou votre site. Il sert uniquement à regrouper vos avis et vos sources.' : !choice ? 'Vous pourrez toujours ajouter l’autre source plus tard. L’important est de commencer avec ce que vous avez déjà.' : choice === 'widget' ? 'Copiez un petit script sur votre site. Les prochains avis arriveront ensuite automatiquement dans Qualio.' : 'Importez un fichier CSV pour commencer avec votre historique. Qualio le structurera avant de produire une synthèse.'}</p>{status && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">{status}</p>}

{!activeSite && <form onSubmit={createProject} className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_12px_40px_rgba(17,24,39,.06)] dark:border-white/[0.08] dark:bg-[#16181e]"><label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">Nom du projet (facultatif)<input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Mon produit" className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-[#ee6018] dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /></label><label className="mt-4 block text-xs font-semibold text-gray-700 dark:text-zinc-300">URL du site (facultative)<input value={projectUrl} onChange={(event) => setProjectUrl(event.target.value)} type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="https://mon-site.com ou mon-site.com" className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base outline-none focus:border-[#ee6018] dark:border-white/10 dark:bg-white/[0.04] dark:text-white" /></label><button disabled={busy} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#ee6018] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Création…' : 'Continuer'}<ArrowRightIcon className="h-4 w-4" /></button></form>}

{activeSite && !choice && <div className="mt-10 grid gap-4 md:grid-cols-2"><ChoiceCard icon={<DocumentArrowUpIcon />} title="Importer un CSV" body="Retrouvez votre historique et obtenez votre première synthèse en quelques minutes." onClick={() => { setStatus(null); setChoice('import') }} /><ChoiceCard icon={<WrenchScrewdriverIcon />} title="Installer le widget" body="Recevez les prochains avis directement dans Qualio." onClick={() => { setStatus(null); setChoice('widget') }} /></div>}

{activeSite && choice === 'widget' && !widgetKey && <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.08] dark:bg-[#16181e]"><div className="flex items-start gap-4"><div className="rounded-xl bg-orange-50 p-3 text-[#ee6018] dark:bg-orange-500/10"><SparklesIcon className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold">Préparer votre widget</h2><p className="mt-1 text-sm leading-6 text-gray-500 dark:text-zinc-400">Qualio va créer une source sécurisée pour votre projet. Vous recevrez ensuite le script prêt à copier.</p></div></div><button onClick={prepareWidget} disabled={busy} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ee6018] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Préparation…' : 'Générer mon script'}<ArrowRightIcon className="h-4 w-4" /></button></div>}
{activeSite && choice === 'widget' && widgetKey && <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.08] dark:bg-[#16181e]"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><CheckIcon className="h-5 w-5" />Source widget prête</div><p className="mt-3 text-sm leading-6 text-gray-500 dark:text-zinc-400">Collez ce script juste avant la balise <code>&lt;/body&gt;</code> de votre site, ou copiez le prompt pour demander à votre agent de code de l’intégrer.</p><div className="relative mt-4 overflow-x-auto rounded-xl bg-gray-950 p-4 pr-14 font-mono text-xs leading-6 text-gray-200"><span>{`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-key="${widgetKey}"></script>`}</span><button type="button" onClick={copyWidgetScript} disabled={copyStatus === 'copying'} aria-label={copyStatus === 'copied' ? 'Script copié' : 'Copier le script'} title={copyStatus === 'copied' ? 'Script copié' : 'Copier le script'} className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${copyStatus === 'copied' ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300' : copyStatus === 'error' ? 'border-red-400/40 bg-red-500/15 text-red-300' : 'border-white/10 bg-white/[0.06] text-gray-300 hover:border-white/25 hover:bg-white/10 hover:text-white'}`}><span className="sr-only">{copyStatus === 'copying' ? 'Copie en cours' : copyStatus === 'error' ? 'Réessayer la copie' : copyStatus === 'copied' ? 'Script copié' : 'Copier le script'}</span>{copyStatus === 'copied' ? <CheckIcon className="h-5 w-5" /> : <ClipboardDocumentIcon className="h-5 w-5" />}</button></div><div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={copyAgentPrompt} disabled={promptCopyStatus === 'copying'} className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60 dark:bg-white dark:text-gray-950">{promptCopyStatus === 'copying' ? 'Copie…' : promptCopyStatus === 'copied' ? 'Prompt copié' : 'Copier le prompt'}<ClipboardDocumentIcon className="h-4 w-4" /></button></div>{copyStatus === 'error' && <p className="mt-3 text-xs text-red-700 dark:text-red-300" role="alert">La copie automatique est bloquée. Sélectionnez le script manuellement.</p>}{copyStatus === 'copied' && <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-300" role="status">Le script est dans votre presse-papiers.</p>}{promptCopyStatus === 'error' && <p className="mt-3 text-xs text-red-700 dark:text-red-300" role="alert">La copie du prompt est bloquée. Vous pouvez le copier manuellement depuis le script ci-dessus.</p>}{promptCopyStatus === 'copied' && <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-300" role="status">Le prompt est dans votre presse-papiers. Collez-le dans votre agent de code.</p>}</div>}
{activeSite && choice === 'import' && <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.08] dark:bg-[#16181e]"><p className="text-sm leading-6 text-gray-600 dark:text-zinc-300"><strong>Colonnes :</strong> <code>content</code> obligatoire ; <code>author_name</code>, <code>created_at</code> et <code>source</code> facultatives. CSV UTF-8, virgule ou point-virgule.</p><button type="button" onClick={downloadSample} className="mt-4 text-sm font-semibold text-[#c95720] underline">Télécharger le CSV d’exemple</button><label className="mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 text-center dark:border-white/10 dark:bg-white/[0.03]"><DocumentArrowUpIcon className="h-7 w-7 text-gray-400" /><span className="mt-3 text-sm font-semibold">Choisir un fichier CSV</span><span className="mt-1 text-xs text-gray-500">Jusqu’à 5 Mo et 5 000 lignes.</span><input type="file" accept=".csv,text/csv" onChange={(event) => void selectCsvFile(event.target.files?.[0] ?? null)} className="sr-only" /></label>{csvFileName && <p className="mt-3 text-xs text-gray-500">{csvFileName}{!csvFile && ' — sélectionnez à nouveau le fichier pour l’importer.'}</p>}{previewRows.length > 0 && <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10"><table className="min-w-full text-left text-xs"><tbody>{previewRows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-gray-100 last:border-0 dark:border-white/[0.06]">{row.map((cell, cellIndex) => <td key={cellIndex} className={`px-3 py-2 ${rowIndex === 0 ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-zinc-300'}`}>{cell}</td>)}</tr>)}</tbody></table></div>}{busy && <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10" role="progressbar" aria-label="Import en cours"><div className="h-full w-2/3 animate-pulse rounded-full bg-[#ee6018]" /></div>}<div className="mt-5 flex flex-wrap gap-3"><button onClick={importCsv} disabled={busy || !csvFile} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ee6018] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Import…' : 'Importer les avis'}<ArrowRightIcon className="h-4 w-4" /></button><button type="button" onClick={addExamples} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold dark:border-white/10">Essayer avec des avis d’exemple</button></div>{importedCount >= 3 && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10"><p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Votre matière est prête.</p><p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">Vous pouvez lancer votre première synthèse maintenant.</p><button type="button" onClick={generateFirstSynthesis} disabled={busy} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ee6018] px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Génération…' : 'Générer ma première synthèse'}<SparklesIcon className="h-4 w-4" /></button></div>}</div>}
{step > 1 && <nav aria-label="Navigation de l’onboarding" className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5 dark:border-white/[0.08]"><button type="button" onClick={goBack} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200 dark:hover:border-white/30 dark:hover:text-white"><ArrowLeftIcon className="h-4 w-4" />Retour</button><span className="text-xs text-gray-400 dark:text-zinc-500">Vos informations restent conservées</span>{step === 3 && choice !== 'widget' && <button type="button" onClick={finishOnboarding} className="inline-flex items-center gap-2 rounded-xl bg-[#ee6018] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#d95514]">Ouvrir mon espace<ArrowRightIcon className="h-4 w-4" /></button>}</nav>}
</div></div></main>
}

function ChoiceCard({ icon, title, body, onClick }: { icon: React.ReactNode; title: string; body: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="group rounded-2xl border border-gray-200 bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-[#ee6018]/50 hover:shadow-[0_16px_40px_rgba(17,24,39,.08)] dark:border-white/[0.08] dark:bg-[#16181e]"><span className="inline-flex rounded-xl bg-orange-50 p-3 text-[#ee6018] dark:bg-orange-500/10">{icon}</span><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-500 dark:text-zinc-400">{body}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#c95720]">Commencer<ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" /></span></button> }
