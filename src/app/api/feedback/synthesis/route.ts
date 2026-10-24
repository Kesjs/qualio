import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { generateFeedbackSynthesis } from '@/lib/feedback/ai'
import { classifyPendingFeedback } from '@/lib/feedback/classify'
import { BILLING_PLANS } from '@/lib/billing/plans'
import { getSynthesisAvailability, getUserPlan, isSiteWritable, READ_ONLY_MESSAGE } from '@/lib/billing/limits'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { recordProductEvent } from '@/lib/analytics/product-events'

export const maxDuration = 60

type FeedbackRow = { id: string; content: string; author_name: string | null; theme: string | null; sentiment: string | null; created_at: string }

async function getUserContext() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

function fingerprint(title: string, action: string) {
  return `${title} ${action}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').slice(0, 18).join('-')
}

/**
 * `supersedeOthers` : une synthèse complète (tous les avis récents) remplace les recommandations encore « à décider » qu'elle ne
 * reproduit plus. À ne PAS activer pour la synthèse hebdomadaire, qui n'analyse que les nouveaux avis.
 */
export async function persistRecommendations(supabase: any, userId: string, siteId: string, synthesisId: string, synthesis: Awaited<ReturnType<typeof generateFeedbackSynthesis>>, totalFeedback: number, options: { supersedeOthers?: boolean } = {}) {
  if (!synthesis?.recommendations.length) return
  const keptKeys: string[] = []
  for (const recommendation of synthesis.recommendations) {
    const key = fingerprint(recommendation.title, recommendation.action)
    keptKeys.push(key)
    const rationale = `${recommendation.rationale || 'Signal relevé dans les avis.'} Signal observé dans ${recommendation.feedback_ids.length} avis sur ${totalFeedback} (${Math.round(recommendation.feedback_ids.length / totalFeedback * 100)} %).`
    const { data: existing } = await supabase.from('feedback_recommendations').select('id, status, baseline_count').eq('user_id', userId).eq('site_id', siteId).eq('fingerprint', key).maybeSingle()
    if (existing?.status === 'dismissed' && (existing.baseline_count ?? 0) * 2 > recommendation.feedback_ids.length) continue
    const { count: themeCount } = await supabase.from('feedback_items').select('id', { count: 'exact', head: true }).eq('site_id', siteId).eq('theme', recommendation.theme)
    const shouldReopen = existing?.status === 'superseded' || (existing?.status === 'dismissed' && (existing.baseline_count ?? 0) * 2 <= (themeCount ?? recommendation.feedback_ids.length))
    const payload = {
      user_id: userId,
      site_id: siteId,
      synthesis_id: synthesisId,
      title: recommendation.title,
      action: recommendation.action,
      theme: recommendation.theme,
      description: `${recommendation.action}\n\nPourquoi : ${rationale}`,
      rationale,
      priority: recommendation.priority,
      confidence: recommendation.confidence,
      uncertainty: recommendation.uncertainty,
      feedback_ids: recommendation.feedback_ids,
      fingerprint: key,
      baseline_count: existing?.baseline_count ?? themeCount ?? recommendation.feedback_ids.length,
      ...(shouldReopen ? { status: 'open', decided_at: null, done_at: null, resolved_at: null } : {}),
    }
    if (existing?.id) {
      const { error } = await supabase.from('feedback_recommendations').update(payload).eq('id', existing.id).eq('user_id', userId)
      if (error) throw error
    } else {
      const { error } = await supabase.from('feedback_recommendations').insert(payload)
      if (error) throw error
    }
  }
  const safeKeys = keptKeys.filter((key) => /^[a-z0-9-]+$/.test(key))
  if (options.supersedeOthers && safeKeys.length > 0) {
    // Non bloquant : si la migration du statut « superseded » n'est pas appliquée, la synthèse reste valide.
    const { error } = await supabase.from('feedback_recommendations').update({ status: 'superseded' }).eq('user_id', userId).eq('site_id', siteId).eq('status', 'open').not('fingerprint', 'in', `(${safeKeys.join(',')})`)
    if (error) console.error('[Feedback synthesis] superseding old recommendations failed', error.message)
  }
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await getUserContext()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = request.nextUrl.searchParams.get('siteId')
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
  const { data, error } = await (supabase as any).from('feedback_syntheses').select('*').eq('user_id', user.id).eq('site_id', siteId).order('created_at', { ascending: false }).limit(20)
  if (error) return NextResponse.json({ error: 'Impossible de charger les synthèses.' }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getUserContext()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { siteId?: unknown } | null
  const siteId = typeof body?.siteId === 'string' ? body.siteId.trim() : ''
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 })

  const { data: site } = await supabase.from('sites').select('id, onboarding_method').eq('id', siteId).eq('user_id', user.id).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })
  if (!site.onboarding_method) {
    return NextResponse.json({ error: 'Terminez la configuration de votre projet avant de lancer une synthèse.', code: 'onboarding_incomplete' }, { status: 409 })
  }

  // Les avis jamais classés (échec passé, exemples, avis débloqués) le sont maintenant : la synthèse et l'écran Détails en dépendent.
  try { await classifyPendingFeedback(getSupabaseAdminClient(), siteId, { limit: 30, budgetMs: 15_000 }) } catch (error) { console.error('[Feedback synthesis] pending classification failed', error) }

  const [plan, { data: feedback, error: feedbackError }] = await Promise.all([
    getUserPlan(supabase, user.id),
    (supabase as any).from('feedback_items').select('id, content, author_name, theme, sentiment, created_at').eq('user_id', user.id).eq('site_id', siteId).not('status', 'in', '(archived,locked)').order('created_at', { ascending: false }).limit(301),
  ])
  if (feedbackError) return NextResponse.json({ error: 'Impossible de charger les avis.' }, { status: 500 })
  if (!feedback || feedback.length < 3) return NextResponse.json({ error: 'Ajoutez encore des avis pour lancer une synthèse.', minimum: 3, current: feedback?.length ?? 0 }, { status: 422 })

  // Quota de synthèses manuelles par projet (Gratuit : 2/30 jours ; Pro/Agence : 1/jour).
  // Seules les synthèses réussies sont enregistrées, donc un échec ne consomme jamais le quota.
  // Les synthèses hebdomadaires automatiques (week_key renseigné) ne comptent pas.
  if (!(await isSiteWritable(supabase, user.id, siteId, plan))) return NextResponse.json({ error: READ_ONLY_MESSAGE, quota: 'read_only', plan }, { status: 403 })
  const availability = await getSynthesisAvailability(supabase, siteId, plan)
  const lastManualAt = availability.lastAt
  const nextAvailableAt = availability.nextAvailableAt
  if (nextAvailableAt) return NextResponse.json({ error: 'Votre prochaine synthèse n’est pas encore disponible.', quota: 'synthesis', plan, cooldownHours: BILLING_PLANS[plan].synthesisCooldownHours, lastSynthesisAt: lastManualAt, nextAvailableAt }, { status: 429 })

  const { count: recentCount } = await (supabase as any).from('feedback_syntheses').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('site_id', siteId).gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
  if ((recentCount ?? 0) > 0) return NextResponse.json({ error: 'Une synthèse vient déjà d’être générée. Attendez quelques minutes avant de recommencer.' }, { status: 429 })

  const { count: previousSyntheses } = await (supabase as any).from('feedback_syntheses').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('site_id', siteId)
  const firstSynthesis = (previousSyntheses ?? 0) === 0
  const sampled = feedback.length > 300 ? feedback.slice(0, 300) : feedback
  try {
    const synthesis = await generateFeedbackSynthesis(sampled as FeedbackRow[])
    if (!synthesis) return NextResponse.json({ error: 'La génération IA est indisponible ou sa réponse ne peut pas être vérifiée.' }, { status: 503 })
    const feedbackIds = sampled.map((item: FeedbackRow) => item.id)
    const { data: saved, error: saveError } = await (supabase as any).from('feedback_syntheses').insert({
      user_id: user.id, site_id: siteId, title: synthesis.title, summary: synthesis.summary, feedback_ids: feedbackIds, themes: synthesis.themes, recommendations: synthesis.recommendations,
      model: synthesis._meta?.model ?? null, tokens_input: synthesis._meta?.tokens_input ?? null, tokens_output: synthesis._meta?.tokens_output ?? null, cost_usd: synthesis._meta?.cost_usd ?? null,
    }).select('*').single()
    if (saveError || !saved) return NextResponse.json({ error: 'La synthèse n’a pas pu être enregistrée.' }, { status: 500 })
    try {
      await persistRecommendations(supabase, user.id, siteId, saved.id, synthesis, sampled.length, { supersedeOthers: true })
    } catch (recommendationError) {
      await (supabase as any).from('feedback_syntheses').delete().eq('id', saved.id).eq('user_id', user.id)
      console.error('[Feedback synthesis] recommendation persistence failed', recommendationError)
      return NextResponse.json({ error: 'La synthèse n’a pas été enregistrée complètement. Réessayez.' }, { status: 500 })
    }
    void recordProductEvent(getSupabaseAdminClient(), user.id, firstSynthesis ? 'first_synthesis' : 'synthesis_generated', `synthesis:${saved.id}`, { site_id: siteId, plan })
    const updatedAvailability = await getSynthesisAvailability(supabase, siteId, plan)
    return NextResponse.json({ synthesis: saved, usage: { plan, cooldownHours: BILLING_PLANS[plan].synthesisCooldownHours, used: updatedAvailability.used, limit: updatedAvailability.limit, windowDays: updatedAvailability.windowDays, nextAvailableAt: updatedAvailability.nextAvailableAt, analysed: sampled.length, total: feedback.length, sampled: feedback.length > 300 } }, { status: 201 })
  } catch (error) {
    console.error('[Feedback synthesis] generation failed', error)
    return NextResponse.json({ error: 'La génération de la synthèse a échoué. Réessayez dans un instant.' }, { status: 502 })
  }
}
