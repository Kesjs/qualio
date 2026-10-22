import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const { messageIds } = await request.json().catch(() => ({})) as { messageIds?: string[] }
  if (!Array.isArray(messageIds) || messageIds.length === 0 || messageIds.length > 25) return NextResponse.json({ error: 'Sélectionne entre 1 et 25 brouillons.' }, { status: 400 })
  const from = process.env.FEEDBACK_FROM_EMAIL || process.env.SMTP_USER
  if (!process.env.RESEND_API_KEY || !from) return NextResponse.json({ error: 'Fournisseur d’envoi non configuré.' }, { status: 503 })
  const admin = getSupabaseAdminClient() as any
  const { data: messages, error } = await admin.from('acquisition_messages').select('id, subject, body, status, contact:acquisition_contacts(email)').in('id', messageIds)
  if (error) return NextResponse.json({ error: 'Impossible de charger les brouillons.' }, { status: 500 })
  const pending = (messages ?? []).filter((message: any) => message.status === 'approved')
  if (!pending.length) return NextResponse.json({ error: 'Approuve les brouillons avant de les envoyer.' }, { status: 400 })
  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0
  for (const message of pending) {
    const recipient = message.contact?.email
    if (!recipient) continue
    const result = await resend.emails.send({ from: `Qualio <${from}>`, to: recipient, subject: message.subject, text: message.body })
    if (result.error) {
      await admin.from('acquisition_messages').update({ status: 'bounced' }).eq('id', message.id)
      continue
    }
    await admin.from('acquisition_messages').update({ status: 'sent', provider_message_id: result.data?.id ?? null, sent_at: new Date().toISOString() }).eq('id', message.id)
    sent += 1
  }
  return NextResponse.json({ sent, requested: pending.length })
}
