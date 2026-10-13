import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { getPlanFromPriceId } from '@/lib/billing/plans'
import { getStripeClient } from '@/lib/billing/stripe'
import { recordProductEvent } from '@/lib/analytics/product-events'

async function syncSubscription(subscription: Stripe.Subscription) {
  const admin = getSupabaseAdminClient()
  const priceId = subscription.items.data[0]?.price?.id ?? null
  const metadata = subscription.metadata ?? {}
  let planFromPrice = getPlanFromPriceId(priceId)
  if (planFromPrice === 'free' && metadata.plan === 'pro') {
    // Prix inconnu (variable d'environnement absente ou changée) : on se fie au plan posé à la création du paiement.
    console.warn(`[Stripe webhook] Prix ${priceId ?? 'inconnu'} absent de STRIPE_PRICE_PRO / STRIPE_PRICE_PRO_ANNUAL, plan lu dans les métadonnées.`)
    planFromPrice = 'pro'
  }
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
    source: 'stripe',
    current_period_end: subscription.items.data[0]?.current_period_end ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) throw error
  return userId
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
    let syncedUserId: string | null = null
    if (event.type.startsWith('customer.subscription.')) {
      syncedUserId = await syncSubscription(event.data.object as Stripe.Subscription)
    } else if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (typeof session.subscription === 'string') syncedUserId = await syncSubscription(await getStripeClient().subscriptions.retrieve(session.subscription))
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const parentSubscription = invoice.parent?.subscription_details?.subscription
      if (typeof parentSubscription === 'string') syncedUserId = await syncSubscription(await getStripeClient().subscriptions.retrieve(parentSubscription))
    }
    if (syncedUserId && event.type === 'checkout.session.completed') await recordProductEvent(admin, syncedUserId, 'paid_conversion', `stripe:${event.id}`)
    await (admin as any).from('stripe_webhook_events').update({ processed_at: new Date().toISOString(), error: null }).eq('stripe_event_id', event.id)
    return NextResponse.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed'
    await (admin as any).from('stripe_webhook_events').update({ error: message }).eq('stripe_event_id', event.id)
    return NextResponse.json({ error: 'Webhook non traité' }, { status: 500 })
  }
}
