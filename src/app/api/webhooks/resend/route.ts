import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook non configuré.' }, { status: 503 })
  const payload = await request.text()
  try {
    const event = new Resend().webhooks.verify({
      payload,
      webhookSecret: secret,
      headers: {
        id: request.headers.get('svix-id') ?? '',
        timestamp: request.headers.get('svix-timestamp') ?? '',
        signature: request.headers.get('svix-signature') ?? '',
      },
    }) as { type?: string; data?: { email_id?: string; reason?: string; error?: string } }
    if (!event.data?.email_id) return NextResponse.json({ ok: true })
    const admin = getSupabaseAdminClient() as any

    // Prospection : livraison et rebonds des messages d'acquisition (retrouvés via provider_message_id).
    if (event.type === 'email.delivered') {
      await admin.from('acquisition_messages').update({ delivered_at: new Date().toISOString() }).eq('provider_message_id', event.data.email_id).is('delivered_at', null)
    }
    if (['email.bounced', 'email.complained', 'email.delivery_failed'].includes(event.type ?? '')) {
      const { data: prospect } = await admin.from('acquisition_messages').select('id, contact_id').eq('provider_message_id', event.data.email_id).maybeSingle()
      if (prospect) {
        const complained = event.type === 'email.complained'
        await admin.from('acquisition_messages').update({
          status: complained ? 'suppressed' : 'bounced', bounced_at: new Date().toISOString(),
          bounce_reason: String(event.data.reason ?? event.data.error ?? (complained ? 'Signalé comme spam' : 'Adresse injoignable')).slice(0, 200),
        }).eq('id', prospect.id).neq('status', 'replied')
        await admin.from('acquisition_contacts').update({ email_status: complained ? 'suppressed' : 'invalid' }).eq('id', prospect.contact_id)
      }
    }

    if (event.type === 'email.opened') {
      await admin.from('email_log').update({ opened_at: new Date().toISOString() }).eq('provider_id', event.data.email_id)
      return NextResponse.json({ ok: true })
    }

    if (['email.bounced', 'email.complained', 'email.delivery_failed'].includes(event.type ?? '')) {
      const { data: logged } = await admin
        .from('email_log')
        .select('id, attempt_count')
        .eq('provider_id', event.data.email_id)
        .maybeSingle()
      if (logged) {
        const attemptCount = (logged.attempt_count ?? 0) + 1
        await admin.from('email_log').update({
          status: attemptCount >= 3 ? 'suppressed' : 'failed',
          attempt_count: attemptCount,
          last_error: event.data.reason ?? event.data.error ?? event.type,
        }).eq('id', logged.id)
      }
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 401 })
  }
}
