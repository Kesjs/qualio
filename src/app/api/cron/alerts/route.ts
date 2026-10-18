import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { BILLING_PLANS, resolvePlan } from '@/lib/billing/plans'
import { writableSiteIds } from '@/lib/billing/writable'
import { pickNegativeSpike } from '@/lib/feedback/alerts'
import { alertEmail } from '@/lib/email/templates'
import { appOrigin, resolveRecipient, sendQualioEmail, isEmailConfigured } from '@/lib/email/send'
import { isoWeekKey } from '@/lib/email/policy'

/** Tous les jours : une alerte au plus par utilisateur et par semaine, si un thème négatif monte nettement. */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || request.headers.get('x-cron-secret')
  if (!expected || supplied !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isEmailConfigured()) return NextResponse.json({ processed: 0, skipped: 'email_not_configured' })
  const admin = getSupabaseAdminClient() as any
  const origin = appOrigin(request.nextUrl.origin)
  const weekKey = isoWeekKey()
  const now = Date.now()
  const since14 = new Date(now - 14 * 86400000).toISOString()
  const weekStart = now - 7 * 86400000
  const { data: sites } = await admin.from('sites').select('id, user_id, name, url, created_at')

  const sitesByUser = new Map<string, Array<{ id: string; user_id: string; name: string | null; url: string | null; created_at: string | null }>>()
  for (const site of sites ?? []) sitesByUser.set(site.user_id, [...(sitesByUser.get(site.user_id) ?? []), site])

  let sent = 0
  for (const [userId, userSites] of sitesByUser) {
    const { data: billing } = await admin.from('billing_subscriptions').select('plan, status, source, current_period_end').eq('user_id', userId).maybeSingle()
    const plan = resolvePlan(billing)
    if (plan !== 'pro' && plan !== 'agency') continue
    const { data: preferences } = await admin.from('notification_preferences').select('weekly_digest').eq('user_id', userId).maybeSingle()
    if (!preferences?.weekly_digest) continue

    let spike: { site: { id: string; name: string | null; url: string | null }; theme: string; current: number; previous: number } | null = null
    for (const siteId of writableSiteIds(userSites, BILLING_PLANS[plan].projects)) {
      const site = userSites.find((item) => item.id === siteId)
      if (!site) continue
      const { data: rows } = await admin.from('feedback_items').select('theme, created_at').eq('site_id', siteId).eq('sentiment', 'negative').not('theme', 'is', null).not('status', 'in', '(archived,locked)').gte('created_at', since14)
      const byTheme = new Map<string, { current: number; previous: number }>()
      for (const row of (rows ?? []) as Array<{ theme: string; created_at: string }>) {
        const bucket = byTheme.get(row.theme) ?? { current: 0, previous: 0 }
        if (Date.parse(row.created_at) >= weekStart) bucket.current += 1
        else bucket.previous += 1
        byTheme.set(row.theme, bucket)
      }
      const found = pickNegativeSpike([...byTheme].map(([theme, counts]) => ({ theme, ...counts })))
      if (found && (!spike || found.current > spike.current)) spike = { site, ...found }
    }
    if (!spike) continue

    await admin.from('dashboard_notifications').upsert({
      user_id: userId,
      type: 'alert',
      title: `Le thème « ${spike.theme} » monte`,
      body: `${spike.current} avis négatifs cette semaine contre ${spike.previous} la semaine précédente dans ${spike.site.name || spike.site.url || 'votre projet'}.`,
      href: '/dashboard',
      dedupe_key: `${userId}:${weekKey}:${spike.site.id}:${spike.theme}`,
    }, { onConflict: 'dedupe_key', ignoreDuplicates: true })

    const recipient = await resolveRecipient(admin, userId)
    if (!recipient) continue
    const email = alertEmail({ origin, userId, projectName: spike.site.name || spike.site.url || 'votre projet', theme: spike.theme, current: spike.current, previous: spike.previous })
    if ((await sendQualioEmail(admin, { userId, type: 'alert', eventKey: weekKey, recipient, ...email })) === 'sent') sent += 1
  }
  return NextResponse.json({ weekKey, users: sitesByUser.size, sent })
}
