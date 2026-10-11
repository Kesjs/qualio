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
    }) as { type?: string; data?: { email_id?: string } }
    if (event.type !== 'email.opened' || !event.data?.email_id) return NextResponse.json({ ok: true })
    const admin = getSupabaseAdminClient() as any
    await admin.from('email_log').update({ opened_at: new Date().toISOString() }).eq('provider_id', event.data.email_id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 401 })
  }
}
