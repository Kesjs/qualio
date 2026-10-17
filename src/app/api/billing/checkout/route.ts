import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { isBillingInterval, isPaidPlan, type PaidPlan } from '@/lib/billing/plans'
import { createGeniusPayPayment } from '@/lib/billing/geniuspay'

const PLAN_AMOUNTS: Record<PaidPlan, { month: number; year: number }> = { pro: { month: 19 * 655.957, year: 190 * 655.957 }, agency: { month: 49 * 655.957, year: 490 * 655.957 } }

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: { plan?: string; interval?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  if (!isPaidPlan(body.plan)) return NextResponse.json({ error: 'Plan payant invalide' }, { status: 400 })
  if (body.interval !== undefined && !isBillingInterval(body.interval)) return NextResponse.json({ error: 'Période de facturation invalide' }, { status: 400 })
  const plan = body.plan as PaidPlan
  const interval = isBillingInterval(body.interval) ? body.interval : 'month'
  const { data: current } = await (supabase as any).from('billing_subscriptions').select('plan, status, source').eq('user_id', user.id).maybeSingle()
  if (current?.source === 'geniuspay' && ['active', 'trialing'].includes(current.status)) return NextResponse.json({ error: 'Un accès payant existe déjà.' }, { status: 409 })
  const origin = request.nextUrl.origin
  const externalReference = `qualio:${user.id}:${plan}:${interval}:${Date.now()}`
  const payment = await createGeniusPayPayment({ amount: Math.round(PLAN_AMOUNTS[plan][interval]), externalReference, description: `Qualio ${plan === 'agency' ? 'Agence' : 'Pro'} — ${interval === 'year' ? 'annuel' : 'mensuel'}`, customer: { email: user.email ?? undefined }, metadata: { user_id: user.id, plan, interval, provider: 'geniuspay' }, successUrl: `${origin}/billing/success`, errorUrl: `${origin}/pricing?checkout=canceled` })
  return NextResponse.json({ url: payment.checkout_url, reference: payment.reference })
}
