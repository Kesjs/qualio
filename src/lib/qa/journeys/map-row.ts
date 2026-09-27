import type { Json } from '@/lib/supabase/database.types'
import type { Database } from '@/lib/supabase/database.types'
import type { JourneyActionType, JourneyStepResult, JourneyStepStatus } from '../types'

export type JourneyStepRow = Database['public']['Tables']['journey_steps']['Row']

export function jsonToRecord(value: Json | null): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const record: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        record[key] = val
      }
    }
    return record
  }
  return {}
}

export function recordToJson(value: Record<string, unknown> | undefined): Json {
  return JSON.parse(JSON.stringify(value ?? {})) as Json
}

export function parseJourneyActionType(value: string): JourneyActionType {
  switch (value) {
    case 'navigation':
      return 'navigate'
    case 'navigate':
    case 'click':
    case 'fill':
    case 'submit':
    case 'wait':
    case 'assert':
      return value
    default:
      return 'wait'
  }
}

export function parseJourneyStepStatus(value: string): JourneyStepStatus {
  switch (value) {
    case 'pass':
    case 'fail':
    case 'not_reached':
    case 'skip':
      return value
    default:
      return 'skip'
  }
}

export function mapJourneyStepRow(row: JourneyStepRow): JourneyStepResult {
  return {
    id: row.id,
    scanId: row.scan_id,
    pageId: row.page_id,
    issueId: row.issue_id,
    journeyName: row.journey_name,
    stepOrder: row.step_order,
    stepName: row.step_name,
    actionType: parseJourneyActionType(row.action_type),
    actionTarget: row.action_target ?? undefined,
    actionDetails: jsonToRecord(row.action_details),
    status: parseJourneyStepStatus(row.status),
    resultPayload: jsonToRecord(row.result_payload),
    errorMessage: row.error_message ?? undefined,
    screenshotId: row.screenshot_id,
    durationMs: row.duration_ms ?? 0,
    createdAt: row.created_at ?? undefined,
  }
}
