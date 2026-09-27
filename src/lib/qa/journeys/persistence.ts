/**
 * Persistance des résultats de User Journeys dans Supabase
 * Upload des screenshots à l'échec et enregistrement des étapes
 */

import { getSupabaseAdminClient } from '@/lib/supabase/server'
import type { JourneyResult, JourneyStepResult } from '../types'
import { mapJourneyStepRow, recordToJson } from './map-row'

function screenshotViewport(step: JourneyStepResult): string {
  const viewport = step.resultPayload?.viewport
  return typeof viewport === 'string' && viewport.length > 0 ? viewport : 'desktop'
}

/**
 * Persiste les résultats d'un journey dans Supabase
 * - Upload le screenshot si présent (uniquement à l'échec)
 * - Insère toutes les étapes dans journey_steps
 * - Retourne les IDs des étapes insérées
 */
export async function persistJourneyResults(
  journeyResult: JourneyResult
): Promise<{ success: boolean; stepIds: string[]; error?: string }> {
  const supabase = getSupabaseAdminClient()
  const stepIds: string[] = []
  const scanId = journeyResult.steps[0]?.scanId

  if (!scanId) {
    return { success: true, stepIds }
  }

  try {
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('user_id')
      .eq('id', scanId)
      .single()

    if (scanError || !scan?.user_id) {
      return {
        success: false,
        stepIds,
        error: scanError?.message || 'Impossible de récupérer user_id du scan pour le chemin Storage',
      }
    }

    const userId = scan.user_id

    for (const step of journeyResult.steps) {
      let screenshotId: string | null = null

      if (step.status === 'fail' && step.resultPayload?.screenshotBuffer) {
        try {
          const screenshotBuffer = Buffer.from(
            String(step.resultPayload.screenshotBuffer),
            'base64'
          )
          const storagePath = `${userId}/${step.scanId}/journey_${step.journeyName.replace(/\s+/g, '_')}_step${step.stepOrder}_${Date.now()}.png`

          const { error: uploadError } = await supabase.storage
            .from('screenshots')
            .upload(storagePath, screenshotBuffer, {
              contentType: 'image/png',
              upsert: false,
            })

          if (uploadError) {
            console.error('Erreur upload screenshot journey step:', uploadError)
          } else {
            const { data: screenshotData, error: screenshotError } = await supabase
              .from('screenshots')
              .insert({
                scan_id: step.scanId,
                page_id: step.pageId || null,
                issue_id: step.issueId || null,
                storage_path: storagePath,
                viewport: screenshotViewport(step),
              })
              .select('id')
              .single()

            if (screenshotError) {
              console.error('Erreur création screenshot record:', screenshotError)
            } else {
              screenshotId = screenshotData.id
            }
          }

          delete step.resultPayload.screenshotBuffer
        } catch (error) {
          console.error('Erreur traitement screenshot:', error)
        }
      }

      const cleanPayload = { ...step.resultPayload }
      delete cleanPayload.screenshotBuffer

      const { data: stepData, error: stepError } = await supabase
        .from('journey_steps')
        .insert({
          scan_id: step.scanId,
          page_id: step.pageId || null,
          issue_id: step.issueId || null,
          journey_name: step.journeyName,
          step_order: step.stepOrder,
          step_name: step.stepName,
          action_type: step.actionType,
          action_target: step.actionTarget ?? null,
          action_details: recordToJson(step.actionDetails),
          status: step.status,
          result_payload: recordToJson(cleanPayload),
          error_message: step.errorMessage ?? null,
          screenshot_id: screenshotId,
          duration_ms: step.durationMs ?? 0,
        })
        .select('id')
        .single()

      if (stepError) {
        console.error('Erreur insertion journey_step:', stepError)
        throw stepError
      }

      if (stepData?.id) {
        stepIds.push(stepData.id)
      }
    }

    return { success: true, stepIds }
  } catch (error) {
    console.error('Erreur persistance journey results:', error)
    return {
      success: false,
      stepIds,
      error: error instanceof Error ? error.message : 'Erreur inconnue lors de la persistance',
    }
  }
}

/**
 * Récupère les journey steps d'un scan depuis Supabase
 */
export async function fetchJourneySteps(scanId: string): Promise<JourneyStepResult[]> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from('journey_steps')
    .select('*')
    .eq('scan_id', scanId)
    .order('journey_name', { ascending: true })
    .order('step_order', { ascending: true })

  if (error) {
    console.error('Erreur récupération journey steps:', error)
    return []
  }

  return data?.map(mapJourneyStepRow) ?? []
}

/**
 * Récupère les journey steps d'un journey spécifique
 */
export async function fetchJourneyStepsByName(
  scanId: string,
  journeyName: string
): Promise<JourneyStepResult[]> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from('journey_steps')
    .select('*')
    .eq('scan_id', scanId)
    .eq('journey_name', journeyName)
    .order('step_order', { ascending: true })

  if (error) {
    console.error('Erreur récupération journey steps by name:', error)
    return []
  }

  return data?.map(mapJourneyStepRow) ?? []
}

/**
 * Récupère les noms de tous les journeys d'un scan
 */
export async function fetchJourneyNames(scanId: string): Promise<string[]> {
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase
    .from('journey_steps')
    .select('journey_name')
    .eq('scan_id', scanId)

  if (error) {
    console.error('Erreur récupération journey names:', error)
    return []
  }

  return Array.from(new Set(data?.map((row) => row.journey_name) ?? []))
}
