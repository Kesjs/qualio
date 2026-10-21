'use client'

import { useEffect, useMemo, useState, type DragEvent, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ClipboardDocumentIcon, DocumentArrowUpIcon, LockClosedIcon, SparklesIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import { analyzeCsv, CSV_MAX_BYTES, isCsvFileName, splitByContent, toCsv, type CsvAnalysis } from '@/lib/csv'
import type { PlanId } from '@/lib/billing/plans'
import type { Site } from '@/lib/hooks/useSites'
import { ColumnPickers, CsvPreview } from '@/components/dashboard/CsvPreview'
import { AnimatedThemeToggle } from '@/components/ui/animated-theme-toggle'
import { Banner, btnQuiet, surface } from '@/components/dashboard/weekly/bricks'
import { focusRing, inputClass, PageHeader, pressable, primaryButton, secondaryButton } from '@/components/dashboard/ui'

type Choice = 'import' | 'widget'
type Intent = 'understand_feedback' | 'identify_themes' | 'track_satisfaction' | 'get_recommendations' | 'prepare_reports' | 'connect_sources'
type Status = { tone: 'info' | 'alert'; text: string }
type CopyState = 'idle' | 'copying' | 'copied' | 'error'
type WidgetSource = { id: string; public_key: string }
type OnboardingBilling = { plan: PlanId; label: string; limits: { widget: boolean; projects: number; feedbackPerProject: number } }

/**
 * La progression vit sur le serveur : projet créé → étape 2, méthode choisie → étape 3,
 * clé du widget et nombre d'avis relus depuis l'API. Seul le brouillon nom/URL, avant la création
 * du projet, reste dans le navigateur (il n'existe encore rien à enregistrer côté serveur).
 */
const DRAFT_KEY = 'qualio:onboarding-draft'

async function readJson(response: Response) {
  return response.json().catch(() => ({}))
}

export default function OnboardingPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [projectName, setProjectName] = useState('')
  const [projectUrl, setProjectUrl] = useState('')
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [analysis, setAnalysis] = useState<CsvAnalysis | null>(null)
  const [csvFileName, setCsvFileName] = useState<string | null>(null)
  const [textCol, setTextCol] = useState(-1)
  const [authorCol, setAuthorCol] = useState(-1)
  const [dateCol, setDateCol] = useState(-1)
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState(false)
  const [copyStatus, setCopyStatus] = useState<CopyState>('idle')
  const [promptCopyStatus, setPromptCopyStatus] = useState<CopyState>('idle')
  const [createdSite, setCreatedSite] = useState<Site | null>(null)

  const intentQuery = useQuery({
    queryKey: ['onboarding-intent'],
    queryFn: async () => {
      const response = await fetch('/api/onboarding')
      if (!response.ok) throw new Error('Impossible de charger votre onboarding.')
      return response.json() as Promise<{ intent: Intent | null }>
    },
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const sitesQuery = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await fetch('/api/sites')
      if (!response.ok) throw new Error('Impossible de charger vos projets.')
      return response.json() as Promise<Site[]>
    },
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const sites = sitesQuery.data
  // Le projet à terminer : le plus récent dont l'onboarding n'est pas fini. Aucun → nouveau projet.
  const activeSite = createdSite ?? sites?.find((item) => !item.onboarding_completed_at) ?? null
  const choice: Choice | null = activeSite?.onboarding_method ?? null
  const intent = intentQuery.data?.intent ?? null
  const step = !intent ? 1 : !activeSite ? 2 : !choice ? 3 : 4

  const billingQuery = useQuery({
    queryKey: ['onboarding-billing', activeSite?.id],
    queryFn: async () => {
      const response = await fetch(`/api/billing/status?siteId=${encodeURIComponent(activeSite!.id)}`)
      if (!response.ok) throw new Error('Impossible de charger votre plan.')
      return response.json() as Promise<OnboardingBilling>
    },
    enabled: Boolean(activeSite),
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const widgetAvailable = billingQuery.data?.limits.widget ?? false

  const widgetQuery = useQuery({
    queryKey: ['feedback-sources', activeSite?.id],
    queryFn: async () => {
      const response = await fetch(`/api/feedback/sources?siteId=${encodeURIComponent(activeSite!.id)}`)
      if (!response.ok) throw new Error('Impossible de charger le widget.')
      return response.json() as Promise<WidgetSource[]>
    },
    enabled: Boolean(activeSite) && choice === 'widget',
  })
  const widgetKey = widgetQuery.data?.[0]?.public_key ?? null

  const usageQuery = useQuery({
    queryKey: ['onboarding-usage', activeSite?.id],
    queryFn: async () => {
      const response = await fetch(`/api/billing/status?siteId=${encodeURIComponent(activeSite!.id)}`)
      if (!response.ok) throw new Error('Impossible de charger le projet.')
      return response.json() as Promise<{ site: { feedback: number } | null }>
    },
    enabled: Boolean(activeSite) && choice === 'import',
    staleTime: 0,
  })
  const importedCount = usageQuery.data?.site?.feedback ?? 0

  const split = useMemo(() => splitByContent(analysis?.rows ?? [], textCol, dateCol), [analysis, textCol, dateCol])
  const hasCsvErrors = (analysis?.errors.length ?? 0) > 0

  useEffect(() => {
    try {
      const draft = JSON.parse(window.localStorage.getItem(DRAFT_KEY) ?? 'null') as { projectName?: unknown; projectUrl?: unknown } | null
      if (typeof draft?.projectName === 'string') setProjectName(draft.projectName)
      if (typeof draft?.projectUrl === 'string') setProjectUrl(draft.projectUrl)
    } catch {
      window.localStorage.removeItem(DRAFT_KEY)
    } finally {
      setDraftLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (draftLoaded) window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ projectName, projectUrl }))
  }, [draftLoaded, projectName, projectUrl])

  function saveSite(next: Site) {
    queryClient.setQueryData<Site[]>(['sites'], (current) => current?.some((item) => item.id === next.id) ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...(current ?? [])])
  }

  async function patchSite(target: Site, changes: Record<string, unknown>) {
    const response = await fetch(`/api/sites/${encodeURIComponent(target.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) })
    const result = await readJson(response)
    if (!response.ok) throw new Error(result.error ?? 'Impossible d’enregistrer votre progression.')
    saveSite(result as Site)
    return result as Site
  }

  function fail(error: unknown, fallback: string) {
    setStatus({ tone: 'alert', text: error instanceof Error && error.message ? error.message : fallback })
  }

  async function chooseIntent(next: Intent) {
    setStatus(null); setBusy(true)
    try {
      const response = await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intent: next }) })
      const result = await readJson(response)
      if (!response.ok) throw new Error(result.error ?? 'Impossible d’enregistrer votre objectif.')
      queryClient.setQueryData(['onboarding-intent'], result)
    } catch (error) { fail(error, 'Impossible d’enregistrer votre objectif.') } finally { setBusy(false) }
  }

  async function createProject(event: FormEvent) {
    event.preventDefault(); setStatus(null)
    if (!projectName.trim() && !projectUrl.trim()) return setStatus({ tone: 'alert', text: 'Ajoutez un nom de projet ou une URL.' })
    setBusy(true)
    try {
      const response = await fetch('/api/sites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: projectUrl, name: projectName || undefined }) })
      const result = await readJson(response)
      if (!response.ok) throw new Error(result.error ?? 'Impossible de créer le projet.')
      const site = result as Site
      saveSite(site)
      setCreatedSite(site)
      // Revalider la source serveur garantit que `activeSite` passe bien à l’étape 2,
      // y compris lorsque la query n’avait pas encore de cache exploitable.
      await sitesQuery.refetch()
      window.localStorage.removeItem(DRAFT_KEY)
      setProjectName(''); setProjectUrl('')
    } catch (error) { fail(error, 'Impossible de créer le projet.') } finally { setBusy(false) }
  }

  async function chooseMethod(target: Site, next: Choice) {
    if (next === 'widget' && !widgetAvailable) {
      fail(null, 'La collecte par widget n’est pas disponible pour ce plan. Passez à Pro pour continuer.')
      return
    }
    setStatus(null); setBusy(true)
    try { await patchSite(target, { onboarding_method: next }) } catch (error) { fail(error, 'Impossible d’enregistrer votre méthode de collecte.') } finally { setBusy(false) }
  }

  async function prepareWidget(target: Site) {
    setStatus(null); setBusy(true)
    try {
      const response = await fetch('/api/feedback/sources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: target.id }) })
      const result = await readJson(response)
      if (!response.ok) throw new Error(result.error ?? 'Impossible de préparer le widget.')
      queryClient.setQueryData<WidgetSource[]>(['feedback-sources', target.id], [result as WidgetSource])
    } catch (error) { fail(error, 'Impossible de préparer le widget.') } finally { setBusy(false) }
  }

  function resetCsv() { setAnalysis(null); setCsvFileName(null); setTextCol(-1); setAuthorCol(-1); setDateCol(-1) }

  function selectCsvFile(file: File | null | undefined) {
    setStatus(null)
    if (!file) return
    if (!isCsvFileName(file.name)) { resetCsv(); return setStatus({ tone: 'alert', text: 'Seuls les fichiers .csv sont acceptés.' }) }
    if (file.size > CSV_MAX_BYTES) { resetCsv(); return setStatus({ tone: 'alert', text: 'Le fichier CSV ne doit pas dépasser 5 Mo.' }) }
    void file.text().then((text) => {
      const result = analyzeCsv(text)
      if (!result.headers.length || (!result.rows.length && result.errors.every((issue) => issue.line === null))) {
        resetCsv()
        return setStatus({ tone: 'alert', text: result.errors[0]?.message ?? 'Le fichier doit contenir un en-tête et au moins une ligne.' })
      }
      setAnalysis(result); setCsvFileName(file.name)
      setTextCol(result.detected.text); setAuthorCol(result.detected.author); setDateCol(result.detected.date)
    }).catch(() => setStatus({ tone: 'alert', text: 'Le fichier n’a pas pu être lu.' }))
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault(); setDragging(false)
    selectCsvFile(event.dataTransfer.files?.[0])
  }

  async function importCsv(target: Site) {
    if (!analysis || textCol < 0 || hasCsvErrors || !split.valid.length) return
    setStatus(null); setBusy(true)
    try {
      const rows = split.valid.map(({ cells }) => [cells[textCol] ?? '', authorCol >= 0 ? cells[authorCol] ?? '' : '', dateCol >= 0 ? cells[dateCol] ?? '' : ''])
      const csv = toCsv([['content', 'author_name', 'created_at'], ...rows])
      const response = await fetch('/api/feedback/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: target.id, csv }) })
      const result = await readJson(response)
      if (!response.ok) throw new Error(result.error ?? 'Impossible d’importer ce fichier.')
      const ignored = (result.skipped ?? 0) + split.ignored
      setStatus({ tone: 'info', text: `${result.imported ?? 0} avis importés${ignored ? `, ${ignored} ignoré(s)` : ''}.` })
      resetCsv()
      await usageQuery.refetch()
    } catch (error) { fail(error, 'Impossible d’importer ce fichier.') } finally { setBusy(false) }
  }

  async function addExamples(target: Site) {
    setStatus(null); setBusy(true)
    try {
      const response = await fetch('/api/feedback/examples', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: target.id }) })
      const result = await readJson(response)
      if (!response.ok) throw new Error(result.error ?? 'Impossible de charger les exemples.')
      setStatus({ tone: 'info', text: result.alreadyPresent ? 'Les avis d’exemple sont déjà dans votre projet.' : `${result.imported ?? 15} avis d’exemple ajoutés. Ils seront clairement signalés et supprimables.` })
      await usageQuery.refetch()
    } catch (error) { fail(error, 'Impossible de charger les exemples.') } finally { setBusy(false) }
  }

  async function tryExamples(target: Site) {
    setBusy(true); setStatus(null)
    try { await patchSite(target, { onboarding_method: 'import' }) } catch (error) { setBusy(false); return fail(error, 'Impossible d’enregistrer votre méthode de collecte.') }
    setBusy(false)
    await addExamples(target)
  }

  async function finishOnboarding(target: Site) {
    setBusy(true)
    try {
      await patchSite(target, { onboarding_completed: true })
      window.localStorage.removeItem(DRAFT_KEY)
      router.push('/dashboard')
    } catch (error) { fail(error, 'Impossible de terminer la configuration.'); setBusy(false) }
  }

  async function skipOnboarding() {
    setStatus(null)
    setBusy(true)
    try {
      if (activeSite) {
        await patchSite(activeSite, { onboarding_completed: true })
      } else {
        // Le dashboard nécessite un projet : créer un espace minimal permet de
        // réellement quitter l'onboarding même depuis la toute première étape.
        const response = await fetch('/api/sites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Mon espace' }),
        })
        const result = await readJson(response)
        if (!response.ok) throw new Error(result.error ?? 'Impossible de créer votre espace.')
        const site = await patchSite(result as Site, { onboarding_completed: true })
        saveSite(site)
      }
      window.localStorage.removeItem(DRAFT_KEY)
      router.push('/dashboard')
    } catch (error) {
      fail(error, 'Impossible de passer cette étape.')
    } finally {
      setBusy(false)
    }
  }

  async function generateFirstSynthesis(target: Site) {
    setStatus(null); setBusy(true)
    try {
      const response = await fetch('/api/feedback/synthesis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: target.id }) })
      const result = await readJson(response)
      if (!response.ok) throw new Error(result.error ?? 'Impossible de générer la synthèse.')
    } catch (error) { setBusy(false); return fail(error, 'Impossible de générer la synthèse.') }
    await finishOnboarding(target)
  }

  async function goBack() {
    setStatus(null)
    if (step === 4 && activeSite) {
      setBusy(true)
      try { await patchSite(activeSite, { onboarding_method: null }); resetCsv() } catch (error) { fail(error, 'Impossible de revenir en arrière.') } finally { setBusy(false) }
      return
    }
    router.push('/dashboard')
  }

  function downloadSample() {
    const csv = 'content,author_name,created_at\n"Le parcours est clair, simple et rapide",Camille,2026-10-01\n"J’aimerais recevoir une réponse plus vite",Samir,2026-10-02\n'
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url; link.download = 'qualio-exemple-avis.csv'; link.click()
    URL.revokeObjectURL(url)
  }

  async function copyText(value: string) {
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(value); return } catch { /* repli ci-dessous */ }
    }
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, value.length)
    const copied = document.execCommand('copy')
    textarea.remove()
    if (!copied) throw new Error('Copy command failed')
  }

  const widgetScript = widgetKey ? `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-key="${widgetKey}"></script>` : ''

  async function copyWith(value: string, setState: (state: CopyState) => void, resetAfter: number) {
    setState('copying')
    try { await copyText(value); setState('copied'); window.setTimeout(() => setState('idle'), resetAfter) } catch { setState('error') }
  }

  const agentPrompt = `Tu es mon agent de code. Intègre le widget de collecte d’avis Qualio sur mon site.

Objectif : permettre aux visiteurs de laisser un avis et envoyer les retours dans mon espace Qualio.

Ajoute exactement ce script juste avant la balise </body> :
${widgetScript}

Consignes :
- conserve exactement l’URL du script et la valeur data-key ;
- adapte l’intégration au framework et à la structure existante du projet ;
- ne remplace pas le système de consentement, d’authentification ou de styles existant ;
- vérifie que le widget se charge sur la page publique et que son ouverture fonctionne ;
- indique-moi les fichiers modifiés et les vérifications effectuées.`

  if (sitesQuery.isError && !sites) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-white px-5 dark:bg-black">
        <div className="w-full max-w-md space-y-4">
          <Banner tone="alert">{sitesQuery.error.message}</Banner>
          <button type="button" onClick={() => void sitesQuery.refetch()} className={secondaryButton}>Réessayer</button>
        </div>
      </main>
    )
  }
  if (!draftLoaded || !sitesQuery.isFetchedAfterMount || !intentQuery.isFetchedAfterMount) {
    return <main className="flex min-h-[100dvh] items-center justify-center bg-white dark:bg-black"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 motion-reduce:animate-none dark:border-white/20 dark:border-t-white" aria-label="Chargement" role="status" /></main>
  }

  const title = !intent ? 'Que souhaitez-vous accomplir avec Qualio ?' : !activeSite ? 'Créons votre espace.' : !choice ? 'Comment voulez-vous commencer ?' : choice === 'widget' ? 'Ajoutez les nouveaux avis.' : 'Rassemblez vos avis existants.'
  const description = !intent
    ? 'Choisissez votre objectif principal. Nous adapterons votre première configuration à ce que vous voulez obtenir.'
    : !activeSite
    ? 'Un projet correspond à votre produit ou votre site. Il sert uniquement à regrouper vos avis et vos sources.'
    : !choice
      ? 'Vous pourrez toujours ajouter l’autre source plus tard. L’important est de commencer avec ce que vous avez déjà.'
      : choice === 'widget'
        ? 'Copiez un petit script sur votre site. Les prochains avis arriveront ensuite automatiquement dans Qualio.'
        : 'Importez un fichier CSV pour commencer avec votre historique. Qualio le structurera avant de produire une synthèse.'

  return (
    <main className="min-h-[100dvh] bg-white px-5 py-8 text-gray-950 dark:bg-black dark:text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/90 bg-white p-1.5 shadow-2xs transition-colors dark:border-white/[0.1] dark:bg-black"><img src="/qualio-logo/export/mark/monogram-orange.svg" alt="Qualio" className="h-full w-full object-contain" /></div>
            <div><strong className="block text-sm">Qualio</strong><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-500 dark:text-zinc-400">Première configuration</span></div>
          </div>
          <div className="flex items-center gap-2">
            <AnimatedThemeToggle className="h-9 w-9" />
            <button type="button" onClick={() => void skipOnboarding()} disabled={busy} className={btnQuiet}>Passer pour l’instant</button>
          </div>
        </header>

        <div className="mx-auto mt-10 max-w-3xl space-y-6">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => void goBack()} disabled={step === 1 || busy} aria-label="Revenir à l’étape précédente" title="Revenir à l’étape précédente" className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:border-gray-400 disabled:pointer-events-none disabled:opacity-0 dark:border-white/15 dark:bg-transparent dark:text-zinc-200 dark:hover:border-white/30 ${pressable} ${focusRing}`}><ArrowLeftIcon className="h-5 w-5" aria-hidden /></button>
            <div role="progressbar" aria-label="Progression de la configuration" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} className="flex flex-1 items-center gap-2">
              {[1, 2, 3, 4].map((item) => <div key={item} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none ${item <= step ? 'bg-gray-950 dark:bg-white' : 'bg-gray-200 dark:bg-white/10'}`} />)}
            </div>
          </div>

          <PageHeader eyebrow={`Étape ${step} sur 3`} title={title} description={description} />

          {status && <Banner tone={status.tone}>{status.text}</Banner>}

          {!intent && (
            <section className={`${surface} space-y-4 p-5 sm:p-6`} aria-label="Objectif principal">
              <div className="space-y-3">
                {([
                  ['understand_feedback', 'Comprendre les retours de mes utilisateurs', 'Voir clairement ce que mes utilisateurs pensent.'],
                  ['identify_themes', 'Identifier les thèmes récurrents', 'Repérer les sujets qui reviennent le plus souvent.'],
                  ['track_satisfaction', 'Suivre la satisfaction dans le temps', 'Observer les tendances et leur évolution.'],
                  ['get_recommendations', 'Obtenir des recommandations d’actions', 'Savoir quoi améliorer en priorité.'],
                  ['prepare_reports', 'Préparer un rapport pour mon équipe', 'Partager une synthèse claire et exploitable.'],
                  ['connect_sources', 'Connecter mes sources de feedback', 'Rassembler les retours au même endroit.'],
                ] as const).map(([value, label, body]) => (
                  <button key={value} type="button" onClick={() => void chooseIntent(value)} disabled={busy} className={`${surface} flex w-full items-center justify-between gap-4 p-5 text-left hover:border-gray-400 disabled:opacity-60 dark:hover:border-white/30 ${pressable} ${focusRing}`}>
                    <span><strong className="block text-base font-semibold text-gray-950 dark:text-white">{label}</strong><span className="mt-1 block text-sm text-gray-600 dark:text-zinc-400">{body}</span></span>
                    <span className="h-5 w-5 shrink-0 rounded-full border-2 border-gray-400 dark:border-zinc-500" aria-hidden />
                  </button>
                ))}
              </div>
            </section>
          )}

          {intent && !activeSite && (
            <form onSubmit={createProject} className={`${surface} space-y-4 p-5 sm:p-6`}>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">Nom du projet (facultatif)
                <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Mon produit" className={`${inputClass} mt-2`} />
              </label>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">URL du site (facultative)
                <input value={projectUrl} onChange={(event) => setProjectUrl(event.target.value)} type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="https://mon-site.com ou mon-site.com" className={`${inputClass} mt-2`} />
              </label>
              <button disabled={busy} className={primaryButton}>{busy ? 'Création…' : 'Continuer'}<ArrowRightIcon className="h-4 w-4" aria-hidden /></button>
            </form>
          )}

          {intent && activeSite && !choice && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <ChoiceCard icon={<DocumentArrowUpIcon className="h-5 w-5" aria-hidden />} title="Importer un CSV" body="Retrouvez votre historique et obtenez votre première synthèse en quelques minutes." disabled={busy} onClick={() => void chooseMethod(activeSite, 'import')} />
                {widgetAvailable
                  ? <ChoiceCard icon={<WrenchScrewdriverIcon className="h-5 w-5" aria-hidden />} title="Installer le widget" body="Recevez les prochains avis directement dans Qualio." disabled={busy} onClick={() => void chooseMethod(activeSite, 'widget')} />
                  : <LockedChoiceCard title="Installer le widget" body="Passez à Pro pour recevoir les prochains avis directement dans Qualio." />}
              </div>
              <p className="text-sm text-gray-600 dark:text-zinc-400">Pas d’avis sous la main ? <button type="button" onClick={() => void tryExamples(activeSite)} disabled={busy} className={`font-semibold text-gray-950 underline underline-offset-2 disabled:opacity-50 dark:text-white ${focusRing}`}>Essayer avec des avis d’exemple</button></p>
              {!billingQuery.isLoading && <p className="max-w-full break-words text-sm text-gray-600 dark:text-zinc-400">Plan actif : <strong className="text-gray-950 dark:text-white">{billingQuery.data?.label ?? 'Gratuit'}</strong>.</p>}
            </>
          )}

          {intent && activeSite && choice === 'widget' && !widgetAvailable && (
            <section className={`${surface} space-y-4 p-5 sm:p-6`}>
              <div className="flex items-start gap-4">
                <span className="rounded-xl bg-gray-100 p-3 text-gray-500 dark:bg-white/[0.06] dark:text-zinc-400"><LockClosedIcon className="h-5 w-5" aria-hidden /></span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Widget réservé aux plans payants</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-zinc-400">Le plan actif ne permet pas d’installer le widget. Passez à Pro pour recevoir les prochains avis directement depuis votre site.</p>
                  <Link href="/pricing" className="mt-4 inline-flex text-sm font-semibold text-[#c2410c] underline underline-offset-2">Voir les offres</Link>
                </div>
              </div>
            </section>
          )}

          {intent && activeSite && choice === 'widget' && widgetAvailable && !widgetKey && (
            <section className={`${surface} space-y-5 p-5 sm:p-6`}>
              <div className="flex items-start gap-4">
                <span className="rounded-xl bg-gray-100 p-3 text-gray-700 dark:bg-white/[0.06] dark:text-zinc-200"><SparklesIcon className="h-5 w-5" aria-hidden /></span>
                <div>
                  <h2 className="text-lg font-semibold text-gray-950 dark:text-white">Préparer votre widget</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-zinc-400">Qualio va créer une source sécurisée pour votre projet. Vous recevrez ensuite le script prêt à copier.</p>
                </div>
              </div>
              <button type="button" onClick={() => void prepareWidget(activeSite)} disabled={busy || widgetQuery.isLoading} className={primaryButton}>{busy ? 'Préparation…' : 'Générer mon script'}<ArrowRightIcon className="h-4 w-4" aria-hidden /></button>
            </section>
          )}

          {intent && activeSite && choice === 'widget' && widgetAvailable && widgetKey && (
            <section className={`${surface} space-y-4 p-5 sm:p-6`}>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><CheckIcon className="h-5 w-5" aria-hidden />Source widget prête</div>
              <p className="text-sm leading-6 text-gray-600 dark:text-zinc-400">Collez ce script juste avant la balise <code>&lt;/body&gt;</code> de votre site, ou copiez le prompt pour demander à votre agent de code de l’intégrer.</p>
              <div className="relative overflow-x-auto rounded-xl bg-gray-950 p-4 pr-14 font-mono text-xs leading-6 text-gray-200">
                <code className="whitespace-pre-wrap break-all">{widgetScript}</code>
                <button type="button" onClick={() => void copyWith(widgetScript, setCopyStatus, 2200)} disabled={copyStatus === 'copying'} aria-label={copyStatus === 'copied' ? 'Script copié' : 'Copier le script'} title={copyStatus === 'copied' ? 'Script copié' : 'Copier le script'} className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border ${pressable} ${focusRing} ${copyStatus === 'copied' ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300' : copyStatus === 'error' ? 'border-red-400/40 bg-red-500/15 text-red-300' : 'border-white/10 text-white hover:bg-white/10'}`}>
                  {copyStatus === 'copied' ? <CheckIcon className="h-4 w-4" aria-hidden /> : <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />}
                </button>
              </div>
              <button type="button" onClick={() => void copyWith(agentPrompt, setPromptCopyStatus, 3000)} disabled={promptCopyStatus === 'copying'} className={secondaryButton}>{promptCopyStatus === 'copied' ? 'Prompt copié' : 'Copier le prompt'}<ClipboardDocumentIcon className="h-4 w-4" aria-hidden /></button>
              {copyStatus === 'error' && <p role="alert" className="text-xs text-red-700 dark:text-red-300">La copie automatique est bloquée. Sélectionnez le script manuellement.</p>}
              {copyStatus === 'copied' && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300">Le script est dans votre presse-papiers.</p>}
              {promptCopyStatus === 'error' && <p role="alert" className="text-xs text-red-700 dark:text-red-300">La copie du prompt est bloquée. Vous pouvez le copier manuellement depuis le script ci-dessus.</p>}
              {promptCopyStatus === 'copied' && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300">Le prompt est dans votre presse-papiers. Collez-le dans votre agent de code.</p>}
            </section>
          )}

          {intent && activeSite && choice === 'import' && (
            <section className={`${surface} space-y-5 p-5 sm:p-6`} aria-label="Import CSV">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <p className="max-w-xl text-sm leading-6 text-gray-600 dark:text-zinc-400"><strong className="font-semibold text-gray-950 dark:text-white">Colonnes :</strong> <code>content</code> obligatoire ; <code>author_name</code> et <code>created_at</code> facultatives. Un texte qui contient une virgule doit être entouré de guillemets. UTF-8, virgule ou point-virgule, 5 Mo et 5 000 lignes maximum.</p>
                <button type="button" onClick={downloadSample} className={`${secondaryButton} shrink-0`}>Modèle CSV</button>
              </div>

              {!analysis && (
                <label
                  onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center text-sm transition duration-150 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#c2410c] ${dragging ? 'border-gray-950 bg-gray-100 text-gray-950 dark:border-white dark:bg-white/[0.08] dark:text-white' : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-500 dark:border-white/15 dark:bg-white/[0.03] dark:text-zinc-300'}`}
                >
                  <DocumentArrowUpIcon className="h-7 w-7 text-gray-400 dark:text-zinc-500" aria-hidden />
                  <span className="mt-3 font-semibold">Choisir un fichier CSV</span>
                  <span className="mt-1 text-xs text-gray-500 dark:text-zinc-400">ou le glisser ici · jusqu’à 5 Mo et 5 000 lignes</span>
                  <input type="file" accept=".csv,text/csv" onChange={(event) => { selectCsvFile(event.target.files?.[0]); event.target.value = '' }} className="sr-only" />
                </label>
              )}

              {analysis && csvFileName && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <p className="min-w-0 font-medium text-gray-900 dark:text-white"><span className="break-all font-mono">{csvFileName}</span> · <span className="font-mono">{analysis.rows.length}</span> lignes</p>
                    <button type="button" onClick={resetCsv} className={`${secondaryButton} min-h-9 px-3 text-xs`}>Choisir un autre fichier</button>
                  </div>
                  <ColumnPickers headers={analysis.headers} textCol={textCol} authorCol={authorCol} dateCol={dateCol} onText={setTextCol} onAuthor={setAuthorCol} onDate={setDateCol} />
                  <CsvPreview analysis={analysis} textCol={textCol} authorCol={authorCol} dateCol={dateCol} />
                </div>
              )}

              {busy && <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]" role="progressbar" aria-label="Import en cours"><div className="h-full w-2/3 animate-pulse rounded-full bg-gray-950 motion-reduce:animate-none dark:bg-white" /></div>}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button type="button" onClick={() => void importCsv(activeSite)} disabled={busy || !analysis || textCol < 0 || hasCsvErrors || !split.valid.length} className={primaryButton}>{busy ? 'Import…' : analysis ? `Importer ${split.valid.length} avis` : 'Importer les avis'}<ArrowRightIcon className="h-4 w-4" aria-hidden /></button>
                <button type="button" onClick={() => void addExamples(activeSite)} disabled={busy} className={secondaryButton}>Essayer avec des avis d’exemple</button>
              </div>

              {importedCount >= 3 && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Votre matière est prête : {importedCount} avis.</p>
                  <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">Vous pouvez lancer votre première synthèse maintenant.</p>
                  <button type="button" onClick={() => void generateFirstSynthesis(activeSite)} disabled={busy} className={`${primaryButton} mt-3`}>{busy ? 'Génération…' : 'Générer ma première synthèse'}<SparklesIcon className="h-4 w-4" aria-hidden /></button>
                </div>
              )}
            </section>
          )}

          {step > 2 && (
            <nav aria-label="Navigation de l’onboarding" className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5 dark:border-white/[0.08]">
              <button type="button" onClick={() => void goBack()} disabled={busy} className={secondaryButton}><ArrowLeftIcon className="h-4 w-4" aria-hidden />Retour</button>
              <span className="text-xs text-gray-500 dark:text-zinc-400">Votre progression est enregistrée</span>
              {step === 4 && activeSite && <button type="button" onClick={() => void finishOnboarding(activeSite)} disabled={busy} className={primaryButton}>Ouvrir mon espace<ArrowRightIcon className="h-4 w-4" aria-hidden /></button>}
            </nav>
          )}
        </div>
      </div>
    </main>
  )
}

function ChoiceCard({ icon, title, body, onClick, disabled }: { icon: ReactNode; title: string; body: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${surface} group p-6 text-left hover:border-gray-400 disabled:opacity-60 dark:hover:border-white/30 ${pressable} ${focusRing}`}>
      <span className="inline-flex rounded-xl bg-gray-100 p-3 text-gray-700 dark:bg-white/[0.06] dark:text-zinc-200">{icon}</span>
      <h2 className="mt-5 text-lg font-semibold text-gray-950 dark:text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-400">{body}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-gray-950 dark:text-white">Commencer<ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden /></span>
    </button>
  )
}

function LockedChoiceCard({ title, body }: { title: string; body: string }) {
  return (
    <div className={`${surface} p-6 opacity-75`} aria-disabled="true">
      <div className="flex items-center gap-3">
        <span className="inline-flex rounded-xl bg-gray-100 p-3 text-gray-500 dark:bg-white/[0.06] dark:text-zinc-400"><LockClosedIcon className="h-5 w-5" aria-hidden /></span>
        <h2 className="font-semibold text-gray-950 dark:text-white">{title}</h2>
        <span className="ml-auto rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 dark:bg-white/10 dark:text-zinc-300">Pro / Agence</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-zinc-400">{body}</p>
      <Link href="/pricing" className="mt-4 inline-flex text-sm font-semibold text-[#c2410c] underline underline-offset-2">Voir les offres</Link>
    </div>
  )
}
