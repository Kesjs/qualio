import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { BILLING_PLANS, getIntervalFromPriceId, resolvePlan } from '@/lib/billing/plans'
import { writableSiteIds as writableSiteIdsFor } from '@/lib/billing/writable'
import { getFeedbackCapacity, getSynthesisAvailability, getWritableSiteIds } from '@/lib/billing/limits'

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [{ data }, { data: siteRows }] = await Promise.all([
    (supabase as any).from('billing_subscriptions').select('plan, status, source, stripe_price_id, current_period_end, cancel_at_period_end').eq('user_id', user.id).maybeSingle(),
    supabase.from('sites').select('id, created_at').eq('user_id', user.id),
  ])
  const plan = resolvePlan(data)
  const projectCount = siteRows?.length ?? 0
  const writableSiteIds = writableSiteIdsFor(siteRows ?? [], BILLING_PLANS[plan].projects)
  const limits = BILLING_PLANS[plan]
  const effectiveStatus = plan === 'free' && data?.status !== 'free' ? 'free' : data?.status ?? 'free'

  // Usage d'un projet (compteur « 32 / 50 avis », prochaine synthèse possible) quand siteId est fourni.
  let site: { feedback: number; feedbackLimit: number; lastSynthesisAt: string | null; nextSynthesisAt: string | null } | null = null
  const siteId = request.nextUrl.searchParams.get('siteId')
  if (siteId) {
    const { data: owned } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle()
    if (owned) {
      const [capacity, availability] = await Promise.all([getFeedbackCapacity(supabase, siteId, plan), getSynthesisAvailability(supabase, siteId, plan)])
      site = { feedback: capacity.used, feedbackLimit: capacity.limit, lastSynthesisAt: availability.lastAt, nextSynthesisAt: availability.nextAvailableAt }
    }
  }

  return NextResponse.json({
    plan,
    label: data?.source === 'manual' && plan !== 'free' ? `${limits.label} (accès test)` : limits.label,
    status: effectiveStatus,
    source: data?.source ?? null,
    interval: data?.source === 'stripe' ? getIntervalFromPriceId(data.stripe_price_id) : null,
    currentPeriodEnd: data?.current_period_end ?? null,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
    limits: { projects: limits.projects, feedbackPerProject: limits.feedbackPerProject, synthesisCooldownHours: limits.synthesisCooldownHours, widget: limits.widget },
    usage: { projects: projectCount },
    writableSiteIds,
    site,
  })
}
