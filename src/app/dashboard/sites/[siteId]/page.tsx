'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  GlobeAltIcon,
  MapIcon,
  CameraIcon,
  CommandLineIcon,
  Square3Stack3DIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { useSite } from '@/lib/hooks/useSite'
import { useScanResults, useScanStatus, IssueRow, PageRow, CheckRow } from '@/lib/hooks/useScan'
import { RunScanModal } from '@/components/dashboard/RunScanModal'
import { EvidenceDrawer, EvidenceDetail } from '@/components/dashboard/EvidenceDrawer'
import { Pagination } from '@/components/ui/Pagination'
import { ScreenshotIndicator } from '@/components/dashboard/ScreenshotIndicator'
import { useIssueScreenshots, useScanJourneysSummary } from '@/lib/hooks/useScreenshots'
import { parseIssueDiagnostic, QAAIDiagnostic } from '@/lib/qa/ai'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { JourneyCoverageCard } from '@/components/dashboard/JourneyCoverageCard'

// ─── Issue Card Component avec Screenshot Indicator ───────────────────────────

interface IssueCardProps {
  issue: IssueRow
  index: number
  isExpanded: boolean
  diag: QAAIDiagnostic
  confidencePct: number
  aiStatus?: string | null
  toggleBugAccordion: (issueId: string) => void
  handleOpenEvidence: (issue: IssueRow, type: EvidenceDetail['type']) => void
}

function IssueCard({
  issue,
  index,
  isExpanded,
  diag,
  confidencePct,
  aiStatus,
  toggleBugAccordion,
  handleOpenEvidence,
}: IssueCardProps) {
  // Charger les screenshots de cet incident
  const { data: screenshots } = useIssueScreenshots(issue.id, true)
  const firstScreenshot = screenshots?.[0]

  return (
    <div
      className="rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111216] overflow-hidden transition-all shadow-2xs"
    >
      {/* Accordion Header (Click to expand/collapse) */}
      <div
        onClick={() => toggleBugAccordion(issue.id)}
        className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors select-none"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-gray-400 dark:text-gray-500">
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </span>

          {/* Uppercase Title */}
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white tracking-wide uppercase font-sans">
            {diag.title}
          </h3>

          {/* Severity badge */}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              diag.severity === 'critical'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40'
                : diag.severity === 'major'
                ? 'bg-orange-50 dark:bg-orange-950/40 text-[#ee6018] border border-orange-200/60 dark:border-orange-800/40'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40'
            }`}
          >
            {diag.severity === 'critical'
              ? 'Critique'
              : diag.severity === 'major'
              ? 'Majeur'
              : 'Mineur'}
          </span>

          {/* Status Badge */}
          {issue.status === 'new' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-zinc-400 border border-gray-200/60 dark:border-white/[0.08]">
              <SparklesIcon className="h-3 w-3" />
              Nouveau
            </span>
          )}
          {issue.status === 'persistent' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-white/[0.08] text-gray-600 dark:text-zinc-300 border border-gray-200/60 dark:border-white/[0.1]">
              <ClockIcon className="h-3 w-3" />
              Persistant
            </span>
          )}

          {/* Screenshot Indicator avec hover preview */}
          {firstScreenshot && (
            <div onClick={(e) => e.stopPropagation()}>
              <ScreenshotIndicator
                screenshotId={firstScreenshot.id}
                issueTitle={diag.title}
              />
            </div>
          )}

          {/* URL location */}
          {issue.page?.url && (
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span>📍</span>
              <span className="underline decoration-dotted underline-offset-2">
                {issue.page.url.replace(/^https?:\/\/[^/]+/, '') || '/'}
              </span>
            </span>
          )}
        </div>

        {/* AI Confidence badge */}
        {aiStatus === 'success' ? <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold font-mono shrink-0"><span>🎯</span><span>{confidencePct}% confiance</span></div> : <div className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-400 shrink-0"><span>Résumé automatique</span></div>}
      </div>

      {/* Accordion Body: The 4 Business Blocks & Technical Proofs */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-white/[0.06] space-y-4">
          {/* Block 1: Ce que Qualio a constaté */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block font-mono">
              Ce que Qualio a constaté :
            </span>
            <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed bg-gray-50/70 dark:bg-[#16181E] p-3 rounded-lg border border-gray-200/60 dark:border-white/[0.04]">
              {diag.summary}
            </p>
          </div>

          {/* Block 2: Impact Utilisateur */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block font-mono">
              Impact Utilisateur :
            </span>
            <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed bg-rose-50/40 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-200/50 dark:border-rose-900/30">
              {diag.impact}
            </p>
          </div>

          {/* Block 3: Cause probable (Hypothèse) */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block font-mono">
              Cause probable (Hypothèse) :
            </span>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-amber-50/40 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
              {diag.probable_cause}
            </p>
          </div>

          {/* Block 4: Correction suggérée */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ee6018] block font-mono">
              Correction suggérée :
            </span>
            <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed bg-orange-50/40 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200/50 dark:border-orange-900/30">
              {diag.recommendation}
            </p>
          </div>

          {/* Preuves techniques (Principes de confiance - Clickable buttons) */}
          <div className="pt-2 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 font-mono">
              Preuves techniques :
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#ee6018] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#d95514]"
              >
              </button>
              {/* Dynamic Evidence Buttons based on real data */}
              {(issue.evidence || []).some((e: any) => e.type === 'screenshot') && (
                <button
                  type="button"
                  onClick={() => handleOpenEvidence(issue, 'screenshot')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#16181E] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-[#ee6018] hover:text-[#ee6018] dark:hover:text-[#ee6018] transition-colors cursor-pointer shadow-2xs"
                >
                  <CameraIcon className="h-3.5 w-3.5 text-[#ee6018]" />
                  <span>Screenshot</span>
                </button>
              )}

              {(issue.evidence || []).some((e: any) => e.type === 'network') && (
                <button
                  type="button"
                  onClick={() => handleOpenEvidence(issue, 'network')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#16181E] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-[#ee6018] hover:text-[#ee6018] dark:hover:text-[#ee6018] transition-colors cursor-pointer shadow-2xs"
                >
                  <GlobeAltIcon className="h-3.5 w-3.5 text-[#ee6018]" />
                  <span>Réseau</span>
                </button>
              )}

              {(issue.evidence || []).some((e: any) => e.type === 'console') && (
                <button
                  type="button"
                  onClick={() => handleOpenEvidence(issue, 'console')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#16181E] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-[#ee6018] hover:text-[#ee6018] dark:hover:text-[#ee6018] transition-colors cursor-pointer shadow-2xs"
                >
                  <CommandLineIcon className="h-3.5 w-3.5 text-[#ee6018]" />
                  <span>Console</span>
                </button>
              )}

              {/* Generic button for evidence types without a dedicated icon
                  (diagnostic, viewport, measurement, url, action...). Without
                  this, that evidence existed in the database but had no way
                  to be opened from the incident card. */}
              {(issue.evidence || []).some(
                (e: any) => !['screenshot', 'network', 'console'].includes(e.type)
              ) && (
                <button
                  type="button"
                  onClick={() => {
                    const other = (issue.evidence || []).find(
                      (e: any) => !['screenshot', 'network', 'console'].includes(e.type)
                    )
                    handleOpenEvidence(issue, (other?.type as EvidenceDetail['type']) || 'raw')
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#16181E] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-[#ee6018] hover:text-[#ee6018] dark:hover:text-[#ee6018] transition-colors cursor-pointer shadow-2xs"
                >
                  <InformationCircleIcon className="h-3.5 w-3.5 text-[#ee6018]" />
                  <span>Autre preuve</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function SiteWorkspacePage() {
  const params = useParams()
  const siteId = params.siteId as string

  // Fetch Site details
  const { data: site, isLoading: isSiteLoading, error: siteError, refetch: refetchSite } = useSite(siteId)

  // Modals & Active Tab
  const [isRunScanOpen, setIsRunScanOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'bugs' | 'journeys' | 'pages' | 'checks'>('bugs')

  // Evidence Drawer state
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false)
  const [currentEvidence, setCurrentEvidence] = useState<EvidenceDetail | null>(null)
  const [availableEvidences, setAvailableEvidences] = useState<EvidenceDetail[]>([])

  // Filters for Tabs
  const [bugSeverityFilter, setBugSeverityFilter] = useState<'all' | 'critical' | 'major' | 'minor'>('all')
  const [activeDiffFilter, setActiveDiffFilter] = useState<'all' | 'new' | 'persistent' | 'resolved'>('all')
  const [bugSearch, setBugSearch] = useState('')
  const [bugPage, setBugPage] = useState(1)
  const bugPageSize = 10
  const [pageSearch, setPageSearch] = useState('')
  const [pageStatusFilter, setPageStatusFilter] = useState<'all' | '200' | '404' | '500'>('all')
  const [checkSearch, setCheckSearch] = useState('')
  const [checkStatusFilter, setCheckStatusFilter] = useState<'all' | 'passed' | 'failed' | 'warning'>('all')

  // Accordion state (set of expanded bug IDs)
  const [expandedBugIds, setExpandedBugIds] = useState<Record<string, boolean>>({})

  // Active scan & previous scan
  const scans = site?.scans ?? []
  const latestScan = scans[0] ?? null
  const previousScan = scans[1] ?? null

  const isScanRunning = latestScan
    ? ['queued', 'running', 'discovering', 'crawling', 'auditing', 'browser_testing', 'analyzing', 'reporting', 'created'].includes(latestScan.status)
    : false

  // Live polling if scan is in progress
  const { data: liveStatus } = useScanStatus(latestScan?.id ?? null, isScanRunning)

  // The site query contains the scan snapshot. Refresh it as soon as the
  // polling endpoint reaches a terminal state so results, counters and the
  // comparison widget are loaded without requiring a manual page refresh.
  useEffect(() => {
    const terminalStatuses = ['completed', 'failed', 'partial', 'blocked']
    if (
      liveStatus &&
      terminalStatuses.includes(liveStatus.status) &&
      liveStatus.status !== latestScan?.status
    ) {
      void refetchSite()
    }
  }, [liveStatus, latestScan?.status, refetchSite])

  // Fetch full results for the latest scan
  const { data: scanResults, isLoading: isResultsLoading } = useScanResults(
    latestScan?.id ?? null,
    liveStatus?.status ?? latestScan?.status
  )

  const { data: prevScanResults } = useScanResults(previousScan?.id ?? null, previousScan?.status)
  const { data: journeySummaries = [], isLoading: isJourneysLoading } = useScanJourneysSummary(
    latestScan?.id ?? null,
    !!latestScan && latestScan.status === 'completed'
  )

  const rawIssues = scanResults?.issues ?? []
  const pages = scanResults?.pages ?? []
  const checks = scanResults?.checks ?? []

  const issues = useMemo(() => {
    return rawIssues || []
  }, [rawIssues])

  // Count issues per page URL for Tab 2
  const issueCountByUrl = useMemo(() => {
    const map: Record<string, number> = {}
    issues.forEach((iss) => {
      const u = iss.page?.url
      if (u) map[u] = (map[u] || 0) + 1
    })
    return map
  }, [issues])

  // Compute diff metrics compared to previous scan
  const diffMetrics = useMemo(() => {
    if (!latestScan) return null
    if (!previousScan) {
      return {
        isBaseline: true,
        resolved: [],
        regressions: issues.filter(i => i.status === 'new' || i.status === 'open'),
        persistent: [],
      }
    }

    const regressions = issues.filter(i => i.status === 'new' || i.status === 'open')
    const persistent = issues.filter(i => i.status === 'persistent')
    
    const prevIssues = prevScanResults?.issues ?? []
    const resolved = prevIssues.filter(prev => !issues.some(curr => curr.page_id === prev.page_id && curr.category === prev.category))

    return {
      isBaseline: false,
      resolved,
      regressions,
      persistent,
      prevDate: previousScan.completed_at || previousScan.created_at,
    }
  }, [latestScan, previousScan, issues, prevScanResults])

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSeverity =
        bugSeverityFilter === 'all' || issue.severity.toLowerCase() === bugSeverityFilter
      const query = bugSearch.toLowerCase().trim()
      const matchesSearch =
        !query ||
        issue.title.toLowerCase().includes(query) ||
        (issue.description && issue.description.toLowerCase().includes(query)) ||
        (issue.page?.url && issue.page.url.toLowerCase().includes(query)) ||
        (issue.category && issue.category.toLowerCase().includes(query))
      return matchesSeverity && matchesSearch
    })
  }, [issues, bugSeverityFilter, bugSearch])

  useEffect(() => {
    setBugPage(1)
  }, [bugSearch, bugSeverityFilter])

  const paginatedIssues = filteredIssues.slice((bugPage - 1) * bugPageSize, bugPage * bugPageSize)

  // Filtered pages
  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      const matchesSearch =
        !pageSearch.trim() ||
        p.url.toLowerCase().includes(pageSearch.toLowerCase()) ||
        (p.title && p.title.toLowerCase().includes(pageSearch.toLowerCase()))

      const matchesStatus =
        pageStatusFilter === 'all' ||
        (pageStatusFilter === '200' && p.status_code === 200) ||
        (pageStatusFilter === '404' && p.status_code === 404) ||
        (pageStatusFilter === '500' && (p.status_code ?? 0) >= 500)

      return matchesSearch && matchesStatus
    })
  }, [pages, pageSearch, pageStatusFilter])

  // Filtered checks
  const filteredChecks = useMemo(() => {
    return checks.filter((c) => {
      const matchesSearch =
        !checkSearch.trim() ||
        (c.title && c.title.toLowerCase().includes(checkSearch.toLowerCase())) ||
        c.category.toLowerCase().includes(checkSearch.toLowerCase()) ||
        (c.message && c.message.toLowerCase().includes(checkSearch.toLowerCase()))

      const matchesStatus =
        checkStatusFilter === 'all' ||
        (checkStatusFilter === 'passed' && c.status === 'passed') ||
        (checkStatusFilter === 'failed' && c.status === 'failed') ||
        (checkStatusFilter === 'warning' && c.status === 'warning')

      return matchesSearch && matchesStatus
    })
  }, [checks, checkSearch, checkStatusFilter])

  // Accordion toggle helper
  const toggleBugAccordion = (id: string) => {
    setExpandedBugIds((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id], // defaults first one to open
    }))
  }

  const isBugExpanded = (id: string, index: number) => {
    if (expandedBugIds[id] !== undefined) return expandedBugIds[id]
    return index === 0 // open the first bug by default
  }

  // Open evidence drawer for a specific proof
  const handleOpenEvidence = (issue: IssueRow, preferredType: EvidenceDetail['type']) => {
    const rawEvList = issue.evidence || []
    const evList: EvidenceDetail[] = rawEvList.map((ev) => {
      const type = (ev.type as EvidenceDetail['type']) || 'raw'
      const titles: Record<string, string> = {
        network: `Preuve Réseau (HTTP ${ev.payload?.status || 500})`,
        screenshot: 'Capture d\'écran Playwright',
        console: 'Journal Console JavaScript',
        diagnostic: 'Diagnostic technique',
        viewport: 'Preuve Responsive (Viewport)',
        measurement: 'Mesure technique',
        journey: 'Étapes du parcours utilisateur',
        url: 'Page concernée',
        action: 'Action utilisateur',
      }
      return {
        type,
        title: titles[type] || 'Preuve technique',
        url: issue.page?.url,
        issueTitle: issue.title,
        payload: ev.payload,
      }
    })

    const matched = evList.find((e) => e.type === preferredType) || evList[0] || null
    if (!matched) return // Don't open if no evidence exists

    setAvailableEvidences(evList)
    setCurrentEvidence(matched)
    setEvidenceDrawerOpen(true)
  }

  // If loading, show a structural skeleton that prevents "toc toc toc" feeling
  if (isSiteLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 w-48 bg-gray-200 dark:bg-white/[0.05] rounded"></div>
        {/* Header Skeleton */}
        <div className="rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16181E] p-6 h-32"></div>
        {/* Tabs Skeleton */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-white/[0.08] pb-1">
          <div className="h-8 w-24 bg-gray-200 dark:bg-white/[0.05] rounded-t-md"></div>
          <div className="h-8 w-32 bg-gray-200 dark:bg-white/[0.05] rounded-t-md"></div>
        </div>
        {/* Content Skeleton */}
        <div className="h-48 rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#181B21]"></div>
      </div>
    )
  }

  // Error / Not found state
  if (siteError || !site) {
    return (
      <div className="rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16181E] p-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] max-w-lg mx-auto my-12">
        <div className="h-12 w-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
          <ExclamationCircleIcon className="h-6 w-6" />
        </div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Site introuvable</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
          Impossible de trouver le site demandé ou vous n'avez pas les autorisations nécessaires pour y accéder.
        </p>
        <Link
          href="/dashboard/sites"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold hover:bg-black dark:hover:bg-gray-100 transition-colors"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          <span>Retour à la liste des sites</span>
        </Link>
      </div>
    )
  }

  const siteEnv = site.environment === 'staging' ? 'Staging' : 'Production'

  // Health and Status checks
  const isHealthy =
    latestScan?.status === 'completed' &&
    (latestScan.critical_count ?? 0) === 0 &&
    (latestScan.major_count ?? 0) === 0 &&
    issues.length === 0

  const hasRegressions = (diffMetrics?.regressions?.length ?? 0) > 0 || (latestScan?.critical_count ?? 0) > 0

  // Formatted last scan timestamp
  const formattedLastScan = latestScan?.completed_at
    ? formatDistanceToNow(new Date(latestScan.completed_at), { addSuffix: true, locale: fr })
    : 'Récemment'

  // Executive summary text computation
  // This is derived display text, not state. Keep it as a plain computation so
  // the loading/error early returns above never change the hook order.
  const aiSummaryText = (() => {
    if (isHealthy) {
      return 'Aucune anomalie détectée lors de ce scan. Les parcours critiques sont fonctionnels.'
    }
    if (latestScan?.summary && latestScan.summary.length > 20) {
      return latestScan.summary
    }
    if (issues.length > 0) {
      const topIssues = issues.slice(0, 2)
      return topIssues
        .map((iss) => {
          const diag = parseIssueDiagnostic(iss)
          return `${diag.summary} ${diag.impact}`
        })
        .join(' ')
    }
    return 'L\'analyse Playwright a identifié des anomalies techniques nécessitant une intervention pour préserver l\'intégrité des parcours utilisateurs.'
  })()

  return (
    <div className="space-y-5">
      {/* ─── Breadcrumb Navigation ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
        <Link
          href="/dashboard/sites"
          className="hover:text-gray-900 dark:hover:text-white font-medium transition-colors flex items-center gap-1"
        >
          <ArrowLeftIcon className="h-3 w-3" />
          <span>Sites</span>
        </Link>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-xs">
          {site.name || site.url.replace(/^https?:\/\//, '')}
        </span>
      </div>

      {/* ─── A. L'EN-TÊTE (HEADER WORKSPACE) ───────────────────────────────── */}
      <div className="rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16181E] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Status badge & Site identity */}
            <div className="flex items-center gap-3 flex-wrap">
              {isScanRunning ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                                    <span>
                    {latestScan?.status === 'created' ? 'INITIALISATION...' :
                     latestScan?.status === 'crawling' ? 'EXPLORATION DES PAGES...' :
                     latestScan?.status === 'auditing' ? 'ANALYSE ACCESSIBILIT�...' :
                     latestScan?.status === 'browser_testing' ? 'TESTS EN COURS...' :
                     latestScan?.status === 'analyzing' ? 'ANALYSE IA EN COURS...' :
                     'EN COURS...'}
                  </span>
                </span>
              ) : isHealthy ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>SAIN</span>
                </span>
              ) : hasRegressions ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>RÉGRESSION</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>ATTENTION</span>
                </span>
              )}

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-sans flex items-center gap-2">
                <span>{site.name || site.url.replace(/^https?:\/\//, '')}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#111216] text-gray-600 dark:text-gray-300">
                  ({siteEnv})
                </span>
              </h1>
            </div>

            {/* Sub-bar: URL and Last Scan */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-mono flex-wrap">
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-[#ee6018] transition-colors"
              >
                <GlobeAltIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                <span>{site.url}</span>
                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
              </a>
              <span className="text-gray-300 dark:text-gray-700">|</span>
              <span className="flex items-center gap-1.5">
                <ClockIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                <span>
                  Dernier scan : {latestScan?.completed_at ? formattedLastScan : 'Aujourd\'hui'}
                </span>
              </span>
            </div>
          </div>

          {/* Action Button: Re-scan */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsRunScanOpen(true)}
              disabled={isScanRunning}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#ee6018] text-white text-xs font-bold shadow-sm shadow-[#ee6018]/25 hover:bg-[#d95514] active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
            >
              {isScanRunning ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  <span>Scan en cours...</span>
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4" />
                  <span>Re-scan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── B. LE WIDGET DIFF (COMPARAISON VS SCAN PRÉCÉDENT) ──────────────── */}
      <div className="rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16181E] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Square3Stack3DIcon className="h-4 w-4 text-[#ee6018]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white font-sans">
              COMPARAISON (vs Scan précédent)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500">
            {diffMetrics?.isBaseline ? 'Baseline de référence' : 'Différentiel automatique Playwright'}
          </span>
        </div>

        {diffMetrics?.isBaseline ? (
          <div className="py-4 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              <InformationCircleIcon className="h-4 w-4 shrink-0" />
              <span>Scan de référence initial (Baseline)</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              C'est le premier scan de ce site. Le moteur de comparaison mesurera automatiquement les régressions et résolutions dès le prochain passage.
            </p>
          </div>
        ) : (
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Résolus (Vert) */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
              <div className="flex items-center gap-2.5">
                <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Résolus</span>
              </div>
              <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {diffMetrics?.resolved?.length ?? 0} {diffMetrics?.resolved?.length === 1 ? 'Résolu' : 'Résolus'}
              </span>
            </div>

            {/* Nouvelles Régressions (Rouge) */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40">
              <div className="flex items-center gap-2.5">
                <XCircleIcon className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Nouvelles Régressions</span>
              </div>
              <span className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                {diffMetrics?.regressions?.length ?? 0} {diffMetrics?.regressions?.length === 1 ? 'Régression' : 'Régressions'}
              </span>
            </div>

            {/* Existants (Orange/Jaune) */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
              <div className="flex items-center gap-2.5">
                <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Existants</span>
              </div>
              <span className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400 tabular-nums">
                {diffMetrics?.persistent?.length ?? 0} {diffMetrics?.persistent?.length === 1 ? 'Existant' : 'Existants'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── C. LA CARTE SYNTHÈSE IA (EXECUTIVE SUMMARY) ────────────────────── */}
      <div className="rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16181E] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-[#ee6018]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white font-sans">
              SYNTHÈSE IA
            </h2>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200/60 dark:border-emerald-800/40 font-mono">
            <ShieldCheckIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <span>Certifié sans hallucination (96%)</span>
          </div>
        </div>

        <div className="py-3">
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-sans">
            {aiSummaryText}
          </p>
        </div>
      </div>

      {/* ─── D. HISTORIQUE DES SCANS ───────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16181E] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/[0.06]">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white font-sans">
              HISTORIQUE DES SCANS
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
              Les dernières exécutions de ce site et leur résultat.
            </p>
          </div>
          <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500">
            {scans.length} exécution{scans.length === 1 ? '' : 's'}
          </span>
        </div>
        {scans.length === 0 ? (
          <p className="py-5 text-xs text-gray-500 dark:text-gray-400">Aucun scan n’a encore été exécuté.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {scans.slice(0, 5).map((scan, index) => {
              const statusLabel = scan.status === 'completed' ? 'Terminé' : scan.status === 'failed' ? 'Échec' : scan.status === 'partial' ? 'Partiel' : scan.status === 'blocked' ? 'Bloqué' : 'En cours'
              const statusClass = scan.status === 'completed'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40'
                : scan.status === 'failed' || scan.status === 'blocked'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40'
              return (
                <div key={scan.id} className="flex items-center justify-between gap-3 py-3 first:pt-4 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide shrink-0 ${statusClass}`}>
                      {statusLabel}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                      {index === 0 ? 'Dernier scan' : `Scan précédent ${index}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-[11px] font-mono text-gray-400 dark:text-gray-500">
                    <span>{scan.checks_passed ?? 0}/{scan.checks_total ?? 0} checks</span>
                    <span>{formatDistanceToNow(new Date(scan.completed_at || scan.created_at || Date.now()), { addSuffix: true, locale: fr })}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── 3. LES ONGLETS (NAVIGATION PROFONDE) ───────────────────────────── */}
      <JourneyCoverageCard
        siteId={siteId}
        journeys={site?.journey_definitions}
      />
      <div className="rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16181E] shadow-xs overflow-hidden">
        {/* Tab Headers Bar */}
        <div className="border-b border-gray-200/80 dark:border-white/[0.06] px-4 bg-gray-50/50 dark:bg-[#111216]/50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex space-x-6">
            <button
              type="button"
              onClick={() => setActiveTab('bugs')}
              className={`py-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'bugs'
                  ? 'border-[#ee6018] text-[#ee6018]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span>BUGS & ANOMALIES</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-bold ${
                  issues.length > 0
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40'
                    : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400'
                }`}
              >
                {issues.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('journeys')}
              className={`py-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'journeys'
                  ? 'border-[#ee6018] text-[#ee6018]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span>PARCOURS</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-bold bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400">
                {journeySummaries.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pages')}
              className={`py-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'pages'
                  ? 'border-[#ee6018] text-[#ee6018]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span>PAGES EXPLORÉES</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-bold bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400">
                {pages.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('checks')}
              className={`py-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'checks'
                  ? 'border-[#ee6018] text-[#ee6018]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span>TESTS PLAYWRIGHT</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-bold bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400">
                {checks.length}
              </span>
            </button>
          </div>

          {isResultsLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <ArrowPathIcon className="h-3 w-3 animate-spin text-[#ee6018]" />
              <span>Chargement...</span>
            </div>
          )}
        </div>

        {/* ─── ONGLET 1: BUGS & ANOMALIES (ACCORDION) ───────────────────────── */}
        {activeTab === 'bugs' && (
          <div className="p-5 space-y-4">
            {/* Search & Severity Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full max-w-sm">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={bugSearch}
                  onChange={(e) => setBugSearch(e.target.value)}
                  placeholder="Rechercher par titre, URL ou sélecteur..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50/80 dark:bg-[#111216] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ee6018]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {(['all', 'critical', 'major', 'minor'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setBugSeverityFilter(sev)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors capitalize cursor-pointer ${
                      bugSeverityFilter === sev
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-white dark:bg-[#111216] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {sev === 'all'
                      ? 'Tous'
                      : sev === 'critical'
                      ? 'Critiques'
                      : sev === 'major'
                      ? 'Majeurs'
                      : 'Mineurs'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bugs Accordion List */}
            {filteredIssues.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircleIcon className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  {issues.length === 0
                    ? 'Aucune anomalie détectée'
                    : 'Aucun bug ne correspond à vos filtres'}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  {issues.length === 0
                    ? 'Toutes les assertions Playwright ont été validées avec succès sur cette session.'
                    : 'Essayez de modifier votre recherche ou de réinitialiser le filtre de sévérité.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedIssues.map((issue, index) => {
                  const isExpanded = isBugExpanded(issue.id, index)
                  const diag: QAAIDiagnostic = parseIssueDiagnostic(issue)
                  const confidencePct = Math.round(diag.confidence * 100)

                  return (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      index={index}
                      isExpanded={isExpanded}
                      diag={diag}
                      confidencePct={confidencePct}
                      aiStatus={(scanResults?.scan?.ai_status as string | null | undefined) ?? (latestScan as typeof latestScan & { ai_status?: string | null })?.ai_status}
                      toggleBugAccordion={toggleBugAccordion}
                      handleOpenEvidence={handleOpenEvidence}
                    />
                  )
                })}
                <Pagination
                  page={bugPage}
                  pageSize={bugPageSize}
                  total={filteredIssues.length}
                  onPageChange={setBugPage}
                  label="bugs"
                />
              </div>
            )}
          </div>
        )}

        {/* ─── ONGLET 2: PARCOURS UTILISATEUR ──────────────────────────────── */}
        {activeTab === 'journeys' && (
          <div className="p-5 space-y-3">
            {isJourneysLoading ? (
              <div className="flex items-center gap-2 py-8 justify-center text-xs text-gray-500 dark:text-gray-400">
                <ArrowPathIcon className="h-4 w-4 animate-spin text-[#ee6018]" />
                Chargement des parcours...
              </div>
            ) : journeySummaries.length === 0 ? (
              <div className="py-10 text-center">
                <MapIcon className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Aucun parcours enregistré</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Les parcours exécutés apparaîtront ici avec leurs étapes et leurs preuves.
                </p>
              </div>
            ) : (
              journeySummaries.map((journey) => {
                const isPassed = journey.status === 'pass'
                const isFailed = journey.status === 'fail'
                return (
                  <div key={journey.journey_name} className="rounded-xl border border-gray-200/80 dark:border-white/[0.08] p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {isPassed ? <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0" /> : isFailed ? <XCircleIcon className="h-5 w-5 text-rose-500 shrink-0" /> : <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{journey.journey_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {journey.steps_passed}/{journey.steps_total} étapes réussies
                          {journey.steps_failed > 0 ? ` · ${journey.steps_failed} échec${journey.steps_failed > 1 ? 's' : ''}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wide shrink-0 ${isPassed ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40' : isFailed ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40'}`}>
                      {isPassed ? 'Réussi' : isFailed ? 'Échec' : 'Partiel'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ─── ONGLET 3: PAGES EXPLORÉES (VUE TABULAIRE) ────────────────────── */}
        {activeTab === 'pages' && (
          <div className="p-5 space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full max-w-sm">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={pageSearch}
                  onChange={(e) => setPageSearch(e.target.value)}
                  placeholder="Filtrer par URL ou titre..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50/80 dark:bg-[#111216] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ee6018]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {(['all', '200', '404', '500'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setPageStatusFilter(code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      pageStatusFilter === code
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-white dark:bg-[#111216] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {code === 'all' ? 'Toutes' : `HTTP ${code}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Pages Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200/80 dark:border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/70 dark:bg-[#111216] border-b border-gray-200/80 dark:border-white/[0.08] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">URL de la page</th>
                    <th className="py-3 px-3">Statut HTTP</th>
                    <th className="py-3 px-3">Temps de réponse</th>
                    <th className="py-3 px-3">Problèmes trouvés</th>
                    <th className="py-3 px-3">Profondeur</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                  {filteredPages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
                        Aucune page trouvée
                      </td>
                    </tr>
                  ) : (
                    filteredPages.map((page) => {
                      const count = issueCountByUrl[page.url] || 0
                      return (
                        <tr key={page.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-gray-900 dark:text-white max-w-md truncate">
                            <span title={page.url}>{page.url}</span>
                            {page.title && (
                              <span className="block text-[11px] font-sans text-gray-500 dark:text-gray-400 font-normal truncate mt-0.5">
                                {page.title}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                                page.status_code === 200
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40'
                                  : (page.status_code ?? 0) >= 500
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40'
                              }`}
                            >
                              {page.status_code ?? 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono tabular-nums text-gray-600 dark:text-gray-400">
                            {page.response_time_ms ? `${page.response_time_ms} ms` : '—'}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                                count > 0
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40'
                                  : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {count > 0 ? `${count} anomalie${count > 1 ? 's' : ''}` : '0 problème'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-gray-500 dark:text-gray-400">
                            {page.depth === 0 ? 'Accueil (0)' : `Niv. ${page.depth}`}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#ee6018] hover:underline"
                            >
                              <span>Ouvrir</span>
                              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                            </a>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── ONGLET 4: TESTS PLAYWRIGHT (LA VÉRITÉ BRUTE) ─────────────────── */}
        {activeTab === 'checks' && (
          <div className="p-5 space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full max-w-sm">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={checkSearch}
                  onChange={(e) => setCheckSearch(e.target.value)}
                  placeholder="Filtrer par scénario ou catégorie..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50/80 dark:bg-[#111216] border border-gray-200 dark:border-white/[0.08] rounded-lg text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#ee6018]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {(['all', 'passed', 'failed', 'warning'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setCheckStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors capitalize cursor-pointer ${
                      checkStatusFilter === st
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                        : 'bg-white dark:bg-[#111216] border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {st === 'all'
                      ? 'Tous'
                      : st === 'passed'
                      ? 'Passés [PASS]'
                      : st === 'failed'
                      ? 'Échecs [FAIL]'
                      : 'Avertissements'}
                  </button>
                ))}
              </div>
            </div>

            {/* Checks Raw Results List */}
            <div className="space-y-2">
              {filteredChecks.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
                  Aucun test Playwright correspondant aux critères
                </div>
              ) : (
                filteredChecks.map((chk) => (
                  <div
                    key={chk.id}
                    className="rounded-xl border border-gray-200/80 dark:border-white/[0.08] p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {chk.status === 'passed' ? (
                        <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : chk.status === 'failed' ? (
                        <XCircleIcon className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      ) : (
                        <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 shrink-0" />
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              chk.status === 'passed'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : chk.status === 'failed'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {chk.status === 'passed' ? '[PASS]' : chk.status === 'failed' ? '[FAIL]' : '[WARN]'}
                          </span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white font-sans">
                            {chk.title || chk.key}
                          </span>
                          <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">
                            {chk.category}
                          </span>
                        </div>
                        {chk.message && (
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-mono">
                            {chk.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {chk.duration_ms && (
                        <span className="text-xs font-mono tabular-nums text-gray-400 dark:text-gray-500">
                          {chk.duration_ms} ms
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── MODALS & DRAWERS ──────────────────────────────────────────────── */}
      {/* 1. Run Scan Modal */}
      <RunScanModal
        isOpen={isRunScanOpen}
        onClose={() => setIsRunScanOpen(false)}
        site={{
          id: site.id,
          url: site.url,
          name: site.name,
          environment: site.environment,
        }}
        onSuccess={() => {
          refetchSite()
        }}
      />

      {/* 2. Slide-over Evidence Drawer */}
      <EvidenceDrawer
        isOpen={evidenceDrawerOpen}
        onClose={() => setEvidenceDrawerOpen(false)}
        evidence={currentEvidence}
        availableEvidences={availableEvidences}
        onSelectEvidence={(ev) => setCurrentEvidence(ev)}
      />
    </div>
  )
}
















