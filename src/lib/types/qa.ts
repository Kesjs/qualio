// Types pour le système QA
// ScanStatus n'est plus défini ici : le moteur QA (src/lib/qa/types) est la seule
// source de vérité, car ce sont ses valeurs qui transitent réellement via le polling.
import type { ScanStatus } from '@/lib/qa/types'
export type { ScanStatus } from '@/lib/qa/types'

export type CheckStatus = 'passed' | 'warning' | 'failed' | 'skipped' | 'running'

export type IssueSeverity = 'critical' | 'major' | 'warning'

export type CheckCategory = 
  | 'pages' 
  | 'navigation' 
  | 'forms' 
  | 'cta' 
  | 'browser' 
  | 'assets' 
  | 'responsive' 
  | 'seo' 
  | 'performance' 
  | 'accessibility' 
  | 'security' 
  | 'visual'

export interface Evidence {
  type: 'screenshot' | 'network' | 'console' | 'html'
  content: string
  description: string
  timestamp: string
}

export interface Issue {
  id: string
  severity: IssueSeverity
  category: CheckCategory
  title: string
  url: string
  description: string
  observedResult: string
  evidence: Evidence[]
  suggestion?: string
}

export interface Check {
  id: string
  category: CheckCategory
  name: string
  status: CheckStatus
  url?: string
  message?: string
  evidence?: Evidence[]
}

export interface PageResult {
  url: string
  status: number
  title?: string
  checks: Check[]
  issues: Issue[]
  screenshot?: string
}

export interface QAScan {
  id: string
  siteId: string
  status: ScanStatus
  startTime: string
  endTime?: string
  duration?: string
  
  // Résultats
  pagesDiscovered: number
  totalChecks: number
  passed: number
  warnings: number
  issues: number
  
  // Détails
  pages: PageResult[]
  allIssues: Issue[]
  checks: Check[]
  
  // Progression
  currentStep?: string
  progress?: number
}

export interface Site {
  id: string
  name: string
  url: string
  createdAt: string
  lastScan?: QAScan
  scanHistory: QAScan[]
}

export interface QAReport {
  id: string
  siteId: string
  scanId: string
  generatedAt: string
  readyToShip: boolean
  summary: {
    totalPages: number
    totalChecks: number
    passed: number
    warnings: number
    issues: number
    criticalIssues: number
    duration: string
  }
  issues: Issue[]
  evidence: Evidence[]
}