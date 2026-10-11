import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { BILLING_PLANS, resolvePlan } from '@/lib/billing/plans'

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [{ data }, { count: projectCount }] = await Promise.all([
    (supabase as any).from('billing_subscriptions').select('plan, status, source, trial_ends_at, current_period_end, cancel_at_period_end').eq('user_id', user.id).maybeSingle(),
    supabase.from('sites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])
  const plan = resolvePlan(data)
  const effectiveStatus = plan === 'free' && data?.status !== 'free' ? 'free' : data?.status ?? 'free'
  const currentMonth = new Date(); const monthStart = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), 1)).toISOString()
  const { count: synthesisCount } = await (supabase as any).from('feedback_syntheses').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart)
  const trialEndsAt = data?.source === 'trial' ? data.trial_ends_at ?? null : null
  const periodEnd = data?.source === 'manual' ? data.current_period_end ?? null : data?.current_period_end ?? null
  return NextResponse.json({
    plan,
    label: data?.source === 'manual' && plan === 'pro' ? 'Pro (accès test)' : BILLING_PLANS[plan].label,
    status: effectiveStatus,
    source: data?.source ?? null,
    trialEndsAt,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
    limits: { projects: BILLING_PLANS[plan].projects, monthlySyntheses: BILLING_PLANS[plan].monthlySyntheses },
    usage: { projects: projectCount ?? 0, monthlySyntheses: synthesisCount ?? 0 },
  })
}
