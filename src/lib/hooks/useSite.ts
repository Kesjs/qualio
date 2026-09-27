'use client'
import { useQuery } from '@tanstack/react-query'

export interface SiteDetail {
  id: string
  url: string
  name: string | null
  environment?: string | null
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
  previous_scan_id: string | null
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

import { MOCK_SITES, MOCK_SCANS } from '@/lib/mock/qa-mock-data'

async function fetchSite(siteId: string): Promise<SiteDetail> {
  if (siteId.startsWith('site-')) {
    const mockSite = Object.values(MOCK_SITES).find((s) => s.id === siteId) || MOCK_SITES.landing
    const scans = MOCK_SCANS.filter((s) => s.site_id === mockSite.id)
    return {
      id: mockSite.id,
      url: mockSite.url,
      name: mockSite.name,
      environment: mockSite.environment,
      user_id: 'mock-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_scan_id: scans[0]?.id ?? null,
      scans: scans.map((s) => ({
        id: s.id,
        status: s.status,
        started_at: s.started_at,
        completed_at: s.completed_at,
        created_at: s.created_at,
        previous_scan_id: null,
        pages_discovered: s.pages_discovered,
        checks_total: s.checks_total,
        checks_passed: s.checks_passed,
        checks_warning: s.checks_warning,
        checks_failed: s.checks_failed,
        critical_count: s.critical_count,
        major_count: s.major_count,
        summary: s.summary,
        error: null,
      })),
    }
  }

  const res = await fetch(`/api/sites/${siteId}`)
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to fetch site')
  return res.json()
}

export function useSite(siteId: string) {
  return useQuery({
    queryKey: ['site', siteId],
    queryFn: () => fetchSite(siteId),
    enabled: !!siteId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
