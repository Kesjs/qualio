import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { BILLING_PLANS, resolvePlan } from '@/lib/billing/plans'
import { getLockedCount } from '@/lib/billing/limits'
import { writableSiteIds } from '@/lib/billing/writable'
import { freeDigestEmail } from '@/lib/email/templates'
import { appOrigin, resolveRecipient, sendQualioEmail, isEmailConfigured } from '@/lib/email/send'
import { isoWeekKey, shouldSendFreeDigest } from '@/lib/email/policy'

/**
 * Mardi : email court pour le plan Gratuit. Aucun appel IA. Envoi seulement s'il y a assez de nouveaux avis,
 * une synthèse disponible, et moins de 2 emails ce mois-ci.
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || request.headers.get('x-cron-secret')
  if (!expected || supplied !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isEmailConfigured()) return NextResponse.json({ processed: 0, skipped: 'email_not_configured' })
  const admin = getSupabaseAdminClient() as any
  const weekKey = isoWeekKey()
  const origin = appOrigin(request.nextUrl.origin)
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const { data: sites } = await admin.from('sites').select('id, user_id, name, url, created_at')

  const sitesByUser = new Map<string, Array<{ id: string; user_id: string; name: string | null; url: string | null; created_at: string | null }>>()
  for (const site of sites ?? []) sitesByUser.set(site.user_id, [...(sitesByUser.get(site.user_id) ?? []), site])

  let sent = 0
  for (const [userId, userSites] of sitesByUser) {
    const [{ data: billing }, { data: preferences }, { count: sentLast30Days }] = await Promise.all([
      admin.from('billing_subscriptions').select('plan, status, source, current_period_end').eq('user_id', userId).maybeSingle(),
      admin.from('notification_preferences').select('weekly_digest').eq('user_id', userId).maybeSingle(),
      admin.from('email_log').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('event_type', 'free_digest').in('status', ['pending', 'sent']).gte('created_at', monthAgo),
    ])
    if (resolvePlan(billing) !== 'free') continue
    const siteId = writableSiteIds(userSites, BILLING_PLANS.free.projects)[0]
    const current = userSites.find((item) => item.id === siteId)
    if (!current) continue

    const { data: latest } = await admin.from('feedback_syntheses').select('created_at').eq('site_id', current.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    const since = latest?.created_at ?? '1970-01-01T00:00:00Z'
    const { count: newCount } = await admin.from('feedback_items').select('id', { count: 'exact', head: true }).eq('site_id', current.id).not('status', 'in', '(archived,locked)').gt('created_at', since)
    const lockedCount = await getLockedCount(admin, current.id)
    const { count: usedManual } = await admin.from('feedback_syntheses').select('id', { count: 'exact', head: true }).eq('site_id', current.id).is('week_key', null).gte('created_at', monthAgo)
    const synthesesLeft = Math.max(0, BILLING_PLANS.free.synthesisQuota.count - (usedManual ?? 0))

    if (!shouldSendFreeDigest({ newCount: newCount ?? 0, synthesesLeft, sentLast30Days: sentLast30Days ?? 0, digestEnabled: Boolean(preferences?.weekly_digest) })) continue
    const recipient = await resolveRecipient(admin, userId)
    if (!recipient) continue
    const email = freeDigestEmail({ origin, userId, projectName: current.name || current.url || 'votre projet', newCount: newCount ?? 0, lockedCount, synthesesLeft })
    if ((await sendQualioEmail(admin, { userId, type: 'free_digest', eventKey: weekKey, recipient, ...email })) === 'sent') sent += 1
  }
  return NextResponse.json({ weekKey, users: sitesByUser.size, sent })
}
