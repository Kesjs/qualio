import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { getPlanFromPriceId } from '@/lib/billing/plans'
import { getStripeClient } from '@/lib/billing/stripe'

async function syncSubscription(subscription: Stripe.Subscription) {
  const admin = getSupabaseAdminClient()
  const priceId = subscription.items.data[0]?.price?.id ?? null
  const planFromPrice = getPlanFromPriceId(priceId)
  const metadata = subscription.metadata ?? {}
  let userId = metadata.user_id || null
  if (!userId) {
    const { data: existing } = await (admin as any).from('billing_subscriptions').select('user_id').eq('stripe_customer_id', String(subscription.customer)).maybeSingle()
    userId = existing?.user_id ?? null
  }
  if (!userId) throw new Error(`No Qualio user for Stripe subscription ${subscription.id}`)
  const status = subscription.status as string
  const plan = status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired' ? 'free' : planFromPrice
  const { error } = await (admin as any).from('billing_subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: String(subscription.customer),
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan,
    status,
    current_period_end: subscription.items.data[0]?.current_period_end ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !secret) return NextResponse.json({ error: 'Webhook Stripe non configuré' }, { status: 400 })
  const payload = await request.text()
  let event: Stripe.Event
  try { event = getStripeClient().webhooks.constructEvent(payload, signature, secret) } catch { return NextResponse.json({ error: 'Signature Stripe invalide' }, { status: 400 }) }

  const admin = getSupabaseAdminClient()
  const { data: existing } = await (admin as any).from('stripe_webhook_events').select('id, processed_at').eq('stripe_event_id', event.id).maybeSingle()
  if (existing?.processed_at) return NextResponse.json({ received: true, duplicate: true })
  if (!existing) await (admin as any).from('stripe_webhook_events').insert({ stripe_event_id: event.id, event_type: event.type, payload: event })

  try {
    if (event.type.startsWith('customer.subscription.')) {
      await syncSubscription(event.data.object as Stripe.Subscription)
    } else if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (typeof session.subscription === 'string') await syncSubscription(await getStripeClient().subscriptions.retrieve(session.subscription))
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const parentSubscription = invoice.parent?.subscription_details?.subscription
      if (typeof parentSubscription === 'string') await syncSubscription(await getStripeClient().subscriptions.retrieve(parentSubscription))
    }
    await (admin as any).from('stripe_webhook_events').update({ processed_at: new Date().toISOString(), error: null }).eq('stripe_event_id', event.id)
    return NextResponse.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed'
    await (admin as any).from('stripe_webhook_events').update({ error: message }).eq('stripe_event_id', event.id)
    return NextResponse.json({ error: 'Webhook non traité' }, { status: 500 })
  }
}
