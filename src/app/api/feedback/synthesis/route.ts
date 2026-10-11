import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { generateFeedbackSynthesis } from '@/lib/feedback/ai'
import { BILLING_PLANS, normalizePlan } from '@/lib/billing/plans'

async function getUserContext() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

function monthStart() {
  const date = new Date()
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString()
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await getUserContext()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = request.nextUrl.searchParams.get('siteId')
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
  const { data, error } = await (supabase as any).from('feedback_syntheses').select('*').eq('user_id', user.id).eq('site_id', siteId).order('created_at', { ascending: false }).limit(20)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getUserContext()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { siteId?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  const siteId = typeof body.siteId === 'string' ? body.siteId.trim() : ''
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 })

  const { data: site } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const [{ data: billing }, { data: feedback, error: feedbackError }] = await Promise.all([
    (supabase as any).from('billing_subscriptions').select('plan, status').eq('user_id', user.id).maybeSingle(),
    (supabase as any).from('feedback_items').select('id, content, author_name, theme, sentiment, created_at').eq('user_id', user.id).eq('site_id', siteId).neq('status', 'archived').order('created_at', { ascending: false }).limit(100),
  ])
  if (feedbackError) return NextResponse.json({ error: feedbackError.message }, { status: 500 })
  if (!feedback || feedback.length < 3) return NextResponse.json({ error: 'Ajoutez au moins 3 avis avant de générer une synthèse.', minimum: 3, current: feedback?.length ?? 0 }, { status: 422 })

  const hasPaidAccess = billing?.status === 'active' || billing?.status === 'trialing'
  const plan = hasPaidAccess ? normalizePlan(billing?.plan) : 'free'
  const monthlyLimit = BILLING_PLANS[plan].monthlySyntheses
  const [{ count: totalCount }, { count: monthlyCount }] = await Promise.all([
    (supabase as any).from('feedback_syntheses').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('site_id', siteId),
    (supabase as any).from('feedback_syntheses').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('site_id', siteId).gte('created_at', monthStart()),
  ])
  const usedThisMonth = monthlyCount ?? 0
  const hasTrial = (totalCount ?? 0) > 0
  if ((hasTrial && usedThisMonth >= monthlyLimit) || (!hasTrial && monthlyLimit < 1)) {
    return NextResponse.json({ error: 'Votre quota de synthèses est atteint pour cette période.', plan, monthlyLimit, usedThisMonth }, { status: 429 })
  }

  try {
    const synthesis = await generateFeedbackSynthesis(feedback)
    if (!synthesis) return NextResponse.json({ error: 'La génération IA est indisponible. Vérifiez la configuration du fournisseur IA.' }, { status: 503 })
    const feedbackIds = feedback.map((item: { id: string }) => item.id)
    const { data: saved, error: saveError } = await (supabase as any).from('feedback_syntheses').insert({
      user_id: user.id,
      site_id: siteId,
      title: synthesis.title,
      summary: synthesis.summary,
      feedback_ids: feedbackIds,
      themes: synthesis.themes,
      recommendations: synthesis.recommendations,
      model: synthesis._meta?.model ?? null,
      tokens_input: synthesis._meta?.tokens_input ?? null,
      tokens_output: synthesis._meta?.tokens_output ?? null,
      cost_usd: synthesis._meta?.cost_usd ?? null,
    }).select('*').single()
    if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })

    if (synthesis.recommendations.length > 0) {
      const { error: recommendationError } = await (supabase as any).from('feedback_recommendations').insert(synthesis.recommendations.map((recommendation) => ({
        user_id: user.id,
        site_id: siteId,
        title: recommendation.title,
        description: `${recommendation.action}\n\nPourquoi : ${recommendation.rationale}`.trim(),
        feedback_ids: recommendation.feedback_ids,
      })))
      if (recommendationError) console.error('[Feedback synthesis] recommendation persistence failed', recommendationError)
    }
    return NextResponse.json({ synthesis: saved, usage: { plan, monthlyLimit, usedThisMonth: usedThisMonth + 1, trialAvailable: !hasTrial } }, { status: 201 })
  } catch (error) {
    console.error('[Feedback synthesis] generation failed', error)
    return NextResponse.json({ error: 'La génération de la synthèse a échoué. Réessayez dans un instant.' }, { status: 502 })
  }
}
