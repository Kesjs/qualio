import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { activationNudgeEmail, decisionReminderEmail, feedbackRequestEmail, projectNudgeEmail } from '@/lib/email/templates'
import { appOrigin, resolveRecipient, sendQualioEmail, isEmailConfigured } from '@/lib/email/send'
import { LIFECYCLE_BATCH_LIMIT, LIFECYCLE_EVENT_KEY, LIFECYCLE_STAGES, type LifecycleStage } from '@/lib/email/lifecycle'

const BUILDERS: Record<LifecycleStage, (input: { origin: string; userId: string }) => { subject: string; html: string; text: string }> = {
  activation_nudge: activationNudgeEmail,
  project_nudge: projectNudgeEmail,
  feedback_request: feedbackRequestEmail,
  decision_reminder: decisionReminderEmail,
}

/**
 * Relances de cycle de vie, un email par étape et par utilisateur.
 * La sélection (consentement, désinscription, fenêtre de dates, envois passés) est faite en SQL
 * par lifecycle_email_candidates : plus de lecture limitée à 1 000 utilisateurs ni de requêtes en boucle.
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || request.headers.get('x-cron-secret')
  if (!expected || supplied !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isEmailConfigured()) return NextResponse.json({ processed: 0, skipped: 'email_not_configured' })

  const admin = getSupabaseAdminClient() as any
  const origin = appOrigin(request.nextUrl.origin)
  const byStage: Record<string, { candidates: number; sent: number; capped: number; failed: number }> = {}
  const errors: string[] = []
  let sent = 0

  for (const { stage, minDays, maxDays } of LIFECYCLE_STAGES) {
    const { data, error } = await admin.rpc('lifecycle_email_candidates', { p_stage: stage, p_min_days: minDays, p_max_days: maxDays, p_limit: LIFECYCLE_BATCH_LIMIT })
    if (error) {
      console.error(`[lifecycle] ${stage}`, error.message)
      errors.push(stage)
      continue
    }
    const stats = { candidates: 0, sent: 0, capped: 0, failed: 0 }
    for (const row of (data ?? []) as Array<{ candidate_id: string }>) {
      stats.candidates += 1
      const recipient = await resolveRecipient(admin, row.candidate_id)
      if (!recipient) continue
      const email = BUILDERS[stage]({ origin, userId: row.candidate_id })
      const result = await sendQualioEmail(admin, { userId: row.candidate_id, type: stage, eventKey: LIFECYCLE_EVENT_KEY, recipient, ...email })
      if (result === 'sent') { stats.sent += 1; sent += 1 }
      else if (result === 'capped') stats.capped += 1
      else if (result === 'failed') stats.failed += 1
    }
    byStage[stage] = stats
  }

  if (errors.length === LIFECYCLE_STAGES.length) return NextResponse.json({ error: 'Impossible de lire les candidats.' }, { status: 500 })
  return NextResponse.json({ sent, byStage, ...(errors.length ? { stagesInError: errors } : {}) })
}
