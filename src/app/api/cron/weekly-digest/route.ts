import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { generateFeedbackSynthesis } from '@/lib/feedback/ai'
import { classifyPendingFeedback } from '@/lib/feedback/classify'
import { BILLING_PLANS, resolvePlan } from '@/lib/billing/plans'
import { writableSiteIds } from '@/lib/billing/writable'
import { buildWeeklyDigestEmail, type DigestProject } from '@/lib/email/weekly-digest'
import { createUnsubscribeToken } from '@/lib/email/unsubscribe'
import { calmDigestEmail } from '@/lib/email/templates'
import { appOrigin, resolveRecipient, sendQualioEmail, isEmailConfigured } from '@/lib/email/send'
import { isoWeekKey } from '@/lib/email/policy'
import { persistRecommendations } from '@/app/api/feedback/synthesis/route'
import { recordProductEvent } from '@/lib/analytics/product-events'
import { attachEffects } from '@/lib/feedback/decision-effects'
import { effectSummary } from '@/lib/feedback/effect'

/** Décisions récentes d'un projet (acceptées ou faites) avec leur effet, pour l'email du lundi. */
async function loadDecisions(admin: any, userId: string, siteId: string, plan: 'pro' | 'agency') {
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString()
  const { data } = await admin.from('feedback_recommendations').select('title, status, theme, decided_at').eq('user_id', userId).eq('site_id', siteId).in('status', ['accepted', 'done']).gte('decided_at', since).order('decided_at', { ascending: false }).limit(3)
  const withEffects = await attachEffects(admin, { userId, siteId, plan, recommendations: (data ?? []) as Array<{ title: string; status: string; theme: string | null; decided_at: string | null }> })
  return withEffects.flatMap((item) => {
    const effect = effectSummary(item.effect)
    return effect ? [{ title: item.title, effect }] : []
  })
}

type SiteRow = { id: string; user_id: string; name: string | null; url: string | null; created_at: string | null }

/**
 * Lundi : pour Pro et Agence, une synthèse automatique par projet modifiable, puis UN email par utilisateur.
 * Sans synthèse cette semaine, Pro reçoit la version « semaine calme ».
 */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || request.headers.get('x-cron-secret')
  if (!expected || supplied !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isEmailConfigured()) return NextResponse.json({ processed: 0, skipped: 'email_not_configured' })
  const admin = getSupabaseAdminClient() as any
  const weekKey = isoWeekKey()
  const origin = appOrigin(request.nextUrl.origin)
  const { data: sites } = await admin.from('sites').select('id, user_id, name, url, created_at')

  const sitesByUser = new Map<string, SiteRow[]>()
  for (const site of (sites ?? []) as SiteRow[]) sitesByUser.set(site.user_id, [...(sitesByUser.get(site.user_id) ?? []), site])

  let generated = 0; let sent = 0
  for (const [userId, userSites] of sitesByUser) {
    const [{ data: billing }, { data: preferences }] = await Promise.all([
      admin.from('billing_subscriptions').select('plan, status, source, current_period_end').eq('user_id', userId).maybeSingle(),
      admin.from('notification_preferences').select('weekly_digest').eq('user_id', userId).maybeSingle(),
    ])
    const plan = resolvePlan(billing)
    if ((plan !== 'pro' && plan !== 'agency') || !preferences?.weekly_digest) continue

    const writable = new Set(writableSiteIds(userSites, BILLING_PLANS[plan].projects))
    const projects: DigestProject[] = []
    let userGenerated = 0
    let totalNew = 0
    let lastSynthesisAt: string | null = null
    const allDecisions: Array<{ title: string; effect: string }> = []
    for (const site of userSites.filter((item) => writable.has(item.id))) {
      const decisions = await loadDecisions(admin, userId, site.id, plan)
      allDecisions.push(...decisions)
      const [{ data: latest }, { data: existingWeek }] = await Promise.all([
        admin.from('feedback_syntheses').select('created_at').eq('site_id', site.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        admin.from('feedback_syntheses').select('id').eq('site_id', site.id).eq('week_key', weekKey).maybeSingle(),
      ])
      if (latest?.created_at && (!lastSynthesisAt || latest.created_at > lastSynthesisAt)) lastSynthesisAt = latest.created_at
      if (existingWeek) continue
      const since = latest?.created_at ?? new Date(Date.now() - 7 * 86400000).toISOString()
      try { await classifyPendingFeedback(admin, site.id, { limit: 20, budgetMs: 15_000 }) } catch (error) { console.error('[Weekly digest] pending classification failed', error) }
      const { data: feedback } = await admin.from('feedback_items').select('id, content, author_name, theme, sentiment, created_at').eq('site_id', site.id).not('status', 'in', '(archived,locked)').gt('created_at', since).order('created_at', { ascending: false }).limit(301)
      if (!feedback?.length) continue
      totalNew += feedback.length
      const name = site.name || site.url || 'Projet'
      if (feedback.length < 3) { projects.push({ name, newCount: feedback.length, recommendation: null, topTheme: null, decisions }); continue }

      const input = feedback.slice(0, 300)
      const synthesis = await generateFeedbackSynthesis(input)
      if (!synthesis) continue
      const { data: saved, error } = await admin.from('feedback_syntheses').insert({ user_id: userId, site_id: site.id, week_key: weekKey, title: synthesis.title, summary: synthesis.summary, feedback_ids: input.map((item: { id: string }) => item.id), themes: synthesis.themes, recommendations: synthesis.recommendations, model: synthesis._meta?.model ?? null, tokens_input: synthesis._meta?.tokens_input ?? null, tokens_output: synthesis._meta?.tokens_output ?? null, cost_usd: synthesis._meta?.cost_usd ?? null }).select('id').single()
      if (error || !saved) { console.error('[Weekly digest] synthesis save failed', error); continue }
      generated += 1; userGenerated += 1
      void recordProductEvent(admin, userId, 'weekly_synthesis_generated', `weekly:${site.id}:${weekKey}`, { site_id: site.id, feedback_count: feedback.length, plan })
      await persistRecommendations(admin, userId, site.id, saved.id, synthesis, feedback.length)
      const recommendation = synthesis.recommendations[0] ?? { title: 'Une nouvelle synthèse est prête.', rationale: synthesis.summary }
      projects.push({ name, newCount: feedback.length, recommendation, topTheme: synthesis.themes[0]?.name ?? null, decisions })
    }

    const recipient = await resolveRecipient(admin, userId)
    if (!recipient) continue
    if (userGenerated) {
      const email = buildWeeklyDigestEmail({ origin, unsubscribeToken: createUnsubscribeToken(userId), projects })
      const result = await sendQualioEmail(admin, { userId, type: 'weekly_digest', eventKey: weekKey, recipient, ...email })
      if (result === 'sent') sent += 1
    } else if (plan === 'pro') {
      // Semaine calme : rien à décider, mais le lien reste utile.
      const lastLabel = lastSynthesisAt ? new Date(lastSynthesisAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : null
      const email = calmDigestEmail({ origin, userId, totalNew, lastSynthesisLabel: lastLabel, decisions: allDecisions })
      const result = await sendQualioEmail(admin, { userId, type: 'calm_digest', eventKey: weekKey, recipient, ...email })
      if (result === 'sent') sent += 1
    }
  }
  return NextResponse.json({ weekKey, users: sitesByUser.size, generated, sent })
}
