import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { buildDraft } from '@/lib/admin/acquisition-draft'
import { dailyLimit, startOfTodayIso } from '@/lib/admin/acquisition'
import { buildProspectMail, senderIdentityReady } from '@/lib/admin/acquisition-mail'

export const maxDuration = 60

// Une seule relance, 4 jours après le premier envoi, puis on arrête.
const MAX_FOLLOW_UPS = 1
const WAIT_DAYS = [4]

/** Envoie les relances approuvées par la règle de séquence, sans intervention manuelle. */
export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || request.headers.get('x-cron-secret')
  if (!expected || supplied !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ processed: 0, skipped: 'resend_not_configured' })
  const from = process.env.ACQUISITION_FROM_EMAIL || process.env.FEEDBACK_FROM_EMAIL || process.env.SMTP_USER
  if (!from) return NextResponse.json({ processed: 0, skipped: 'sender_not_configured' })
  // Pas d'email commercial sans éditeur ni adresse postale.
  if (!senderIdentityReady()) return NextResponse.json({ processed: 0, skipped: 'sender_identity_missing' })

  const admin = getSupabaseAdminClient() as any
  // Même plafond journalier que l'envoi manuel : les relances en font partie.
  const { count: sentToday, error: countError } = await admin.from('acquisition_messages').select('id', { count: 'exact', head: true }).gte('sent_at', startOfTodayIso())
  if (countError) return NextResponse.json({ error: 'Impossible de vérifier la limite du jour.' }, { status: 500 })
  const remaining = dailyLimit() - (sentToday ?? 0)
  if (remaining <= 0) return NextResponse.json({ processed: 0, skipped: 'daily_limit_reached' })

  const { data: due, error } = await admin
    .from('acquisition_messages')
    .select('id, contact_id, subject, sequence_stage, contact:acquisition_contacts(id, email, email_status, full_name, company_id, company:acquisition_companies(name))')
    .in('status', ['sent'])
    .lt('sequence_stage', MAX_FOLLOW_UPS)
    .lte('next_follow_up_at', new Date().toISOString())
    .limit(Math.min(20, remaining))
  if (error) return NextResponse.json({ error: 'Impossible de charger les relances.' }, { status: 500 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const giveUp = (id: string) => admin.from('acquisition_messages').update({ next_follow_up_at: null }).eq('id', id)
  let sent = 0, skipped = 0, failed = 0
  for (const message of due ?? []) {
    const contact = message.contact
    if (!contact?.email || ['invalid', 'suppressed'].includes(contact.email_status)) { await giveUp(message.id); skipped++; continue }
    const { data: evidence } = await admin.from('acquisition_signals').select('label, evidence, source_url').eq('company_id', contact.company_id).order('confidence', { ascending: false }).limit(3)
    const draft = buildDraft({ fullName: contact.full_name, companyName: contact.company?.name, followUpOf: { subject: message.subject }, evidence: evidence ?? [] })
    const inserted = await admin.from('acquisition_messages').insert({ contact_id: contact.id, subject: draft.subject, body: draft.body, status: 'sent', follow_up_of: message.id, sequence_stage: message.sequence_stage + 1 }).select('id').single()
    if (inserted.error) { failed++; continue }
    // On clôt la séquence avant l'envoi : un échec ne doit jamais provoquer une nouvelle tentative le lendemain.
    await giveUp(message.id)
    const mail = buildProspectMail({ messageId: inserted.data.id, subject: draft.subject, body: draft.body, from })
    const result = await resend.emails.send({ from: `Qualio <${from}>`, to: contact.email, subject: draft.subject, html: mail.html, text: mail.text, replyTo: mail.replyTo, headers: mail.headers })
    if (result.error) {
      await admin.from('acquisition_messages').update({ status: 'bounced', bounced_at: new Date().toISOString(), bounce_reason: String(result.error.message ?? 'Erreur Resend').slice(0, 200) }).eq('id', inserted.data.id)
      failed++
      continue
    }
    const now = new Date()
    await admin.from('acquisition_messages').update({ provider_message_id: result.data?.id ?? null, sent_at: now.toISOString(), next_follow_up_at: message.sequence_stage + 1 < MAX_FOLLOW_UPS ? new Date(now.getTime() + WAIT_DAYS[message.sequence_stage] * 86400000).toISOString() : null }).eq('id', inserted.data.id)
    sent++
  }
  return NextResponse.json({ processed: (due ?? []).length, sent, skipped, failed })
}
