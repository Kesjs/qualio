import { after, NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { getPlanFromPriceId, type PlanId } from '@/lib/billing/plans'
import { getUserPlan } from '@/lib/billing/limits'
import { getStripeClient } from '@/lib/billing/stripe'
import { unlockPendingFeedback } from '@/lib/billing/unlock'
import { sendPaymentFailed, sendSubscriptionEnded, sendUpgradeConfirmed } from '@/lib/email/billing-emails'
import { recordProductEvent } from '@/lib/analytics/product-events'

async function syncSubscription(subscription: Stripe.Subscription) {
  const admin = getSupabaseAdminClient()
  const priceId = subscription.items.data[0]?.price?.id ?? null
  const metadata = subscription.metadata ?? {}
  let planFromPrice = getPlanFromPriceId(priceId)
  if (planFromPrice === 'free' && (metadata.plan === 'pro' || metadata.plan === 'agency')) {
    // Prix inconnu (variable d'environnement absente ou changée) : on se fie au plan posé à la création du paiement.
    console.warn(`[Stripe webhook] Prix ${priceId ?? 'inconnu'} absent des variables Stripe, plan lu dans les métadonnées.`)
    planFromPrice = metadata.plan as 'pro' | 'agency'
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
  return { userId, plan: plan as PlanId, subscriptionId: subscription.id, status }
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
    let synced: Awaited<ReturnType<typeof syncSubscription>> | null = null
    let paymentFailedUserId: string | null = null
    let invoiceId: string | null = null
    if (event.type.startsWith('customer.subscription.')) {
      synced = await syncSubscription(event.data.object as Stripe.Subscription)
    } else if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (typeof session.subscription === 'string') synced = await syncSubscription(await getStripeClient().subscriptions.retrieve(session.subscription))
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      invoiceId = invoice.id ?? null
      const parentSubscription = invoice.parent?.subscription_details?.subscription
      if (typeof parentSubscription === 'string') synced = await syncSubscription(await getStripeClient().subscriptions.retrieve(parentSubscription))
      if (event.type === 'invoice.payment_failed' && synced) paymentFailedUserId = synced.userId
    }

    if (synced) {
      const { userId, plan, subscriptionId, status } = synced
      if (plan !== 'free') {
        // Passage à un plan payant : débloque les avis en attente, puis confirme par email.
        const isCheckout = event.type === 'checkout.session.completed'
        after(async () => {
          try {
            const unlocked = await unlockPendingFeedback(admin, userId, plan)
            if (isCheckout) await sendUpgradeConfirmed(admin, userId, plan, unlocked, `upgrade:${subscriptionId}:${plan}`)
          } catch (unlockError) { console.error('[Stripe webhook] unlock or upgrade email failed', unlockError) }
        })
      }
      if (status === 'canceled' || (event.type === 'customer.subscription.deleted')) {
        after(async () => { try { await sendSubscriptionEnded(admin, userId, `ended:${subscriptionId}`) } catch (e) { console.error('[Stripe webhook] ended email failed', e) } })
      }
      if (event.type === 'checkout.session.completed') await recordProductEvent(admin, userId, 'paid_conversion', `stripe:${event.id}`)
    }

    if (paymentFailedUserId && invoiceId) {
      const failedUserId = paymentFailedUserId
      after(async () => {
        try { await sendPaymentFailed(admin, failedUserId, await getUserPlan(admin, failedUserId), `payment_failed:${invoiceId}`) } catch (e) { console.error('[Stripe webhook] payment failed email failed', e) }
      })
    }

    await (admin as any).from('stripe_webhook_events').update({ processed_at: new Date().toISOString(), error: null }).eq('stripe_event_id', event.id)
    return NextResponse.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed'
    await (admin as any).from('stripe_webhook_events').update({ error: message }).eq('stripe_event_id', event.id)
    return NextResponse.json({ error: 'Webhook non traité' }, { status: 500 })
  }
}
