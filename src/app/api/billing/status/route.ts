import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { BILLING_PLANS, getIntervalFromPriceId, resolvePlan } from '@/lib/billing/plans'
import { writableSiteIds as writableSiteIdsFor } from '@/lib/billing/writable'
import { getFeedbackCapacity, getLockedCount, getSynthesisAvailability } from '@/lib/billing/limits'

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [{ data }, { data: siteRows }] = await Promise.all([
    (supabase as any).from('billing_subscriptions').select('plan, status, source, provider, provider_price_id, stripe_price_id, current_period_end, cancel_at_period_end').eq('user_id', user.id).maybeSingle(),
    supabase.from('sites').select('id, created_at').eq('user_id', user.id),
  ])

  const plan = resolvePlan(data)
  const projectCount = siteRows?.length ?? 0
  const writableSiteIds = writableSiteIdsFor(siteRows ?? [], BILLING_PLANS[plan].projects)
  const limits = BILLING_PLANS[plan]
  const effectiveStatus = plan === 'free' ? 'free' : data?.status ?? 'free'

  // Usage d'un projet (compteur « 32 / 50 avis », prochaine synthèse possible) quand siteId est fourni.
  let site: { id: string; feedback: number; feedbackLimit: number; lockedFeedback: number; lockedPreview: Array<{ excerpt: string; created_at: string }>; lastSynthesisAt: string | null; nextSynthesisAt: string | null; synthesisUsed: number; synthesisLimit: number | null; synthesisWindowDays: number | null } | null = null
  const siteId = request.nextUrl.searchParams.get('siteId')
  if (siteId) {
    const { data: owned } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle()
    if (owned) {
      const [capacity, availability, lockedFeedback] = await Promise.all([getFeedbackCapacity(supabase, siteId, plan), getSynthesisAvailability(supabase, siteId, plan), getLockedCount(supabase, siteId)])
      const { data: lockedRows } = plan === 'free' ? await supabase.from('feedback_items').select('content, created_at').eq('site_id', siteId).eq('status', 'locked').order('created_at', { ascending: false }).limit(2) : { data: [] as Array<{ content: string; created_at: string }> }
      const lockedPreview = (lockedRows ?? []).map((row: { content: string; created_at: string }) => ({ excerpt: String(row.content ?? '').slice(0, 160), created_at: row.created_at }))
      site = { id: siteId, feedback: capacity.used, feedbackLimit: capacity.limit, lockedFeedback, lockedPreview, lastSynthesisAt: availability.lastAt, nextSynthesisAt: availability.nextAvailableAt, synthesisUsed: availability.used, synthesisLimit: availability.limit, synthesisWindowDays: availability.windowDays }
    }
  }

  const interval = data?.provider === 'geniuspay'
    ? (data.provider_price_id?.includes('year') ? 'year' : 'month')
    : (data?.source === 'stripe' ? getIntervalFromPriceId(data.stripe_price_id) : null)

  const isTestAccess = (data?.source === 'manual' && data?.provider !== 'geniuspay')

  return NextResponse.json({
    plan,
    label: isTestAccess && plan !== 'free' ? `${limits.label} (accès test)` : limits.label,
    status: effectiveStatus,
    source: data?.source ?? null,
    provider: data?.provider ?? (data?.source === 'stripe' ? 'stripe' : 'unknown'),
    interval,
    currentPeriodEnd: data?.current_period_end ?? null,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
    limits: { projects: limits.projects, feedbackPerProject: limits.feedbackPerProject, synthesisCooldownHours: limits.synthesisCooldownHours, synthesisQuota: limits.synthesisQuota ?? null, widget: limits.widget },
    usage: { projects: projectCount },
    writableSiteIds,
    site,
  })
}
