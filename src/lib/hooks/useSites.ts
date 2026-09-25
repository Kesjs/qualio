'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SiteWithLastScan {
  id: string
  user_id: string
  url: string
  name: string | null
  created_at: string | null
  updated_at: string | null
  last_scan_id: string | null
  last_scan: {
    id: string
    status: string
    started_at: string | null
    completed_at: string | null
    pages_discovered: number | null
    checks_total: number | null
    checks_passed: number | null
    checks_warning: number | null
    checks_failed: number | null
    critical_count: number | null
    major_count: number | null
    summary: string | null
    created_at: string | null
  } | null
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchSites(): Promise<SiteWithLastScan[]> {
  const res = await fetch('/api/sites')
  if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to fetch sites')
  return res.json()
}

async function createSiteAPI(data: { url: string; name?: string }): Promise<SiteWithLastScan> {
  const res = await fetch('/api/sites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Failed to create site')
  return json
}

async function deleteSiteAPI(siteId: string) {
  const res = await fetch(`/api/sites/${siteId}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error ?? 'Failed to delete site')
  }
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: fetchSites,
  })
}

export function useCreateSite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSiteAPI,
    onSuccess: (newSite) => {
      // Optimistic: prepend to list without refetch
      qc.setQueryData<SiteWithLastScan[]>(['sites'], (old) =>
        old ? [{ ...newSite, last_scan: null }, ...old] : [{ ...newSite, last_scan: null }]
      )
      toast.success('Site added to workspace')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteSite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSiteAPI,
    onSuccess: (_, siteId) => {
      qc.setQueryData<SiteWithLastScan[]>(['sites'], (old) =>
        old ? old.filter(s => s.id !== siteId) : []
      )
      toast.success('Site removed')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
