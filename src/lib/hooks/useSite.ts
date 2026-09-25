'use client'
import { useQuery } from '@tanstack/react-query'

export interface SiteDetail {
  id: string
  url: string
  name: string | null
  user_id: string
  created_at: string | null
  updated_at: string | null
  last_scan_id: string | null
  scans: ScanSummary[]
}

export interface ScanSummary {
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
  error: string | null
}

async function fetchSite(siteId: string): Promise<SiteDetail> {
  const res = await fetch(`/api/sites/${siteId}`)
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to fetch site')
  return res.json()
}

export function useSite(siteId: string) {
  return useQuery({
    queryKey: ['site', siteId],
    queryFn: () => fetchSite(siteId),
    enabled: !!siteId,
  })
}
