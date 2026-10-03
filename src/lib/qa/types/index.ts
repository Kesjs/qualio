// Types pour le moteur QA Qualio

import type { FixContext } from '../fix-context/types'

export type ScanStatus =
  | 'created'
  | 'queued'
  | 'running'
  | 'discovering'
  | 'crawling'
  | 'browser_testing'
  | 'analyzing'
  | 'reporting'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'blocked'

export type CheckStatus = 'passed' | 'warning' | 'failed' | 'inconclusive' | 'skipped' | 'running'

export type IssueSeverity = 'critical' | 'major' | 'minor'

export type CheckCategory =
  | 'pages' | 'links' | 'navigation' | 'forms' | 'cta'
  | 'browser' | 'network' | 'assets' | 'responsive' | 'seo'
  | 'performance' | 'accessibility' | 'security' | 'visual'

export type Viewport = 'mobile' | 'tablet' | 'desktop'
export type EvidenceType = 'url' | 'action' | 'network' | 'console' | 'screenshot' | 'measurement' | 'viewport' | 'diagnostic'
export type IssueStatus = 'open' | 'fixed' | 'ignored' | 'resolved' | 'new' | 'persistent'
export type Confidence = 'high' | 'medium' | 'low'
export type ScanModule = 'pages' | 'cta' | 'forms' | 'consoleErrors' | 'mobileResponsive'
export const DEFAULT_SCAN_MODULES: ScanModule[] = ['pages', 'cta', 'forms', 'consoleErrors', 'mobileResponsive']

// Types pour les User Journeys (Phase 3)
export type JourneyStepStatus = 'pass' | 'fail' | 'not_reached' | 'skip'
export type JourneyActionType =
  | 'navigate'
  | 'click'
  | 'fill'
  | 'submit'
  | 'wait'
  | 'assert'

export interface QAConfig {
  maxPages: number
  maxCrawlDepth: number
  maxScanTime: number
  maxPageTime: number
  maxNavigationTime: number
  maxRetries: number
  maxScreenshots: number
  viewports: ViewportConfig[]
}

export interface ViewportConfig {
  name: Viewport
  width: number
  height: number
}

export interface DiscoveryResult {
  url: string
  homepage: string
  sitemap: string | null
  robots: string | null
  internalLinks: string[]
  navigation: string[]
  forms: FormInfo[]
  ctaCandidates: string[]
  images: string[]
  scripts: string[]
}

export interface FormInfo {
  action: string
  method: string
  fields: FieldInfo[]
  submitButton: string | null
}

export interface FieldInfo {
  name: string
  type: string
  required: boolean
  label: string | null
}

export interface CrawlResult {
  pages: PageResult[]
  total: number
  duration: number
}

export interface PageResult {
  id?: string
  url: string
  status: number
  finalUrl: string
  responseTime: number
  title: string
  depth: number
  links: string[]
  images: string[]
  forms: FormInfo[]
  /** Lightweight public signals used to identify the site's stack. */
  htmlSnippet?: string
  scriptUrls?: string[]
  repositoryLinks?: string[]
}

export interface CheckResult {
  id: string
  scanId: string
  pageId: string | null
  category: CheckCategory
  key: string
  status: CheckStatus
  severity: IssueSeverity | null
  title: string
  message: string
  duration: number
  evidence?: Evidence[]
}

export interface Evidence {
  type: EvidenceType
  payload: Record<string, unknown>
}

export interface Issue {
  id: string
  scanId: string
  pageId: string | null
  category: CheckCategory
  severity: IssueSeverity
  title: string
  description: string
  suggestion: string
  confidence: Confidence
  status: IssueStatus
  evidence: Evidence[]
  fixContext?: FixContext
  aiTokensInput?: number
  aiTokensOutput?: number
  aiCostUsd?: number
  aiDurationMs?: number
  aiModel?: string
}

export interface ScanResult {
  scanId: string
  siteId: string
  status: ScanStatus
  startedAt: Date
  completedAt: Date | null
  pagesDiscovered: number
  checksTotal: number
  checksPassed: number
  checksWarning: number
  checksFailed: number
  criticalCount: number
  majorCount: number
  summary: string
  error: string | null
  aiCallsCount?: number
  aiTokensInput?: number
  aiTokensOutput?: number
  aiCostUsd?: number
  aiDurationMs?: number
  aiStatus?: 'not_needed' | 'success' | 'failed'
  aiError?: string
  issues: Issue[]
  checks: CheckResult[]
  pages: PageResult[]
  screenshots: ScreenshotResult[]
}

export interface ScreenshotResult {
  id: string
  scanId: string
  pageId: string | null
  issueId: string | null
  viewport: Viewport
  storagePath: string
}

// ─── User Journey Types (Phase 3) ────────────────────────────────────────────

export interface JourneyStepAction {
  type: JourneyActionType
  target?: string // Sélecteur CSS, URL, ou identifiant
  value?: string | Record<string, string> // Valeur à remplir, ou map de champs
  waitFor?: string // Condition d'attente (URL, sélecteur, timeout)
  details?: Record<string, unknown>
}

export interface JourneyStepDefinition {
  name: string
  action: JourneyStepAction
  expectedResult?: {
    url?: string // URL attendue après l'action
    selector?: string // Élément qui doit être présent
    text?: string // Texte qui doit être visible
  }
}

export interface JourneyDefinition {
  name: string
  description?: string
  steps: JourneyStepDefinition[]
  startUrl?: string
  viewport?: ViewportConfig
}

export interface JourneyStepResult {
  id?: string
  scanId: string
  pageId?: string | null
  issueId?: string | null
  journeyName: string
  stepOrder: number
  stepName: string
  actionType: JourneyActionType
  actionTarget?: string
  actionDetails?: Record<string, unknown>
  status: JourneyStepStatus
  resultPayload?: Record<string, unknown>
  errorMessage?: string
  screenshotId?: string | null
  durationMs?: number
  createdAt?: string
}

export interface JourneyResult {
  journeyName: string
  status: 'pass' | 'fail' | 'partial'
  stepsTotal: number
  stepsPassed: number
  stepsFailed: number
  stepsNotReached: number
  steps: JourneyStepResult[]
  durationMs: number
  error?: string
}

export const DEFAULT_QA_CONFIG: QAConfig = {
  maxPages: 50,
  maxCrawlDepth: 4,
  maxScanTime: 600,
  maxPageTime: 30,
  maxNavigationTime: 20,
  maxRetries: 1,
  maxScreenshots: 30,
  viewports: [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ],
}

export const FORBIDDEN_URLS = [
  'localhost',
  '127.0.0.0/8',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '169.254.0.0/16',
  '::1',
  'metadata',
  '169.254.169.254',
]

export const SENSITIVE_ACTIONS = [
  'buy', 'pay', 'delete', 'publish', 'book',
  'transfer', 'confirm', 'purchase', 'checkout', 'remove', 'destroy',
]
