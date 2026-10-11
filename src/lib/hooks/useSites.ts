'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export interface Site {
  id: string
  user_id: string
  url: string | null
  name: string | null
  created_at: string | null
  updated_at: string | null
}

async function fetchSites(): Promise<Site[]> {
  const response = await fetch('/api/sites')
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error ?? 'Impossible de charger les projets.')
  return body
}

async function createSiteAPI(data: { name?: string; url?: string }): Promise<Site> {
  const response = await fetch('/api/sites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error ?? 'Impossible de créer le projet.')
  return body
}

async function deleteSiteAPI(siteId: string) {
  const response = await fetch(`/api/sites/${siteId}`, { method: 'DELETE' })
  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? 'Impossible de supprimer le projet.')
  }
}

export function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: fetchSites,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCreateSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSiteAPI,
    onSuccess: (site) => {
      queryClient.setQueryData<Site[]>(['sites'], (current) => current ? [site, ...current] : [site])
      toast.success('Projet ajouté à votre espace')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeleteSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSiteAPI,
    onSuccess: (_, siteId) => {
      queryClient.setQueryData<Site[]>(['sites'], (current) => current?.filter((site) => site.id !== siteId) ?? [])
      toast.success('Projet supprimé')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
