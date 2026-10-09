import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getPriceId, isPaidPlan, type PaidPlan } from '@/lib/billing/plans'
import { getBillingOrigin, getStripeClient } from '@/lib/billing/stripe'

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { plan?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  if (!isPaidPlan(body.plan)) return NextResponse.json({ error: 'Plan payant invalide' }, { status: 400 })
  const plan = body.plan as PaidPlan
  const priceId = getPriceId(plan)
  if (!priceId) return NextResponse.json({ error: `Le prix Stripe du plan ${plan} n'est pas configuré.` }, { status: 503 })

  const { data: current } = await (supabase as any).from('billing_subscriptions').select('stripe_customer_id, plan, status').eq('user_id', user.id).maybeSingle()
  if (current && ['active', 'trialing', 'past_due', 'unpaid', 'paused'].includes(current.status)) {
    return NextResponse.json({ error: 'Un abonnement existe déjà. Gérez-le depuis votre portail de facturation.', currentPlan: current.plan }, { status: 409 })
  }

  const stripe = getStripeClient()
  const customer = current?.stripe_customer_id
    ? current.stripe_customer_id
    : (await stripe.customers.create({ email: user.email ?? undefined, metadata: { user_id: user.id } }, { idempotencyKey: `customer:${user.id}` })).id
  const origin = getBillingOrigin(request.nextUrl.origin)
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: user.id, plan },
    subscription_data: { metadata: { user_id: user.id, plan } },
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?checkout=canceled`,
    allow_promotion_codes: true,
  }, { idempotencyKey: `checkout:${user.id}:${plan}:${Math.floor(Date.now() / 60000)}` })

  return NextResponse.json({ url: session.url })
}
