'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

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

const TERMINAL_STATUSES = ['completed', 'failed', 'partial', 'blocked']

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
  siteId: string; url: string; consentConfirmedAt: string; previousScanId?: string; selectedModules: string[]
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
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (!status || TERMINAL_STATUSES.includes(status)) return false
      return 2000 // Poll every 2s while running
    },
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
  return res.json()
}

export function useScans() {
  return useQuery({
    queryKey: ['scans'],
    queryFn: fetchScans,
    staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000, refetchOnWindowFocus: false,
  })
}

export function useScanResults(scanId: string | null, scanStatus?: string) {
  return useQuery({
    queryKey: ['scan', scanId, 'results'],
    queryFn: () => fetchScanResults(scanId!),
    enabled: !!scanId && (!scanStatus || TERMINAL_STATUSES.includes(scanStatus)),
    staleTime: 5 * 60 * 1000, // 5min — results don't change
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
