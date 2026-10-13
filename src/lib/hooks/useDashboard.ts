'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useActiveSite } from '@/lib/hooks/useActiveSite'
import { usePeriod, useStoredSiteId } from '@/lib/hooks/useDashboardPrefs'
import type { ActionItem, FeedbackItem, Overview, ThemeStat } from '@/lib/feedback/types'

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly body: Record<string, unknown>) { super(message) }
}

async function request<T>(url: string, init?: RequestInit, fallback = 'Action impossible pour le moment.'): Promise<T> {
  const response = await fetch(url, init)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(typeof body?.error === 'string' ? body.error : fallback, response.status, body ?? {})
  return body as T
}

const send = (url: string, method: string, payload: unknown) =>
  request<Record<string, unknown>>(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

/** Accueil : un seul appel, lancé sans attendre la liste des projets. */
export function useOverview() {
  const { siteId, hydrated } = useStoredSiteId()
  const [days] = usePeriod()
  return useQuery({
    queryKey: ['overview', siteId ?? 'auto', days],
    queryFn: () => request<Overview>(`/api/dashboard/overview?days=${days}${siteId ? `&siteId=${encodeURIComponent(siteId)}` : ''}`, undefined, 'Impossible de charger la vue d’ensemble.'),
    enabled: hydrated,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  })
}

export type FeedbackFilters = { status: 'open' | 'archived' | 'all'; theme: string; sentiment: string; source: string; q: string; days: number; page: number }

export function useFeedbackList(filters: FeedbackFilters) {
  const { activeSite } = useActiveSite()
  const siteId = activeSite?.id
  return useQuery({
    queryKey: ['feedback-list', siteId, filters],
    queryFn: () => {
      const params = new URLSearchParams({ siteId: siteId!, status: filters.status, page: String(filters.page) })
      if (filters.theme) params.set('theme', filters.theme)
      if (filters.sentiment) params.set('sentiment', filters.sentiment)
      if (filters.source) params.set('source', filters.source)
      if (filters.q) params.set('q', filters.q)
      if (filters.days) params.set('days', String(filters.days))
      return request<{ items: FeedbackItem[]; total: number; page: number; pageSize: number }>(`/api/feedback/list?${params}`, undefined, 'Impossible de charger les avis.')
    },
    enabled: Boolean(siteId),
    placeholderData: (previous) => previous,
  })
}

export function useThemes() {
  const { activeSite } = useActiveSite()
  const [days] = usePeriod()
  const siteId = activeSite?.id
  return useQuery({
    queryKey: ['themes', siteId, days],
    queryFn: () => request<{ themes: ThemeStat[] }>(`/api/feedback/themes?siteId=${siteId}&days=${days}`, undefined, 'Impossible de charger les thèmes.'),
    enabled: Boolean(siteId),
    placeholderData: (previous) => previous,
  })
}

export function useActions() {
  const { activeSite } = useActiveSite()
  const siteId = activeSite?.id
  return useQuery({
    queryKey: ['feedback-recommendations', siteId],
    queryFn: () => request<ActionItem[]>(`/api/feedback/recommendations?siteId=${siteId}`, undefined, 'Impossible de charger les actions.'),
    enabled: Boolean(siteId),
  })
}

export type SynthesisFull = { id: string; title: string; summary: string; created_at: string; themes: Array<{ name: string; count: number; insight: string }> }

export function useSyntheses() {
  const { activeSite } = useActiveSite()
  const siteId = activeSite?.id
  return useQuery({
    queryKey: ['feedback-syntheses', siteId],
    queryFn: () => request<SynthesisFull[]>(`/api/feedback/synthesis?siteId=${siteId}`, undefined, 'Impossible de charger les synthèses.'),
    enabled: Boolean(siteId),
  })
}

const QUERY_KEYS = ['overview', 'feedback', 'feedback-list', 'themes', 'feedback-recommendations', 'feedback-syntheses']

export function useInvalidateAll() {
  const queryClient = useQueryClient()
  return { invalidate: () => Promise.all(QUERY_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: [key] }))) }
}

export function useDashboardMutations() {
  const { invalidate: refreshAll } = useInvalidateAll()

  return {
    setActionStatus: useMutation({
      mutationFn: (input: { id: string; siteId: string; status: ActionItem['status'] }) => send('/api/feedback/recommendations', 'PATCH', input),
      onSuccess: refreshAll,
    }),
    updateFeedback: useMutation({
      mutationFn: (input: { ids: string[]; status?: 'open' | 'archived'; theme?: string | null }) => send('/api/feedback', 'PATCH', input),
      onSuccess: refreshAll,
    }),
    deleteFeedback: useMutation({
      mutationFn: (ids: string[]) => send('/api/feedback', 'DELETE', { ids }),
      onSuccess: refreshAll,
    }),
    renameTheme: useMutation({
      mutationFn: (input: { siteId: string; from: string; to: string }) => send('/api/feedback/themes', 'PATCH', input),
      onSuccess: refreshAll,
    }),
    generateSynthesis: useMutation({
      mutationFn: (siteId: string) => send('/api/feedback/synthesis', 'POST', { siteId }).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 429 && error.body.quota === 'synthesis') {
          const next = typeof error.body.nextAvailableAt === 'string' ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(error.body.nextAvailableAt)) : null
          const suffix = error.body.plan === 'free' ? ' Avec Pro, elle est automatique chaque semaine.' : ''
          throw new ApiError(`${next ? `Prochaine synthèse possible le ${next}.` : 'Votre prochaine synthèse n’est pas encore disponible.'}${suffix}`, 429, error.body)
        }
        throw error
      }),
      onSuccess: refreshAll,
    }),
  }
}
