import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { buildDraft } from '@/lib/admin/acquisition-draft'
import { renderAcquisitionEmail } from '@/lib/email/layout'

export const maxDuration = 60

const WAIT_DAYS = [3, 4, 5]

/** Envoie les relances approuvées par la règle de séquence, sans intervention manuelle. */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || request.headers.get('x-cron-secret')
  if (!expected || supplied !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ processed: 0, skipped: 'resend_not_configured' })
  const from = process.env.FEEDBACK_FROM_EMAIL || process.env.SMTP_USER
  if (!from) return NextResponse.json({ processed: 0, skipped: 'sender_not_configured' })

  const admin = getSupabaseAdminClient() as any
  const { data: due, error } = await admin
    .from('acquisition_messages')
    .select('id, contact_id, subject, sequence_stage, contact:acquisition_contacts(id, email, email_status, full_name, company_id, company:acquisition_companies(name))')
    .in('status', ['sent'])
    .lt('sequence_stage', 3)
    .lte('next_follow_up_at', new Date().toISOString())
    .limit(20)
  if (error) return NextResponse.json({ error: 'Impossible de charger les relances.' }, { status: 500 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0, skipped = 0, failed = 0
  for (const message of due ?? []) {
    const contact = message.contact
    if (!contact?.email || ['invalid', 'suppressed'].includes(contact.email_status)) { skipped++; continue }
    const { data: evidence } = await admin.from('acquisition_signals').select('label, evidence, source_url').eq('company_id', contact.company_id).order('confidence', { ascending: false }).limit(3)
    const draft = buildDraft({ fullName: contact.full_name, companyName: contact.company?.name, followUpOf: { subject: message.subject }, evidence: evidence ?? [] })
    const inserted = await admin.from('acquisition_messages').insert({ contact_id: contact.id, subject: draft.subject, body: draft.body, status: 'sent', follow_up_of: message.id, sequence_stage: message.sequence_stage + 1 }).select('id').single()
    if (inserted.error) { failed++; continue }
    const trackingUrl = new URL('/api/acquisition/click', request.nextUrl.origin)
    trackingUrl.searchParams.set('message', inserted.data.id)
    const email = renderAcquisitionEmail({ subject: draft.subject, body: draft.body, trackingUrl: trackingUrl.toString() })
    const result = await resend.emails.send({ from: `Qualio <${from}>`, to: contact.email, subject: draft.subject, html: email.html, replyTo: process.env.ACQUISITION_REPLY_TO || 'contact@tryqualio.pro', headers: { 'List-Unsubscribe': `<mailto:${process.env.ACQUISITION_REPLY_TO || from}?subject=stop>` } })
    if (result.error) {
      await admin.from('acquisition_messages').update({ status: 'bounced', bounced_at: new Date().toISOString(), bounce_reason: String(result.error.message ?? 'Erreur Resend').slice(0, 200) }).eq('id', inserted.data.id)
      failed++
      continue
    }
    const now = new Date()
    await admin.from('acquisition_messages').update({ provider_message_id: result.data?.id ?? null, sent_at: now.toISOString(), next_follow_up_at: message.sequence_stage + 1 < 3 ? new Date(now.getTime() + WAIT_DAYS[message.sequence_stage] * 86400000).toISOString() : null }).eq('id', inserted.data.id)
    await admin.from('acquisition_messages').update({ next_follow_up_at: null }).eq('id', message.id)
    sent++
  }
  return NextResponse.json({ processed: (due ?? []).length, sent, skipped, failed })
}
