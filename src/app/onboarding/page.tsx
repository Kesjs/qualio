'use client'

import { Suspense, useEffect, useMemo, useState, type DragEvent, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowRightOnRectangleIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  DocumentArrowUpIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/20/solid'
import { analyzeCsv, CSV_MAX_BYTES, isCsvFileName, splitByContent, toCsv, type CsvAnalysis } from '@/lib/csv'
import { analyzePastedReviews, APP_STORE_COUNTRIES, type AppStoreApp } from '@/lib/admin/acquisition-reviews'
import { parseOptionalProjectUrl } from '@/lib/projects/url'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { ONBOARDING_IMPORT_LIMIT, type PlanId } from '@/lib/billing/plans'
import type { Site } from '@/lib/hooks/useSites'
import { ColumnPickers, CsvPreview } from '@/components/dashboard/CsvPreview'
import { LogoutDialog } from '@/components/dashboard/LogoutDialog'
import { Select } from '@/components/dashboard/Select'
import { AnimatedThemeToggle } from '@/components/ui/animated-theme-toggle'
import { Banner, btnQuiet, GeneratingPanel, surface } from '@/components/dashboard/weekly/bricks'
import {
  focusRing,
  inputClass,
  PageHeader,
  pressable,
  primaryButton,
  secondaryButton,
  selectClass,
  Tabs,
} from '@/components/dashboard/ui'

type SourceTab = 'pasted' | 'app_store' | 'csv' | 'widget'
type Status = { tone: 'info' | 'alert'; text: string }
type CopyState = 'idle' | 'copying' | 'copied' | 'error'
type WidgetSource = { id: string; public_key: string }
type OnboardingBilling = {
  plan: PlanId
  label: string
  limits: { widget: boolean; projects: number; feedbackPerProject: number }
  usage: { projects: number }
  site: { feedback: number; feedbackLimit: number } | null
}
type ClaimPreview = {
  found: boolean
  subjectName?: string
  sourceLabel?: string
  reviewCount?: number
  problemCount?: number
  canClaim?: boolean
  planLabel?: string
  projectCount?: number
  projectLimit?: number
}

const DRAFT_KEY_PREFIX = 'qualio:onboarding-draft:'
const SELECTED_SITE_KEY = 'qualio:selected-site'

const APP_STORE_COUNTRY_OPTIONS = APP_STORE_COUNTRIES.map((c) => ({
  value: c.code,
  label: `${c.label} (${c.code.toUpperCase()})`,
}))

async function readJson(response: Response) {
  return response.json().catch(() => ({}))
}

function selectActiveWorkspace(siteId: string) {
  try {
    window.localStorage.setItem(SELECTED_SITE_KEY, siteId)
    window.dispatchEvent(new CustomEvent('qualio:project-changed', { detail: { siteId } }))
  } catch {
    /* stockage navigateur indisponible */
  }
}

function LoadingScreen() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-white dark:bg-black">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 motion-reduce:animate-none dark:border-white/20 dark:border-t-white"
        aria-label="Chargement"
        role="status"
      />
    </main>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <OnboardingFlow />
    </Suspense>
  )
}

function OnboardingFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const reportToken = searchParams.get('report')?.trim() ?? ''
  const requestedSiteId = searchParams.get('siteId')?.trim() ?? ''

  const [dismissedReport, setDismissedReport] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectUrl, setProjectUrl] = useState('')
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [sourceTab, setSourceTab] = useState<SourceTab>('pasted')
  const [logoutOpen, setLogoutOpen] = useState(false)

  // Édition rapide des infos projet à l'étape 2
  const [editingProject, setEditingProject] = useState(false)
  const [editName, setEditName] = useState('')
  const [editUrl, setEditUrl] = useState('')

  // Coller des avis
  const [pastedText, setPastedText] = useState('')
  const pastedAnalysis = useMemo(() => (pastedText.trim() ? analyzePastedReviews(pastedText) : { reviews: [], ignoredShortCount: 0 }), [pastedText])
  const detectedPastedCount = pastedAnalysis.reviews.length
  const ignoredShortPastedCount = pastedAnalysis.ignoredShortCount

  // App Store iOS
  const [appCountry, setAppCountry] = useState('fr')
  const [appQuery, setAppQuery] = useState('')
  const [searchingApps, setSearchingApps] = useState(false)
  const [appResults, setAppResults] = useState<AppStoreApp[]>([])
  const [selectedApp, setSelectedApp] = useState<AppStoreApp | null>(null)

  // CSV
  const [analysis, setAnalysis] = useState<CsvAnalysis | null>(null)
  const [csvFileName, setCsvFileName] = useState<string | null>(null)
  const [textCol, setTextCol] = useState(-1)
  const [authorCol, setAuthorCol] = useState(-1)
  const [dateCol, setDateCol] = useState(-1)
  const [dragging, setDragging] = useState(false)

  // États partagés
  const [status, setStatus] = useState<Status | null>(null)
  const [busy, setBusy] = useState(false)
  const [synthesizing, setSynthesizing] = useState(false)
  const [copyStatus, setCopyStatus] = useState<CopyState>('idle')
  const [promptCopyStatus, setPromptCopyStatus] = useState<CopyState>('idle')
  const [createdSite, setCreatedSite] = useState<Site | null>(null)

  const authUserQuery = useQuery({
    queryKey: ['onboarding-session-user'],
    queryFn: async () => {
      const { data } = await getSupabaseBrowserClient().auth.getUser()
      return data.user ? { id: data.user.id, email: data.user.email ?? null } : null
    },
    staleTime: Infinity,
  })
  const authUser = authUserQuery.data
  const draftKey = authUser?.id ? `${DRAFT_KEY_PREFIX}${authUser.id}` : null

  const claimQuery = useQuery({
    queryKey: ['onboarding-claim-report', reportToken],
    queryFn: async () => {
      const response = await fetch(`/api/onboarding/claim-report?token=${encodeURIComponent(reportToken)}`)
      if (!response.ok) return { found: false } as ClaimPreview
      return response.json() as Promise<ClaimPreview>
    },
    enabled: reportToken.length >= 12 && !dismissedReport,
    staleTime: 60_000,
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
  const activeSite =
    createdSite
    ?? (requestedSiteId ? sites?.find((item) => item.id === requestedSiteId) : undefined)
    ?? sites?.find((item) => !item.onboarding_completed_at)
    ?? null
  const step: 1 | 2 = activeSite ? 2 : 1

  useEffect(() => {
    if (activeSite?.onboarding_method === 'widget') {
      setSourceTab('widget')
    }
  }, [activeSite?.onboarding_method])

  const billingQuery = useQuery({
    queryKey: ['onboarding-billing', activeSite?.id ?? null],
    queryFn: async () => {
      const query = activeSite ? `?siteId=${encodeURIComponent(activeSite.id)}` : ''
      const response = await fetch(`/api/billing/status${query}`)
      if (!response.ok) throw new Error('Impossible de charger votre plan.')
      return response.json() as Promise<OnboardingBilling>
    },
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const widgetAvailable = billingQuery.data?.limits.widget ?? true
  const importedCount = billingQuery.data?.site?.feedback ?? 0
  const feedbackLimit = billingQuery.data?.site?.feedbackLimit ?? billingQuery.data?.limits.feedbackPerProject ?? 50
  const feedbackLimitReached = Boolean(activeSite) && importedCount >= feedbackLimit
  const projectCount = billingQuery.data?.usage?.projects ?? sites?.length ?? 0
  const projectLimit = billingQuery.data?.limits.projects ?? 1
  const hasCompletedSites = Boolean(sites?.some((s) => s.onboarding_completed_at))
  const projectLimitReached = step === 1 && Boolean(billingQuery.data) && projectCount >= projectLimit

  const widgetQuery = useQuery({
    queryKey: ['feedback-sources', activeSite?.id],
    queryFn: async () => {
      const response = await fetch(`/api/feedback/sources?siteId=${encodeURIComponent(activeSite!.id)}`)
      if (!response.ok) throw new Error('Impossible de charger le widget.')
      return response.json() as Promise<WidgetSource[]>
    },
    enabled: Boolean(activeSite) && sourceTab === 'widget' && widgetAvailable,
  })
  const widgetKey = widgetQuery.data?.[0]?.public_key ?? null

  const split = useMemo(() => splitByContent(analysis?.rows ?? [], textCol, dateCol), [analysis, textCol, dateCol])
  const hasCsvErrors = (analysis?.errors.length ?? 0) > 0

  useEffect(() => {
    if (authUserQuery.isPending) return
    if (!draftKey) {
      setDraftLoaded(true)
      return
    }
    try {
      const draft = JSON.parse(window.localStorage.getItem(draftKey) ?? 'null') as { projectName?: unknown; projectUrl?: unknown } | null
      if (typeof draft?.projectName === 'string') setProjectName(draft.projectName)
      if (typeof draft?.projectUrl === 'string') setProjectUrl(draft.projectUrl)
    } catch {
      window.localStorage.removeItem(draftKey)
    } finally {
      setDraftLoaded(true)
    }
  }, [authUserQuery.isPending, draftKey])

  useEffect(() => {
    if (!draftLoaded || !draftKey) return
    if (!projectName.trim() && !projectUrl.trim()) {
      window.localStorage.removeItem(draftKey)
      return
    }
    window.localStorage.setItem(draftKey, JSON.stringify({ projectName, projectUrl }))
  }, [draftLoaded, draftKey, projectName, projectUrl])

  function clearDraft() {
    if (!draftKey) return
    try {
      window.localStorage.removeItem(draftKey)
    } catch {
      /* stockage navigateur indisponible */
    }
  }

  function saveSite(next: Site) {
    queryClient.setQueryData<Site[]>(['sites'], (current) =>
      current?.some((item) => item.id === next.id)
        ? current.map((item) => (item.id === next.id ? next : item))
        : [next, ...(current ?? [])],
    )
    setCreatedSite((current) => (current?.id === next.id ? next : current))
  }

  function applyLocalOnboardingMethod(target: Site, method: 'widget' | 'import') {
    const updated: Site = { ...target, onboarding_method: method }
    saveSite(updated)
    return updated
  }

  async function patchSite(target: Site, changes: Record<string, unknown>) {
    const response = await fetch(`/api/sites/${encodeURIComponent(target.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })
    const result = await readJson(response)
    if (!response.ok) throw new Error(result.error ?? 'Impossible d’enregistrer votre progression.')
    const updated = result as Site
    saveSite(updated)
    return updated
  }

  function fail(error: unknown, fallback: string) {
    setStatus({ tone: 'alert', text: error instanceof Error && error.message ? error.message : fallback })
  }

  async function claimPublicReport() {
    if (!reportToken) return
    setStatus(null)
    setBusy(true)
    try {
      const response = await fetch('/api/onboarding/claim-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: reportToken }),
      })
      const result = await readJson(response)
      if (!response.ok) throw new Error(result.error ?? 'Impossible d’importer ce rapport.')
      const site = result.site as Site
      saveSite(site)
      selectActiveWorkspace(site.id)
      clearDraft()
      router.push('/dashboard')
    } catch (error) {
      fail(error, 'Impossible d’importer ce rapport.')
      setBusy(false)
    }
  }

  async function createProject(event: FormEvent) {
    event.preventDefault()
    setStatus(null)
    const trimmedName = projectName.trim()
    const parsedUrl = parseOptionalProjectUrl(projectUrl)
    if (parsedUrl.error) {
      setStatus({ tone: 'alert', text: parsedUrl.error })
      return
    }
    if (!trimmedName && !parsedUrl.url) {
      setStatus({ tone: 'alert', text: 'Indiquez un nom de produit ou une URL valide.' })
      return
    }
    setBusy(true)
    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: parsedUrl.url ?? undefined, name: trimmedName || undefined }),
      })
      const result = await readJson(response)
      if (!response.ok) throw new Error(result.error ?? 'Impossible de créer le projet.')
      const site = result as Site
      saveSite(site)
      setCreatedSite(site)
      selectActiveWorkspace(site.id)
      if (!appQuery && site.name) setAppQuery(site.name)
      await sitesQuery.refetch()
      clearDraft()
      setProjectName('')
      setProjectUrl('')
    } catch (error) {
      fail(error, 'Impossible de créer le projet.')
    } finally {
      setBusy(false)
    }
  }

  function openProjectEditor(target: Site) {
    setStatus(null)
    setEditName(target.name ?? '')
    setEditUrl(target.url ?? '')
    setEditingProject(true)
  }

  async function saveProjectDetails(event: FormEvent) {
    event.preventDefault()
    if (!activeSite) return
    setStatus(null)
    const trimmedName = editName.trim()
    const parsedUrl = parseOptionalProjectUrl(editUrl)
    if (parsedUrl.error) {
      setStatus({ tone: 'alert', text: parsedUrl.error })
      return
    }
    if (!trimmedName && !parsedUrl.url) {
      setStatus({ tone: 'alert', text: 'Indiquez un nom de produit ou une URL valide.' })
      return
    }
    setBusy(true)
    try {
      await patchSite(activeSite, { name: trimmedName, url: parsedUrl.url })
      setEditingProject(false)
    } catch (error) {
      fail(error, 'Impossible de modifier le projet.')
    } finally {
      setBusy(false)
    }
  }

  async function finishOnboarding(target: Site) {
    setBusy(true)
    try {
      await patchSite(target, { onboarding_completed: true })
      selectActiveWorkspace(target.id)
      clearDraft()
      router.push('/dashboard')
    } catch (error) {
      fail(error, 'Impossible de terminer la configuration.')
      setBusy(false)
    }
  }

  async function runSynthesisAndOpen(target: Site) {
    setSynthesizing(true)
    setBusy(true)
    try {
      const response = await fetch('/api/feedback/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: target.id }),
      })
      const result = await readJson(response)
      if (!response.ok) {
        await billingQuery.refetch()
        setSynthesizing(false)
        setBusy(false)
        setStatus({
          tone: 'alert',
          text: result.error ?? 'Vos avis sont bien importés, mais la synthèse n’a pas pu aboutir immédiatement. Vous pouvez réessayer ou ouvrir votre espace.',
        })
        return
      }
      await finishOnboarding(target)
    } catch (error) {
      await billingQuery.refetch()
      setSynthesizing(false)
      setBusy(false)
      fail(error, 'Impossible de générer la synthèse.')
    }
  }

  async function importPastedAndSynthesize(target: Site) {
    if (feedbackLimitReached) {
      setStatus({ tone: 'alert', text: `La limite de ${feedbackLimit} avis est atteinte pour ce projet. Lancez la synthèse ci-dessus.` })
      return
    }
    if (detectedPastedCount < 3) {
      setStatus({ tone: 'alert', text: 'Collez au moins 3 avis valides séparés par une ligne vide pour lancer la synthèse.' })
      return
    }
    setStatus(null)
    setBusy(true)
    let updatedTarget = target
    try {
      const response = await fetch('/api/onboarding/quick-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: target.id, source: 'pasted', text: pastedText }),
      })
      const result = await readJson(response)
      if (!response.ok) throw new Error(result.error ?? 'Impossible d’importer ces avis.')
      if (result.onboardingMethod === 'import') {
        updatedTarget = applyLocalOnboardingMethod(target, 'import')
      }
      setPastedText('')
    } catch (error) {
      setBusy(false)
      fail(error, 'Impossible d’importer ces avis.')
      return
    }
    await runSynthesisAndOpen(updatedTarget)
  }

  async function searchIosApps(event?: FormEvent) {
    event?.preventDefault()
    if (appQuery.trim().length < 2) {
      setStatus({ tone: 'alert', text: 'Tapez le nom de votre application ou collez son lien App Store.' })
      return
    }
    setStatus(null)
    setSearchingApps(true)
    try {
      const response = await fetch('/api/onboarding/app-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: appQuery.trim(), country: appCountry }),
      })
      const result = await readJson(response)
      if (!response.ok) throw new Error(result.error ?? 'Recherche App Store indisponible.')
      const apps = (result.apps ?? []) as AppStoreApp[]
      setAppResults(apps)
      setSelectedApp(apps[0] ?? null)
      if (apps.length === 0) {
        setStatus({ tone: 'info', text: 'Aucune application trouvée pour cette recherche sur cet App Store.' })
      }
    } catch (error) {
      fail(error, 'Impossible d’interroger l’App Store.')
    } finally {
      setSearchingApps(false)
    }
  }

  async function importAppStoreAndSynthesize(target: Site, app: AppStoreApp) {
    if (feedbackLimitReached) {
      setStatus({ tone: 'alert', text: `La limite de ${feedbackLimit} avis est atteinte pour ce projet. Lancez la synthèse ci-dessus.` })
      return
    }
    setStatus(null)
    setBusy(true)
    let updatedTarget = target
    try {
      const response = await fetch('/api/onboarding/quick-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: target.id, source: 'app_store', appId: app.id, country: appCountry }),
      })
      const result = await readJson(response)
      if (!response.ok) throw new Error(result.error ?? 'Impossible d’importer les avis App Store.')
      if (result.onboardingMethod === 'import') {
        updatedTarget = applyLocalOnboardingMethod(target, 'import')
      }
    } catch (error) {
      setBusy(false)
      fail(error, 'Impossible d’importer les avis App Store.')
      return
    }
    await runSynthesisAndOpen(updatedTarget)
  }

  function resetCsv() {
    setAnalysis(null)
    setCsvFileName(null)
    setTextCol(-1)
    setAuthorCol(-1)
    setDateCol(-1)
  }

  function selectCsvFile(file: File | null | undefined) {
    setStatus(null)
    if (!file) return
    if (!isCsvFileName(file.name)) {
      resetCsv()
      setStatus({ tone: 'alert', text: 'Seuls les fichiers .csv sont acceptés.' })
      return
    }
    if (file.size > CSV_MAX_BYTES) {
      resetCsv()
      setStatus({ tone: 'alert', text: 'Le fichier CSV ne doit pas dépasser 5 Mo.' })
      return
    }
    void file
      .text()
      .then((text) => {
        const result = analyzeCsv(text)
        if (!result.headers.length || (!result.rows.length && result.errors.every((issue) => issue.line === null))) {
          resetCsv()
          setStatus({ tone: 'alert', text: result.errors[0]?.message ?? 'Le fichier doit contenir un en-tête et au moins une ligne.' })
          return
        }
        setAnalysis(result)
        setCsvFileName(file.name)
        setTextCol(result.detected.text)
        setAuthorCol(result.detected.author)
        setDateCol(result.detected.date)
      })
      .catch(() => setStatus({ tone: 'alert', text: 'Le fichier n’a pas pu être lu.' }))
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    selectCsvFile(event.dataTransfer.files?.[0])
  }

  async function importCsvAndSynthesize(target: Site) {
    if (feedbackLimitReached) {
      setStatus({ tone: 'alert', text: `La limite de ${feedbackLimit} avis est atteinte pour ce projet. Lancez la synthèse ci-dessus.` })
      return
    }
    if (!analysis || textCol < 0 || hasCsvErrors || !split.valid.length) return
    setStatus(null)
    setBusy(true)
    let importedTotal = 0
    let updatedTarget = target
    try {
      const rows = split.valid.map(({ cells }) => [
        cells[textCol] ?? '',
        authorCol >= 0 ? cells[authorCol] ?? '' : '',
        dateCol >= 0 ? cells[dateCol] ?? '' : '',
      ])
      const csv = toCsv([['content', 'author_name', 'created_at'], ...rows])
      const response = await fetch('/api/feedback/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: target.id, csv, onboarding: true }),
      })
      const result = await readJson(response)
      if (!response.ok) throw new Error(result.error ?? 'Impossible d’importer ce fichier.')
      importedTotal = Number(result.imported ?? 0)
      resetCsv()
      updatedTarget = await patchSite(target, { onboarding_method: 'import' })
    } catch (error) {
      setBusy(false)
      fail(error, 'Impossible d’importer ce fichier.')
      return
    }

    if (importedTotal + importedCount >= 3) {
      await runSynthesisAndOpen(updatedTarget)
    } else {
      await billingQuery.refetch()
      setBusy(false)
      setStatus({ tone: 'info', text: `${importedTotal} avis importé(s). Ajoutez au moins 3 avis pour lancer la synthèse.` })
    }
  }

  async function tryExamplesAndSynthesize(target: Site) {
    if (feedbackLimitReached) {
      setStatus({ tone: 'alert', text: `La limite de ${feedbackLimit} avis est atteinte pour ce projet. Lancez la synthèse ci-dessus.` })
      return
    }
    setStatus(null)
    setBusy(true)
    let updatedTarget = target
    try {
      const response = await fetch('/api/feedback/examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: target.id }),
      })
      const result = await readJson(response)
      if (!response.ok) throw new Error(result.error ?? 'Impossible de charger les exemples.')
      updatedTarget = await patchSite(target, { onboarding_method: 'import' })
    } catch (error) {
      setBusy(false)
      fail(error, 'Impossible de charger les exemples.')
      return
    }
    await runSynthesisAndOpen(updatedTarget)
  }

  async function prepareWidget(target: Site) {
    setStatus(null)
    setBusy(true)
    try {
      await patchSite(target, { onboarding_method: 'widget' })
      const response = await fetch('/api/feedback/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: target.id }),
      })
      const result = await readJson(response)
      if (!response.ok) throw new Error(result.error ?? 'Impossible de préparer le widget.')
      queryClient.setQueryData<WidgetSource[]>(['feedback-sources', target.id], [result as WidgetSource])
    } catch (error) {
      fail(error, 'Impossible de préparer le widget.')
    } finally {
      setBusy(false)
    }
  }

  async function skipOnboarding() {
    setStatus(null)
    setBusy(true)
    try {
      if (activeSite) {
        await patchSite(activeSite, { onboarding_completed: true })
        selectActiveWorkspace(activeSite.id)
      } else if (projectLimitReached || hasCompletedSites) {
        clearDraft()
        router.push('/dashboard')
        return
      } else {
        const trimmedName = projectName.trim()
        const parsedUrl = parseOptionalProjectUrl(projectUrl)
        const response = await fetch('/api/sites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName || (!parsedUrl.url ? 'Mon espace' : undefined),
            url: parsedUrl.url ?? undefined,
            completeOnboarding: true,
          }),
        })
        const result = await readJson(response)
        if (!response.ok) throw new Error(result.error ?? 'Impossible de créer votre espace.')
        const site = result as Site
        saveSite(site)
        selectActiveWorkspace(site.id)
      }
      clearDraft()
      router.push('/dashboard')
    } catch (error) {
      fail(error, 'Impossible de passer cette étape.')
    } finally {
      setBusy(false)
    }
  }

  function downloadSample() {
    const csv =
      'content,author_name,created_at\n"Le parcours est clair, simple et rapide",Camille,2026-10-01\n"J’aimerais recevoir une réponse plus vite",Samir,2026-10-02\n"Impossible de télécharger ma facture en PDF sur mobile",Léa,2026-10-03\n'
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'qualio-exemple-avis.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function copyText(value: string) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value)
        return
      } catch {
        /* repli ci-dessous */
      }
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

  const widgetScript = widgetKey
    ? `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" data-key="${widgetKey}"></script>`
    : ''

  async function copyWith(value: string, setState: (state: CopyState) => void, resetAfter: number) {
    setState('copying')
    try {
      await copyText(value)
      setState('copied')
      window.setTimeout(() => setState('idle'), resetAfter)
    } catch {
      setState('error')
    }
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
          <button type="button" onClick={() => void sitesQuery.refetch()} className={secondaryButton}>
            Réessayer
          </button>
        </div>
      </main>
    )
  }

  if (authUserQuery.isPending || !draftLoaded || !sitesQuery.isFetchedAfterMount || (!billingQuery.data && !billingQuery.isError)) {
    return <LoadingScreen />
  }

  const showClaimBanner = Boolean(reportToken && !dismissedReport && claimQuery.data?.found)
  const claimBlocked = showClaimBanner && claimQuery.data?.canClaim === false
  const title = step === 1 ? 'Nommez votre espace de travail.' : 'Importez vos premiers retours.'
  const description =
    step === 1
      ? 'Un projet regroupe les avis d’un produit, d’une boutique ou d’un client. Trente secondes suffisent pour obtenir votre première synthèse.'
      : `Collez quelques avis, cherchez votre app iOS ou déposez un CSV pour générer les 3 premières priorités de ${activeSite?.name || activeSite?.url || 'votre projet'}.`

  return (
    <main className="min-h-[100dvh] bg-white px-5 py-8 text-gray-950 dark:bg-black dark:text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/90 bg-white p-1.5 shadow-2xs transition-colors dark:border-white/[0.1] dark:bg-black">
              <img src="/qualio-logo/export/mark/monogram-orange.svg" alt="Qualio" className="h-full w-full object-contain" />
            </div>
            <div>
              <strong className="block text-sm">Qualio</strong>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-gray-500 dark:text-zinc-400">
                Démarrage rapide
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {authUser?.email && (
              <span
                className="hidden max-w-[200px] truncate text-xs text-gray-500 dark:text-zinc-400 md:inline"
                title={authUser.email}
              >
                {authUser.email}
              </span>
            )}
            <AnimatedThemeToggle className="h-9 w-9" />
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              disabled={busy}
              title="Se déconnecter"
              className={btnQuiet}
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
            <button type="button" onClick={() => void skipOnboarding()} disabled={busy} className={btnQuiet}>
              Passer pour l’instant
            </button>
          </div>
        </header>

        <div className="mx-auto mt-10 max-w-3xl space-y-6">
          {/* Pont 1-clic depuis /rapport/[token] ou le mini-audit de la landing */}
          {showClaimBanner && claimQuery.data && (
            <section
              className="rounded-2xl border border-[#fed7aa] bg-[#fffaf6] p-5 sm:p-6 dark:border-orange-500/30 dark:bg-[#1C1613]"
              aria-label="Rapport prêt à importer"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c2410c] dark:text-orange-300">
                    Rapport déjà analysé
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-gray-950 dark:text-white">
                    {claimQuery.data.subjectName} ·{' '}
                    <span className="font-mono tabular-nums">{claimQuery.data.reviewCount ?? 0}</span> avis {claimQuery.data.sourceLabel}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-zinc-300">
                    {claimBlocked ? (
                      <>
                        Votre plan {claimQuery.data.planLabel ?? 'actuel'} autorise {claimQuery.data.projectLimit ?? 1} projet
                        {(claimQuery.data.projectLimit ?? 1) > 1 ? 's' : ''}. Ouvrez votre espace existant ou changez d’offre pour importer ce rapport.
                      </>
                    ) : (
                      <>
                        Ouvrez directement votre espace avec cette synthèse et ses{' '}
                        <span className="font-mono font-semibold tabular-nums">{claimQuery.data.problemCount ?? 3}</span> actions prioritaires pré-chargées.
                      </>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  {claimBlocked ? (
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => router.push('/dashboard')} className={primaryButton}>
                        Ouvrir mon espace
                        <ArrowRightIcon className="h-4 w-4" aria-hidden />
                      </button>
                      <Link href="/pricing" className={secondaryButton}>
                        Voir les offres
                      </Link>
                    </div>
                  ) : (
                    <button type="button" onClick={() => void claimPublicReport()} disabled={busy} className={primaryButton}>
                      {busy ? 'Ouverture…' : 'Ouvrir ce rapport dans mon espace'}
                      <ArrowRightIcon className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDismissedReport(true)}
                    disabled={busy}
                    className="text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
                  >
                    {claimBlocked ? 'Masquer cet aperçu' : 'Créer un autre projet à la place'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Barre de progression en 2 étapes */}
          <div className="flex items-center gap-4">
            {hasCompletedSites && (
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                disabled={busy}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:border-gray-400 disabled:opacity-40 dark:border-white/15 dark:bg-transparent dark:text-zinc-200 dark:hover:border-white/30 ${pressable} ${focusRing}`}
              >
                <ArrowLeftIcon className="h-4 w-4" aria-hidden />
                Tableau de bord
              </button>
            )}
            <div
              role="progressbar"
              aria-label="Progression de la configuration"
              aria-valuemin={1}
              aria-valuemax={2}
              aria-valuenow={step}
              className="flex flex-1 items-center gap-2"
            >
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none ${
                    item <= step ? 'bg-gray-950 dark:bg-white' : 'bg-gray-200 dark:bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>

          <PageHeader eyebrow={`Étape ${step} sur 2`} title={title} description={description} />

          {status && <Banner tone={status.tone}>{status.text}</Banner>}

          {synthesizing && <GeneratingPanel />}

          {/* ÉTAPE 1 : Créer l'espace */}
          {step === 1 && projectLimitReached && (
            <section className={`${surface} space-y-4 p-6 sm:p-8`} aria-label="Limite de projets atteinte">
              <h2 className="text-lg font-semibold text-gray-950 dark:text-white">
                Limite de projets atteinte ({projectCount}/{projectLimit})
              </h2>
              <p className="max-w-xl text-sm leading-6 text-gray-600 dark:text-zinc-400">
                Votre plan {billingQuery.data?.label ?? 'Gratuit'} autorise {projectLimit} projet{projectLimit > 1 ? 's' : ''}. Retrouvez votre espace existant sur le tableau de bord ou passez à une offre supérieure pour gérer plusieurs projets.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <button type="button" onClick={() => router.push('/dashboard')} className={primaryButton}>
                  Ouvrir mon tableau de bord
                  <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </button>
                <Link href="/pricing" className={secondaryButton}>
                  Voir les offres
                </Link>
              </div>
            </section>
          )}

          {step === 1 && !projectLimitReached && (
            <form onSubmit={createProject} className={`${surface} space-y-5 p-5 sm:p-6`}>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Nom du produit, de la boutique ou du client
                <input
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Ex. Mon application, Boutique Alma…"
                  className={`${inputClass} mt-2`}
                />
              </label>
              <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                URL du site (facultative)
                <input
                  value={projectUrl}
                  onChange={(event) => setProjectUrl(event.target.value)}
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="https://mon-site.com"
                  className={`${inputClass} mt-2`}
                />
                <span className="mt-1.5 block font-normal text-gray-500 dark:text-zinc-400">
                  Vous pouvez saisir simplement le domaine (ex. mon-site.com).
                </span>
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button disabled={busy} className={primaryButton}>
                  {busy ? 'Création…' : 'Continuer vers mes avis'}
                  <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </button>
                <span className="text-xs text-gray-500 dark:text-zinc-400">
                  Indiquez un nom ou une URL · modifiable à tout moment
                </span>
              </div>
            </form>
          )}

          {/* ÉTAPE 2 : Importer ou connecter ses premiers retours */}
          {step === 2 && activeSite && !synthesizing && (
            <div className="space-y-5">
              {/* Récupération immédiate si des avis ont déjà été importés dans ce projet */}
              {importedCount >= 3 && (
                <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-500/25 dark:bg-emerald-500/10">
                  <div>
                    <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
                      {feedbackLimitReached
                        ? `Limite atteinte : ${importedCount} / ${feedbackLimit} avis déjà enregistrés.`
                        : `${importedCount} avis déjà présents dans ce projet.`}
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-800 dark:text-emerald-300">
                      Lancez la synthèse maintenant pour générer vos priorités ou ouvrez directement votre espace.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void runSynthesisAndOpen(activeSite)} disabled={busy} className={primaryButton}>
                      <SparklesIcon className="h-4 w-4" aria-hidden />
                      Générer ma synthèse
                    </button>
                    <button type="button" onClick={() => void finishOnboarding(activeSite)} disabled={busy} className={secondaryButton}>
                      Ouvrir mon espace
                    </button>
                  </div>
                </div>
              )}

              <section className={`${surface} space-y-6 p-5 sm:p-6`} aria-label="Premiers retours">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-4 dark:border-white/[0.08]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-950 dark:text-white">
                      {activeSite.name || activeSite.url || 'Mon produit'}
                    </p>
                    {activeSite.url && activeSite.name && (
                      <p className="truncate text-xs text-gray-500 dark:text-zinc-400">{activeSite.url}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => (editingProject ? setEditingProject(false) : openProjectEditor(activeSite))}
                    disabled={busy}
                    className={`${btnQuiet} text-xs`}
                  >
                    <PencilSquareIcon className="h-4 w-4" aria-hidden />
                    {editingProject ? 'Fermer' : 'Modifier nom ou URL'}
                  </button>
                </div>

                {editingProject && (
                  <form
                    onSubmit={(event) => void saveProjectDetails(event)}
                    className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end dark:border-white/[0.08] dark:bg-white/[0.03]"
                  >
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                      Nom du projet
                      <input
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        placeholder="Ex. Mon application"
                        className={`${inputClass} mt-1.5`}
                      />
                    </label>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                      URL du site (facultative)
                      <input
                        value={editUrl}
                        onChange={(event) => setEditUrl(event.target.value)}
                        type="text"
                        inputMode="url"
                        autoCapitalize="none"
                        autoCorrect="off"
                        placeholder="https://mon-site.com"
                        className={`${inputClass} mt-1.5`}
                      />
                    </label>
                    <button type="submit" disabled={busy} className={primaryButton}>
                      Enregistrer
                    </button>
                  </form>
                )}

                <Tabs<SourceTab>
                  label="Méthode d’ajout des avis"
                  value={sourceTab}
                  onChange={(next) => {
                    setStatus(null)
                    setSourceTab(next)
                  }}
                  tabs={[
                    { id: 'pasted', label: 'Coller des avis (20 s)' },
                    { id: 'app_store', label: 'App Store iOS (1 clic)' },
                    { id: 'csv', label: 'Fichier CSV' },
                    { id: 'widget', label: 'Widget sur mon site', locked: !widgetAvailable },
                  ]}
                />

                {/* ONGLET 1 : COLLER DES AVIS */}
                {sourceTab === 'pasted' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="max-w-xl text-sm leading-6 text-gray-600 dark:text-zinc-400">
                        Copiez-collez vos derniers avis Trustpilot, Google, G2, Capterra ou tickets support en les séparant par une{' '}
                        <strong className="font-semibold text-gray-900 dark:text-white">ligne vide</strong>.
                      </p>
                      <span className="font-mono text-xs font-semibold tabular-nums text-gray-600 dark:text-zinc-300">
                        {detectedPastedCount} avis détecté{detectedPastedCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    <textarea
                      value={pastedText}
                      onChange={(event) => setPastedText(event.target.value)}
                      rows={7}
                      placeholder={`Exemple :\n\nImpossible de télécharger mes factures PDF depuis la mise à jour mobile, je dois passer sur ordinateur à chaque fois.\n\nLe support répond vite mais l’export comptable plante dès qu’on dépasse 200 lignes.\n\nTrès bon outil au quotidien, il manque juste un filtre par date sur le tableau principal.`}
                      className="w-full rounded-xl border border-gray-300 bg-white p-3.5 text-sm leading-6 text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-900 dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:focus:border-white/45"
                    />

                    {ignoredShortPastedCount > 0 && (
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {ignoredShortPastedCount} bloc{ignoredShortPastedCount > 1 ? 's' : ''} ignoré{ignoredShortPastedCount > 1 ? 's' : ''} (moins de 15 caractères). Séparez chaque avis complet par une ligne vide.
                      </p>
                    )}

                    {detectedPastedCount > ONBOARDING_IMPORT_LIMIT && (
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        Les {ONBOARDING_IMPORT_LIMIT} premiers avis seront importés maintenant afin de garder de la capacité pour la suite.
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void importPastedAndSynthesize(activeSite)}
                        disabled={busy || feedbackLimitReached || detectedPastedCount < 3}
                        className={primaryButton}
                      >
                        <SparklesIcon className="h-4 w-4" aria-hidden />
                        {feedbackLimitReached
                          ? `Limite de ${feedbackLimit} avis atteinte`
                          : detectedPastedCount > ONBOARDING_IMPORT_LIMIT
                            ? `Analyser les ${ONBOARDING_IMPORT_LIMIT} premiers avis`
                            : detectedPastedCount >= 3
                              ? `Analyser ces ${detectedPastedCount} avis`
                              : 'Collez au moins 3 avis'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void tryExamplesAndSynthesize(activeSite)}
                        disabled={busy || feedbackLimitReached}
                        className={secondaryButton}
                      >
                        Essayer avec {ONBOARDING_IMPORT_LIMIT} avis d’exemple
                      </button>
                    </div>
                  </div>
                )}

                {/* ONGLET 2 : APP STORE iOS */}
                {sourceTab === 'app_store' && (
                  <div className="space-y-4">
                    <p className="max-w-xl text-sm leading-6 text-gray-600 dark:text-zinc-400">
                      Cherchez une application iOS publique ou collez son lien <code>apps.apple.com</code> : Qualio importe jusqu’à {ONBOARDING_IMPORT_LIMIT} avis écrits récents et génère votre synthèse immédiatement, tout en gardant de la capacité pour vos prochains retours.
                    </p>

                    <form onSubmit={(e) => void searchIosApps(e)} className="flex flex-col gap-2.5 sm:flex-row">
                      <Select
                        label="Pays de l’App Store"
                        value={appCountry}
                        onChange={setAppCountry}
                        options={APP_STORE_COUNTRY_OPTIONS}
                        disabled={searchingApps || busy}
                        className="w-full sm:w-48 sm:shrink-0"
                        buttonClassName={`${selectClass} !min-h-11 w-full`}
                        listClassName="min-w-[210px]"
                      />
                      <input
                        value={appQuery}
                        onChange={(e) => setAppQuery(e.target.value)}
                        placeholder="Nom de l’app (ex. Qonto, Pennylane…) ou lien App Store"
                        className={`${inputClass} flex-1`}
                      />
                      <button type="submit" disabled={searchingApps || busy} className={secondaryButton}>
                        <MagnifyingGlassIcon className="h-4 w-4" aria-hidden />
                        {searchingApps ? 'Recherche…' : 'Chercher'}
                      </button>
                    </form>

                    {feedbackLimitReached && appResults.length > 0 && (
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Limite de {feedbackLimit} avis atteinte pour ce projet : lancez « Générer ma synthèse » ci-dessus.
                      </p>
                    )}

                    {appResults.length > 0 && (
                      <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-white/[0.08] dark:border-white/[0.08]">
                        {appResults.map((app) => {
                          const isSelected = selectedApp?.id === app.id
                          return (
                            <li key={app.id} className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                              <button
                                type="button"
                                onClick={() => setSelectedApp(app)}
                                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                              >
                                {app.icon ? (
                                  <img src={app.icon} alt="" className="h-10 w-10 shrink-0 rounded-xl border border-gray-200 dark:border-white/10" />
                                ) : (
                                  <span className="h-10 w-10 shrink-0 rounded-xl bg-gray-100 dark:bg-white/10" />
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-gray-950 dark:text-white">{app.name}</p>
                                  <p className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                                    <span className="truncate">{app.seller}</span>
                                    {app.rating != null && (
                                      <span className="inline-flex items-center gap-0.5 font-mono tabular-nums">
                                        <StarIcon className="h-3.5 w-3.5 text-[#ee6018]" aria-hidden />
                                        {app.rating.toFixed(1)}
                                      </span>
                                    )}
                                    {app.ratingCount != null && (
                                      <span className="font-mono tabular-nums">{app.ratingCount.toLocaleString('fr-FR')} notes</span>
                                    )}
                                  </p>
                                </div>
                              </button>
                              <button
                                type="button"
                                onClick={() => void importAppStoreAndSynthesize(activeSite, app)}
                                disabled={busy || feedbackLimitReached}
                                className={isSelected ? primaryButton : secondaryButton}
                              >
                                <SparklesIcon className="h-4 w-4" aria-hidden />
                                {feedbackLimitReached ? 'Limite atteinte' : 'Importer et analyser'}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}

                {/* ONGLET 3 : FICHIER CSV */}
                {sourceTab === 'csv' && (
                  <div className="space-y-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <p className="max-w-xl text-sm leading-6 text-gray-600 dark:text-zinc-400">
                        <strong className="font-semibold text-gray-950 dark:text-white">Colonnes :</strong> <code>content</code> obligatoire ;{' '}
                        <code>author_name</code> et <code>created_at</code> facultatives. UTF-8, virgule ou point-virgule, jusqu’à 5 Mo.
                      </p>
                      <button type="button" onClick={downloadSample} className={`${secondaryButton} shrink-0`}>
                        Modèle CSV
                      </button>
                    </div>

                    {!analysis && (
                      <label
                        onDragOver={(event) => {
                          event.preventDefault()
                          setDragging(true)
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={onDrop}
                        className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center text-sm transition duration-150 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#c2410c] ${
                          dragging
                            ? 'border-gray-950 bg-gray-100 text-gray-950 dark:border-white dark:bg-white/[0.08] dark:text-white'
                            : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-500 dark:border-white/15 dark:bg-white/[0.03] dark:text-zinc-300'
                        }`}
                      >
                        <DocumentArrowUpIcon className="h-7 w-7 text-gray-400 dark:text-zinc-500" aria-hidden />
                        <span className="mt-3 font-semibold">Choisir un fichier CSV</span>
                        <span className="mt-1 text-xs text-gray-500 dark:text-zinc-400">ou le glisser ici · jusqu’à 5 Mo et 5 000 lignes</span>
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={(event) => {
                            selectCsvFile(event.target.files?.[0])
                            event.target.value = ''
                          }}
                          className="sr-only"
                        />
                      </label>
                    )}

                    {analysis && csvFileName && (
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <p className="min-w-0 font-medium text-gray-900 dark:text-white">
                            <span className="break-all font-mono">{csvFileName}</span> ·{' '}
                            <span className="font-mono tabular-nums">{analysis.rows.length}</span> lignes
                          </p>
                          <button type="button" onClick={resetCsv} className={`${secondaryButton} min-h-9 px-3 text-xs`}>
                            Choisir un autre fichier
                          </button>
                        </div>
                        <ColumnPickers
                          headers={analysis.headers}
                          textCol={textCol}
                          authorCol={authorCol}
                          dateCol={dateCol}
                          onText={setTextCol}
                          onAuthor={setAuthorCol}
                          onDate={setDateCol}
                        />
                        <CsvPreview analysis={analysis} textCol={textCol} authorCol={authorCol} dateCol={dateCol} />
                      </div>
                    )}

                    {analysis && split.valid.length > ONBOARDING_IMPORT_LIMIT && (
                      <p className="text-xs text-gray-500 dark:text-zinc-400">
                        Les {ONBOARDING_IMPORT_LIMIT} premiers avis seront importés maintenant pour démarrer vite (vous pourrez ajouter les suivants depuis « Ajouter des avis »).
                      </p>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => void importCsvAndSynthesize(activeSite)}
                        disabled={busy || feedbackLimitReached || !analysis || textCol < 0 || hasCsvErrors || !split.valid.length}
                        className={primaryButton}
                      >
                        <SparklesIcon className="h-4 w-4" aria-hidden />
                        {feedbackLimitReached
                          ? `Limite de ${feedbackLimit} avis atteinte`
                          : busy
                            ? 'Import…'
                            : analysis
                              ? split.valid.length > ONBOARDING_IMPORT_LIMIT
                                ? `Importer ${ONBOARDING_IMPORT_LIMIT} avis sur ${split.valid.length} et analyser`
                                : `Importer ${split.valid.length} avis et analyser`
                              : 'Importer les avis'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void tryExamplesAndSynthesize(activeSite)}
                        disabled={busy || feedbackLimitReached}
                        className={secondaryButton}
                      >
                        Essayer avec {ONBOARDING_IMPORT_LIMIT} avis d’exemple
                      </button>
                    </div>
                  </div>
                )}

                {/* ONGLET 4 : WIDGET */}
                {sourceTab === 'widget' && !widgetAvailable && (
                  <div className="flex flex-col gap-4 rounded-xl border border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08]">
                    <div className="flex items-start gap-3">
                      <LockClosedIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-500 dark:text-zinc-400" aria-hidden />
                      <div>
                        <h2 className="text-base font-semibold text-gray-950 dark:text-white">Widget non actif sur cette offre</h2>
                        <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-zinc-400">
                          Démarrez immédiatement en collant vos avis, depuis l’App Store ou par CSV, ou consultez nos offres.
                        </p>
                      </div>
                    </div>
                    <Link href="/pricing" className={`${secondaryButton} shrink-0`}>
                      Voir les offres
                    </Link>
                  </div>
                )}

                {sourceTab === 'widget' && widgetAvailable && !widgetKey && (
                  <div className="space-y-4">
                    <p className="max-w-xl text-sm leading-6 text-gray-600 dark:text-zinc-400">
                      Qualio va générer une clé publique dédiée à ce projet. Vous pourrez copier le script d’une ligne ou le prompt prêt pour votre agent de code.
                    </p>
                    <button
                      type="button"
                      onClick={() => void prepareWidget(activeSite)}
                      disabled={busy || widgetQuery.isLoading}
                      className={primaryButton}
                    >
                      {busy ? 'Préparation…' : 'Générer mon script'}
                      <ArrowRightIcon className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                )}

                {sourceTab === 'widget' && widgetAvailable && widgetKey && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      <CheckIcon className="h-5 w-5" aria-hidden />
                      Source widget prête
                    </div>
                    <p className="text-sm leading-6 text-gray-600 dark:text-zinc-400">
                      Collez ce script juste avant la balise <code>&lt;/body&gt;</code> de votre site, ou copiez le prompt pour votre agent de code.
                    </p>
                    <div className="relative overflow-x-auto rounded-xl bg-gray-950 p-4 pr-14 font-mono text-xs leading-6 text-gray-200">
                      <code className="whitespace-pre-wrap break-all">{widgetScript}</code>
                      <button
                        type="button"
                        onClick={() => void copyWith(widgetScript, setCopyStatus, 2200)}
                        disabled={copyStatus === 'copying'}
                        aria-label={copyStatus === 'copied' ? 'Script copié' : 'Copier le script'}
                        title={copyStatus === 'copied' ? 'Script copié' : 'Copier le script'}
                        className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border ${pressable} ${focusRing} ${
                          copyStatus === 'copied'
                            ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                            : copyStatus === 'error'
                              ? 'border-red-400/40 bg-red-500/15 text-red-300'
                              : 'border-white/10 text-white hover:bg-white/10'
                        }`}
                      >
                        {copyStatus === 'copied' ? <CheckIcon className="h-4 w-4" aria-hidden /> : <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void copyWith(agentPrompt, setPromptCopyStatus, 3000)}
                        disabled={promptCopyStatus === 'copying'}
                        className={secondaryButton}
                      >
                        {promptCopyStatus === 'copied' ? 'Prompt copié' : 'Copier le prompt IA'}
                        <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />
                      </button>
                      <button type="button" onClick={() => void finishOnboarding(activeSite)} disabled={busy} className={primaryButton}>
                        Ouvrir mon espace
                        <ArrowRightIcon className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </main>
  )
}
