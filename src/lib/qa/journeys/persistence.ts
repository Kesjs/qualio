/**
 * Persistance des résultats de User Journeys dans Supabase
 * Upload des screenshots à l'échec et enregistrement des étapes
 */

import { getSupabaseAdminClient } from '@/lib/supabase/server'
import type { JourneyResult, JourneyStepResult } from '../types'

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

  try {
    // Persister chaque étape
    for (const step of journeyResult.steps) {
      let screenshotId: string | null = null

      // Upload du screenshot si présent (uniquement à l'échec)
      if (step.status === 'fail' && step.resultPayload?.screenshotBuffer) {
        try {
          const screenshotBuffer = Buffer.from(
            step.resultPayload.screenshotBuffer as string,
            'base64'
          )
          const storagePath = `${step.scanId}/journey_${step.journeyName.replace(/\s+/g, '_')}_step${step.stepOrder}_${Date.now()}.png`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('screenshots')
            .upload(storagePath, screenshotBuffer, {
              contentType: 'image/png',
              upsert: false,
            })

          if (uploadError) {
            console.error('Erreur upload screenshot journey step:', uploadError)
          } else {
            // Créer l'entrée dans la table screenshots
            const { data: screenshotData, error: screenshotError } = await supabase
              .from('screenshots')
              .insert({
                scan_id: step.scanId,
                page_id: step.pageId || null,
                issue_id: step.issueId || null,
                storage_path: storagePath,
                viewport: step.resultPayload?.viewport || 'desktop',
              })
              .select('id')
              .single()

            if (screenshotError) {
              console.error('Erreur création screenshot record:', screenshotError)
            } else {
              screenshotId = screenshotData.id
            }
          }

          // Nettoyer le buffer du payload avant persistance
          delete step.resultPayload.screenshotBuffer
        } catch (error) {
          console.error('Erreur traitement screenshot:', error)
        }
      }

      // Préparer le payload propre (sans le buffer screenshot)
      const cleanPayload = { ...step.resultPayload }
      delete cleanPayload.screenshotBuffer

      // Insérer l'étape dans journey_steps
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
          action_target: step.actionTarget || null,
          action_details: step.actionDetails || {},
          status: step.status,
          result_payload: cleanPayload || {},
          error_message: step.errorMessage || null,
          screenshot_id: screenshotId,
          duration_ms: step.durationMs || 0,
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
  } catch (error: any) {
    console.error('Erreur persistance journey results:', error)
    return {
      success: false,
      stepIds,
      error: error.message || 'Erreur inconnue lors de la persistance',
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

  return (
    data?.map((row) => ({
      id: row.id,
      scanId: row.scan_id,
      pageId: row.page_id,
      issueId: row.issue_id,
      journeyName: row.journey_name,
      stepOrder: row.step_order,
      stepName: row.step_name,
      actionType: row.action_type as any,
      actionTarget: row.action_target,
      actionDetails: row.action_details as Record<string, unknown>,
      status: row.status as any,
      resultPayload: row.result_payload as Record<string, unknown>,
      errorMessage: row.error_message,
      screenshotId: row.screenshot_id,
      durationMs: row.duration_ms,
      createdAt: row.created_at,
    })) || []
  )
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

  return (
    data?.map((row) => ({
      id: row.id,
      scanId: row.scan_id,
      pageId: row.page_id,
      issueId: row.issue_id,
      journeyName: row.journey_name,
      stepOrder: row.step_order,
      stepName: row.step_name,
      actionType: row.action_type as any,
      actionTarget: row.action_target,
      actionDetails: row.action_details as Record<string, unknown>,
      status: row.status as any,
      resultPayload: row.result_payload as Record<string, unknown>,
      errorMessage: row.error_message,
      screenshotId: row.screenshot_id,
      durationMs: row.duration_ms,
      createdAt: row.created_at,
    })) || []
  )
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

  // Retourner les noms uniques
  const uniqueNames = Array.from(new Set(data?.map((row) => row.journey_name) || []))
  return uniqueNames
}
