import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { generateFeedbackSynthesis } from '@/lib/feedback/ai'
import { resolvePlan } from '@/lib/billing/plans'
import { createUnsubscribeToken } from '@/lib/email/unsubscribe'
import { persistRecommendations } from '@/app/api/feedback/synthesis/route'
import { recordProductEvent } from '@/lib/analytics/product-events'

function isoWeekKey(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = start.getUTCDay() || 7
  start.setUTCDate(start.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(start.getUTCFullYear(), 0, 1))
  return `${start.getUTCFullYear()}-W${String(Math.ceil((((start.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)).padStart(2, '0')}`
}

function htmlEmail(origin: string, token: string, recommendation: { title: string; rationale?: string | null }, newCount: number) {
  const unsubscribe = `${origin}/unsubscribe?token=${encodeURIComponent(token)}`
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#171717"><p style="color:#ee6018;font-weight:700">QUALIO</p><h1>Votre semaine d’avis</h1><p>${newCount} nouveaux avis cette semaine.</p><h2>${escapeHtml(recommendation.title)}</h2><p>${escapeHtml(recommendation.rationale ?? 'Une recommandation sourcée attend votre décision.')}</p><p><a href="${origin}/dashboard/recommendations" style="display:inline-block;background:#ee6018;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Ouvrir Qualio</a></p><p style="font-size:12px;color:#666"><a href="${unsubscribe}">Ne plus recevoir le résumé hebdomadaire</a></p></div>`
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char) }

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || request.headers.get('x-cron-secret')
  if (!expected || supplied !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.RESEND_API_KEY || !process.env.FEEDBACK_FROM_EMAIL) return NextResponse.json({ processed: 0, skipped: 'email_not_configured' })
  const admin = getSupabaseAdminClient() as any
  const weekKey = isoWeekKey()
  const { data: sites } = await admin.from('sites').select('id, user_id, name, url')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || request.nextUrl.origin
  let generated = 0; let sent = 0
  for (const site of sites ?? []) {
    const [{ data: billing }, { data: preferences }, { data: latest }, { data: existingWeek }, { data: suppressedDigest }] = await Promise.all([
      admin.from('billing_subscriptions').select('plan, status, source, current_period_end').eq('user_id', site.user_id).maybeSingle(),
      admin.from('notification_preferences').select('weekly_digest').eq('user_id', site.user_id).maybeSingle(),
      admin.from('feedback_syntheses').select('created_at').eq('site_id', site.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      admin.from('feedback_syntheses').select('id').eq('site_id', site.id).eq('week_key', weekKey).maybeSingle(),
      admin.from('email_log').select('id').eq('user_id', site.user_id).eq('event_type', 'weekly_digest').eq('status', 'suppressed').limit(1).maybeSingle(),
    ])
    if (resolvePlan(billing) !== 'pro' || !preferences?.weekly_digest || existingWeek || suppressedDigest) continue
    const since = latest?.created_at ?? new Date(Date.now() - 7 * 86400000).toISOString()
    const { data: feedback } = await admin.from('feedback_items').select('id, content, author_name, theme, sentiment, created_at').eq('site_id', site.id).neq('status', 'archived').gt('created_at', since).order('created_at', { ascending: false }).limit(301)
    if (!feedback || feedback.length < 3) continue
    const synthesis = await generateFeedbackSynthesis(feedback.slice(0, 300))
    if (!synthesis) continue
    const { data: saved, error } = await admin.from('feedback_syntheses').insert({ user_id: site.user_id, site_id: site.id, week_key: weekKey, title: synthesis.title, summary: synthesis.summary, feedback_ids: feedback.slice(0, 300).map((item: { id: string }) => item.id), themes: synthesis.themes, recommendations: synthesis.recommendations, model: synthesis._meta?.model ?? null, tokens_input: synthesis._meta?.tokens_input ?? null, tokens_output: synthesis._meta?.tokens_output ?? null, cost_usd: synthesis._meta?.cost_usd ?? null }).select('id').single()
    if (error || !saved) { console.error('[Weekly digest] synthesis save failed', error); continue }
    generated += 1
    void recordProductEvent(admin, site.user_id, 'weekly_synthesis_generated', `weekly:${site.id}:${weekKey}`, { site_id: site.id, feedback_count: feedback.length })
    await persistRecommendations(admin, site.user_id, site.id, saved.id, synthesis, feedback.length)
    const { data: authUser } = await admin.auth.admin.getUserById(site.user_id)
    const realRecipient = authUser.user?.email
    const recipient = process.env.NODE_ENV === 'production' ? realRecipient : process.env.RESEND_TEST_EMAIL
    if (!recipient) continue
    const { data: logged } = await admin.from('email_log').insert({ user_id: site.user_id, event_type: 'weekly_digest', event_key: weekKey, recipient, status: 'pending' }).select('id').single()
    if (!logged) continue
    const recommendation = synthesis.recommendations[0] ?? { title: 'Une nouvelle synthèse est prête.', rationale: synthesis.summary }
    const result = await resend.emails.send({ from: process.env.FEEDBACK_FROM_EMAIL, to: recipient, subject: 'Votre résumé Qualio', html: htmlEmail(origin, createUnsubscribeToken(site.user_id), recommendation, feedback.length), text: `${feedback.length} nouveaux avis cette semaine.\n\n${recommendation.title}\n\nOuvrir Qualio : ${origin}/dashboard/recommendations` })
    if (result.error) await admin.from('email_log').update({ status: 'failed', attempt_count: 1, last_error: result.error.message }).eq('id', logged.id)
    else { sent += 1; await admin.from('email_log').update({ status: 'sent', attempt_count: 1, provider_id: result.data?.id ?? null, sent_at: new Date().toISOString() }).eq('id', logged.id) }
  }
  return NextResponse.json({ weekKey, generated, sent })
}
