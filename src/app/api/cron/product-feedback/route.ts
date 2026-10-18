import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { activationNudgeEmail, feedbackRequestEmail } from '@/lib/email/templates'
import { appOrigin, resolveRecipient, sendQualioEmail } from '@/lib/email/send'

/** Relances les premiers inscrits avec une limite d’un email par étape et par utilisateur. */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || request.headers.get('x-cron-secret')
  if (!expected || supplied !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.RESEND_API_KEY || !process.env.FEEDBACK_FROM_EMAIL) return NextResponse.json({ processed: 0, skipped: 'email_not_configured' })

  const admin = getSupabaseAdminClient() as any
  const origin = appOrigin(request.nextUrl.origin)
  const { data: listed, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) return NextResponse.json({ error: 'Impossible de lire les utilisateurs.' }, { status: 500 })
  let sent = 0
  const now = Date.now()
  for (const user of listed.users ?? []) {
    if (!user.email || !user.created_at) continue
    const age = now - Date.parse(user.created_at)
    const { count: sites } = await admin.from('sites').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    const { count: feedback } = await admin.from('product_feedback').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    const { count: events } = await admin.from('product_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    const { data: preferences } = await admin.from('notification_preferences').select('weekly_digest, consented_at, unsubscribed_at').eq('user_id', user.id).maybeSingle()
    const recipient = await resolveRecipient(admin, user.id)
    if (!recipient || (feedback ?? 0) > 0 || !preferences?.weekly_digest || !preferences.consented_at || preferences.unsubscribed_at) continue
    let type: 'activation_nudge' | 'feedback_request' | null = null
    if ((sites ?? 0) === 0 && (events ?? 0) === 0 && age >= 2 * 86400000 && age < 6 * 86400000) type = 'activation_nudge'
    if ((events ?? 0) > 0 && age >= 4 * 86400000 && age < 12 * 86400000) type = 'feedback_request'
    if (!type) continue
    const email = type === 'activation_nudge' ? activationNudgeEmail({ origin, userId: user.id }) : feedbackRequestEmail({ origin, userId: user.id })
    if ((await sendQualioEmail(admin, { userId: user.id, type, eventKey: 'v1', recipient, ...email })) === 'sent') sent += 1
  }
  return NextResponse.json({ users: listed.users?.length ?? 0, sent })
}
