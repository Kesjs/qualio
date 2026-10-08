'use client'
import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { FormSelection, FormScanProgress } from '@/lib/qa/types'
import { scanSummaryText } from '@/lib/qa/selected-form-summary'
import { TERMINAL_SCAN_STATUSES, scanPollInterval, scanListPollInterval } from './scan-polling'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScanStatus {
  scanId: string
  status: string
  progress: number
  startedAt: string | null
  completedAt: string | null
  error: string | null
  summary: string | null
  pagesDiscovered: number | null
  checksTotal: number | null
  checksFailed: number | null
  criticalCount: number | null
  majorCount: number | null
  aiCallsCount: number | null
  aiStatus?: 'not_needed' | 'success' | 'failed' | null
  aiError?: string | null
  forms?: FormScanProgress[]
}

export interface ScanResults {
  scan: Record<string, unknown>
  pages: PageRow[]
  issues: IssueRow[]
  checks: CheckRow[]
}

export interface PageRow {
  id: string; url: string; status_code: number | null; final_url: string | null
  response_time_ms: number | null; title: string | null; depth: number | null
}

export interface IssueRow {
  id: string
  scan_id?: string
  category: string
  severity: string
  status: string | null
  title: string
  description: string | null
  suggestion: string | null
  confidence: string | null
  page_id: string | null
  created_at: string | null
  page?: { url: string } | null
  evidence?: Array<{ id: string; type: string; payload: any }> | null
  fix_context?: import('@/lib/supabase/database.types').Json | null
}

export interface CheckRow {
  id: string; category: string; key: string; status: string; severity: string | null
  title: string | null; message: string | null; duration_ms: number | null; page_id: string | null
}

const TERMINAL_STATUSES = TERMINAL_SCAN_STATUSES

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchScanStatus(scanId: string): Promise<ScanStatus> {
  const res = await fetch(`/api/scan/${scanId}/status`)
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to fetch scan status')
  return res.json()
}

async function fetchScanResults(scanId: string): Promise<ScanResults> {
  const res = await fetch(`/api/scan/${scanId}/results`)
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to fetch scan results')
  return res.json()
}

async function startScanAPI(data: {
  siteId: string; url: string; consentConfirmedAt: string; previousScanId?: string; selectedModules: string[]; selectedForms?: FormSelection[]
}) {
  const res = await fetch('/api/scan/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Failed to start scan')
  return json as { scanId: string; siteId: string; status: string }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Poll scan status every 2 seconds until terminal state */
export function useScanStatus(scanId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['scan', scanId, 'status'],
    queryFn: () => fetchScanStatus(scanId!),
    enabled: enabled && !!scanId,
    refetchInterval: (query) => scanPollInterval(query.state.data?.status),
    staleTime: 0,
  })
}

export interface ScanWithSite {
  id: string
  status: string
  started_at: string | null
  completed_at: string | null
  created_at: string | null
  pages_discovered: number | null
  checks_total: number | null
  checks_passed: number | null
  checks_warning: number | null
  checks_failed: number | null
  critical_count: number | null
  major_count: number | null
  summary: string | null
  site_id: string
  sites: {
    id: string
    name: string | null
    url: string
    environment: string | null
  } | null
}

async function fetchScans(): Promise<ScanWithSite[]> {
  const res = await fetch('/api/scans')
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to fetch scans')
  const scans = await res.json() as ScanWithSite[]
  return scans.map(scan => ({ ...scan, summary: scanSummaryText(scan.summary) }))
}

export function useScans() {
  const qc = useQueryClient()
  const previousStatuses = useRef(new Map<string, string>())
  const query = useQuery({
    queryKey: ['scans'],
    queryFn: fetchScans,
    refetchInterval: (query) => scanListPollInterval(query.state.data),
    staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, refetchOnWindowFocus: false,
  })
  useEffect(() => {
    if (!query.data) return
    const completedSites = new Set(query.data.filter(scan => {
      const previous = previousStatuses.current.get(scan.id)
      return previous && !TERMINAL_STATUSES.includes(previous) && TERMINAL_STATUSES.includes(scan.status)
    }).map(scan => scan.site_id))
    previousStatuses.current = new Map(query.data.map(scan => [scan.id, scan.status]))
    if (completedSites.size) {
      void qc.invalidateQueries({ queryKey: ['sites'] })
      completedSites.forEach(siteId => { void qc.invalidateQueries({ queryKey: ['site', siteId] }) })
    }
  }, [query.data, qc])
  return query
}

export function useScanResults(scanId: string | null, scanStatus?: string) {
  return useQuery({
    // Include the terminal status so a response fetched during the transition
    // cannot keep an empty result cached after the worker has persisted rows.
    queryKey: ['scan', scanId, 'results', scanStatus],
    queryFn: () => fetchScanResults(scanId!),
    enabled: !!scanId && (!scanStatus || TERMINAL_STATUSES.includes(scanStatus)),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

/** Start a new scan */
export function useStartScan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: startScanAPI,
    onSuccess: (data) => {
      // Invalidate site data so it shows updated scan state
      qc.invalidateQueries({ queryKey: ['site', data.siteId] })
      qc.invalidateQueries({ queryKey: ['sites'] })
      qc.invalidateQueries({ queryKey: ['scans'] })
      // Start the real worker immediately for interactive dashboard scans.
      // The scheduled worker remains the fallback for queued scans.
      void fetch('/api/scan/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: data.scanId }),
      }).catch(() => undefined)
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
