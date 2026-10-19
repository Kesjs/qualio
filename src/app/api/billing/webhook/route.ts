import { after, NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { unlockPendingFeedback } from '@/lib/billing/unlock'
import { sendUpgradeConfirmed } from '@/lib/email/billing-emails'
import { recordProductEvent } from '@/lib/analytics/product-events'
import { verifyGeniusPaySignature } from '@/lib/billing/geniuspay'

export async function POST(request: NextRequest) {
  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET
  const signature = request.headers.get('x-webhook-signature')
  const timestamp = request.headers.get('x-webhook-timestamp')
  if (!secret || !signature || !timestamp) return NextResponse.json({ error: 'Webhook GeniusPay non configuré' }, { status: 400 })
  const payload = await request.text()
  if (!verifyGeniusPaySignature(payload, timestamp, signature, secret)) return NextResponse.json({ error: 'Signature GeniusPay invalide' }, { status: 401 })
  let event: any
  try { event = JSON.parse(payload) } catch { return NextResponse.json({ error: 'Payload invalide' }, { status: 400 }) }
  const eventId = event.id ?? `${event.event}:${event.data?.transaction?.reference ?? event.timestamp}`
  const admin = getSupabaseAdminClient()
  const { data: existing } = await (admin as any).from('geniuspay_webhook_events').select('id, processed_at').eq('event_id', eventId).maybeSingle()
  if (existing?.processed_at) return NextResponse.json({ received: true, duplicate: true })
  if (!existing) await (admin as any).from('geniuspay_webhook_events').insert({ event_id: eventId, event_type: event.event ?? 'unknown', payload: event })
  try {
    if (event.event === 'payment.success') {
      const tx = event.data?.transaction ?? event.data
      const metadata = tx?.metadata ?? {}
      const externalReference = tx?.external_reference ?? event.data?.external_reference
      const { data: intent } = await (admin as any).from('geniuspay_payment_intents').select('external_reference, user_id, plan, interval, amount, currency, status').eq('external_reference', externalReference ?? '').maybeSingle()
      const userId = intent?.user_id
      const plan = intent?.plan
      const interval = intent?.interval
      const receivedAmount = Number(tx?.amount ?? event.data?.amount)
      const receivedCurrency = String(tx?.currency ?? event.data?.currency ?? '').toUpperCase()
      const paymentStatus = String(tx?.status ?? event.data?.status ?? '').toLowerCase()
      if (!intent || intent.status === 'paid') throw new Error('Paiement GeniusPay inconnu ou déjà payé')
      if (paymentStatus && !['success', 'succeeded', 'paid', 'completed'].includes(paymentStatus)) throw new Error('Statut de paiement GeniusPay invalide')
      if (receivedAmount !== Number(intent.amount) || receivedCurrency !== String(intent.currency).toUpperCase()) throw new Error('Montant ou devise du paiement GeniusPay invalides')
      if (!userId || !plan || !interval || metadata.user_id !== userId || metadata.plan !== plan || metadata.interval !== interval) throw new Error('Métadonnées Qualio incohérentes avec le paiement')
      const periodEnd = new Date(Date.now() + (interval === 'year' ? 365 : 30) * 86400000).toISOString()
      const { error } = await (admin as any).from('billing_subscriptions').upsert({ user_id: userId, provider: 'geniuspay', provider_customer_id: tx.reference, provider_subscription_id: tx.reference, provider_price_id: `${plan}_${interval}`, stripe_customer_id: `geniuspay:${userId}`, plan, status: 'active', source: 'manual', current_period_end: periodEnd, cancel_at_period_end: false, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (error) throw error
      await (admin as any).from('geniuspay_payment_intents').update({ status: 'paid', provider_reference: tx.reference ?? null, updated_at: new Date().toISOString() }).eq('external_reference', intent.external_reference)
      after(async () => { const unlocked = await unlockPendingFeedback(admin, userId, plan); await sendUpgradeConfirmed(admin, userId, plan, unlocked, `upgrade:geniuspay:${tx.reference}`); await recordProductEvent(admin, userId, 'paid_conversion', `geniuspay:${eventId}`) })
    }
    await (admin as any).from('geniuspay_webhook_events').update({ processed_at: new Date().toISOString(), error: null }).eq('event_id', eventId)
    return NextResponse.json({ received: true })
  } catch (error) {
    await (admin as any).from('geniuspay_webhook_events').update({ error: error instanceof Error ? error.message : 'Webhook processing failed' }).eq('event_id', eventId)
    return NextResponse.json({ error: 'Webhook non traité' }, { status: 500 })
  }
}
