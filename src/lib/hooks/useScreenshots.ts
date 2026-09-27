'use client'
import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import { jsonToRecord, parseJourneyStepStatus } from '@/lib/qa/journeys/map-row'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Screenshot {
  id: string
  scan_id: string
  page_id: string | null
  issue_id: string | null
  storage_path: string
  viewport: string
  created_at: string | null
}

export interface ScreenshotWithSignedUrl extends Screenshot {
  signedUrl: string | null
  expiresAt: number | null // timestamp
  isLoading?: boolean
  error?: string | null
}

// Journey Step (Phase 3)
export interface JourneyStep {
  id: string
  scan_id: string
  page_id: string | null
  issue_id: string | null
  journey_name: string
  step_order: number
  step_name: string
  action_type: string
  action_target: string | null
  action_details: Record<string, unknown>
  status: 'pass' | 'fail' | 'not_reached' | 'skip'
  result_payload: Record<string, unknown>
  error_message: string | null
  screenshot_id: string | null
  duration_ms: number
  created_at: string | null
}

export interface JourneySummary {
  journey_name: string
  steps_total: number
  steps_passed: number
  steps_failed: number
  steps_not_reached: number
  status: 'pass' | 'fail' | 'partial'
}

type JourneyStepRow = Database['public']['Tables']['journey_steps']['Row']

type ScreenshotRow = Database['public']['Tables']['screenshots']['Row']

function mapScreenshot(row: ScreenshotRow): Screenshot {
  return {
    id: row.id,
    scan_id: row.scan_id,
    page_id: row.page_id,
    issue_id: row.issue_id,
    storage_path: row.storage_path,
    viewport: row.viewport ?? 'desktop',
    created_at: row.created_at,
  }
}

function mapJourneyStep(row: JourneyStepRow): JourneyStep {
  return {
    id: row.id,
    scan_id: row.scan_id,
    page_id: row.page_id,
    issue_id: row.issue_id,
    journey_name: row.journey_name,
    step_order: row.step_order,
    step_name: row.step_name,
    action_type: row.action_type,
    action_target: row.action_target ?? null,
    action_details: jsonToRecord(row.action_details),
    status: parseJourneyStepStatus(row.status),
    result_payload: jsonToRecord(row.result_payload),
    error_message: row.error_message,
    screenshot_id: row.screenshot_id,
    duration_ms: row.duration_ms ?? 0,
    created_at: row.created_at,
  }
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

/** Récupère tous les screenshots d'un scan depuis la table screenshots */
async function fetchScanScreenshots(scanId: string): Promise<Screenshot[]> {
  const supabase = getSupabaseBrowserClient()
  
  const { data, error } = await supabase
    .from('screenshots')
    .select('*')
    .eq('scan_id', scanId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur récupération screenshots:', error)
    throw new Error('Impossible de récupérer les screenshots')
  }

  return (data ?? []).map(mapScreenshot)
}

/** Récupère les screenshots associés à un incident spécifique */
async function fetchIssueScreenshots(issueId: string): Promise<Screenshot[]> {
  const supabase = getSupabaseBrowserClient()
  
  const { data, error } = await supabase
    .from('screenshots')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur récupération screenshots par issue:', error)
    throw new Error('Impossible de récupérer les screenshots')
  }

  return (data ?? []).map(mapScreenshot)
}

/**
 * Récupère les screenshots Before/After pour un incident résolu
 * - Before : screenshot du scan initial (celui qui a créé l'incident)
 * - After : screenshot du rescan qui l'a marqué RESOLVED
 */
async function fetchBeforeAfterScreenshots(
  issueId: string,
  pageId: string | null
): Promise<{ before: Screenshot | null; after: Screenshot | null }> {
  const supabase = getSupabaseBrowserClient()

  if (!pageId) {
    return { before: null, after: null }
  }

  // Récupérer tous les screenshots de cette issue
  const { data: issueScreenshots, error: issueError } = await supabase
    .from('screenshots')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true }) // Plus ancien en premier

  if (issueError) {
    console.error('Erreur récupération screenshots before/after:', issueError)
    return { before: null, after: null }
  }

  // Récupérer tous les screenshots de cette page (pour trouver le "after" du rescan)
  const { data: pageScreenshots, error: pageError } = await supabase
    .from('screenshots')
    .select('*')
    .eq('page_id', pageId)
    .order('created_at', { ascending: false }) // Plus récent en premier

  if (pageError) {
    console.error('Erreur récupération screenshots de la page:', pageError)
    return { before: null, after: null }
  }

  // Before : le premier screenshot de l'issue (scan initial)
  const before = issueScreenshots?.[0] || null

  // After : chercher un screenshot plus récent de la même page
  // mais d'un scan différent (le rescan)
  const after = pageScreenshots?.find(
    (s) => before && s.scan_id !== before.scan_id && s.created_at! > before.created_at!
  ) || null

  return { before, after }
}

/** Génère une URL signée pour un screenshot via l'API */
async function fetchSignedUrl(screenshotId: string): Promise<{
  signedUrl: string
  expiresIn: number
  viewport: string
  createdAt: string | null
}> {
  const res = await fetch(`/api/screenshots/${screenshotId}/signed-url`)
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erreur serveur' }))
    throw new Error(error.error || 'Impossible de générer l\'URL signée')
  }

  return res.json()
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Hook pour récupérer tous les screenshots d'un scan
 * Charge uniquement les métadonnées, pas les URLs signées (lazy loading)
 */
export function useScanScreenshots(scanId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['screenshots', 'scan', scanId],
    queryFn: () => fetchScanScreenshots(scanId!),
    enabled: enabled && !!scanId,
    staleTime: 5 * 60 * 1000, // 5min — screenshots ne changent pas après scan
    gcTime: 15 * 60 * 1000,
  })
}

/**
 * Hook pour récupérer les screenshots d'un incident spécifique
 */
export function useIssueScreenshots(issueId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['screenshots', 'issue', issueId],
    queryFn: () => fetchIssueScreenshots(issueId!),
    enabled: enabled && !!issueId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

/**
 * Hook pour récupérer l'URL signée d'un screenshot spécifique
 * Génère l'URL à la demande (drawer ouvert, hover, etc.)
 */
export function useScreenshotSignedUrl(screenshotId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['screenshot', screenshotId, 'signed-url'],
    queryFn: () => fetchSignedUrl(screenshotId!),
    enabled: enabled && !!screenshotId,
    staleTime: 50 * 60 * 1000, // 50min — régénérer avant expiration (1h)
    gcTime: 60 * 60 * 1000, // 1h
    retry: 2, // Retry en cas d'échec temporaire
  })
}

/**
 * Hook pour récupérer les screenshots Before/After d'un incident résolu
 * - Charge uniquement si l'incident est RESOLVED
 * - Before : screenshot du scan initial
 * - After : screenshot du rescan qui l'a résolu
 */
export function useBeforeAfterScreenshots(
  issueId: string | null,
  pageId: string | null,
  isResolved: boolean,
  enabled = true
) {
  return useQuery({
    queryKey: ['screenshots', 'before-after', issueId, pageId],
    queryFn: () => fetchBeforeAfterScreenshots(issueId!, pageId),
    enabled: enabled && isResolved && !!issueId && !!pageId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

// ─── Journey Steps Hooks (Phase 3) ────────────────────────────────────────────

/**
 * Récupère tous les journey steps d'un scan
 */
async function fetchJourneySteps(scanId: string): Promise<JourneyStep[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('journey_steps')
    .select('*')
    .eq('scan_id', scanId)
    .order('journey_name', { ascending: true })
    .order('step_order', { ascending: true })

  if (error) {
    console.error('Erreur récupération journey steps:', error)
    throw new Error('Impossible de récupérer les journey steps')
  }

  return (data ?? []).map(mapJourneyStep)
}

/**
 * Récupère les steps d'un journey spécifique
 */
async function fetchJourneyStepsByName(
  scanId: string,
  journeyName: string
): Promise<JourneyStep[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('journey_steps')
    .select('*')
    .eq('scan_id', scanId)
    .eq('journey_name', journeyName)
    .order('step_order', { ascending: true })

  if (error) {
    console.error('Erreur récupération journey steps by name:', error)
    throw new Error('Impossible de récupérer les journey steps')
  }

  return (data ?? []).map(mapJourneyStep)
}

/**
 * Hook pour récupérer tous les journey steps d'un scan
 */
export function useScanJourneySteps(scanId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['journey-steps', 'scan', scanId],
    queryFn: () => fetchJourneySteps(scanId!),
    enabled: enabled && !!scanId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

/**
 * Hook pour récupérer les steps d'un journey spécifique
 */
export function useJourneySteps(
  scanId: string | null,
  journeyName: string | null,
  enabled = true
) {
  return useQuery({
    queryKey: ['journey-steps', scanId, journeyName],
    queryFn: () => fetchJourneyStepsByName(scanId!, journeyName!),
    enabled: enabled && !!scanId && !!journeyName,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })
}

/**
 * Hook pour récupérer un résumé des journeys d'un scan
 * Groupe les steps par journey et calcule les statistiques
 */
export function useScanJourneysSummary(scanId: string | null, enabled = true) {
  const { data: steps, ...rest } = useScanJourneySteps(scanId, enabled)

  const summaries: JourneySummary[] = React.useMemo(() => {
    if (!steps || steps.length === 0) return []

    const journeyMap = new Map<string, JourneyStep[]>()
    steps.forEach((step) => {
      if (!journeyMap.has(step.journey_name)) {
        journeyMap.set(step.journey_name, [])
      }
      journeyMap.get(step.journey_name)!.push(step)
    })

    return Array.from(journeyMap.entries()).map(([journeyName, journeySteps]) => {
      const stepsPassed = journeySteps.filter((s) => s.status === 'pass').length
      const stepsFailed = journeySteps.filter((s) => s.status === 'fail').length
      const stepsNotReached = journeySteps.filter((s) => s.status === 'not_reached').length
      const stepsTotal = journeySteps.length

      let status: 'pass' | 'fail' | 'partial' = 'pass'
      if (stepsFailed > 0) {
        status = 'fail'
      } else if (stepsNotReached > 0) {
        status = 'partial'
      }

      return {
        journey_name: journeyName,
        steps_total: stepsTotal,
        steps_passed: stepsPassed,
        steps_failed: stepsFailed,
        steps_not_reached: stepsNotReached,
        status,
      }
    })
  }, [steps])

  return {
    data: summaries,
    steps,
    ...rest,
  }
}

// Note: React import nécessaire pour useMemo
import React from 'react'
