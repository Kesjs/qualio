import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAdminApi } from '@/lib/admin/auth'
import { dailyLimit, FOLLOW_UP_AFTER_DAYS, startOfTodayIso } from '@/lib/admin/acquisition'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { buildProspectMail } from '@/lib/admin/acquisition-mail'

export const maxDuration = 60

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Approuve et envoie en une seule action. Plafond journalier pour protéger la réputation du domaine. */
export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const { messageIds } = await request.json().catch(() => ({})) as { messageIds?: string[] }
  if (!Array.isArray(messageIds) || messageIds.length === 0 || messageIds.length > 25) return NextResponse.json({ error: 'Sélectionne entre 1 et 25 brouillons.' }, { status: 400 })
  // Domaine d'envoi dédié à la prospection, pour ne pas abîmer la réputation des emails du produit.
  const from = process.env.ACQUISITION_FROM_EMAIL || process.env.FEEDBACK_FROM_EMAIL || process.env.SMTP_USER
  if (!process.env.RESEND_API_KEY || !from) return NextResponse.json({ error: 'Fournisseur d’envoi non configuré (RESEND_API_KEY et ACQUISITION_FROM_EMAIL).' }, { status: 503 })
  const limit = dailyLimit()
  const admin = getSupabaseAdminClient() as any

  const { count: sentToday, error: countError } = await admin.from('acquisition_messages').select('id', { count: 'exact', head: true }).gte('sent_at', startOfTodayIso())
  if (countError) return NextResponse.json({ error: 'Impossible de vérifier la limite du jour.' }, { status: 500 })
  const remaining = limit - (sentToday ?? 0)
  if (remaining <= 0) return NextResponse.json({ error: `Limite du jour atteinte (${limit} envois). Reprends demain.` }, { status: 429 })

  const { data: messages, error } = await admin.from('acquisition_messages').select('id, subject, body, status, follow_up_of, contact:acquisition_contacts(id, email, email_status)').in('id', messageIds).in('status', ['draft', 'approved'])
  if (error) return NextResponse.json({ error: 'Impossible de charger les brouillons.' }, { status: 500 })
  if (!messages?.length) return NextResponse.json({ error: 'Ces brouillons ont déjà été traités.' }, { status: 409 })

  const batch = messages.slice(0, remaining)
  const resend = new Resend(process.env.RESEND_API_KEY)
  let sent = 0, failed = 0, skipped = 0
  for (const message of batch) {
    const contact = message.contact
    if (!contact?.email || ['suppressed', 'invalid'].includes(contact.email_status)) {
      await admin.from('acquisition_messages').update({ status: 'suppressed' }).eq('id', message.id)
      skipped += 1
      continue
    }
    const mail = buildProspectMail({ messageId: message.id, subject: message.subject, body: message.body, from })
    const result = await resend.emails.send({
      from: `Qualio <${from}>`, to: contact.email, subject: message.subject, html: mail.html, text: mail.text, replyTo: mail.replyTo, headers: mail.headers,
    })
    if (result.error) {
      await admin.from('acquisition_messages').update({ status: 'bounced', bounced_at: new Date().toISOString(), bounce_reason: `Envoi refusé : ${String(result.error.message ?? 'erreur du fournisseur').slice(0, 160)}` }).eq('id', message.id)
      failed += 1
    } else {
      const sentAt = new Date()
      await admin.from('acquisition_messages').update({ status: 'sent', provider_message_id: result.data?.id ?? null, sent_at: sentAt.toISOString(), sequence_stage: message.follow_up_of ? 1 : 0, next_follow_up_at: message.follow_up_of ? null : new Date(sentAt.getTime() + FOLLOW_UP_AFTER_DAYS * 86400000).toISOString() }).eq('id', message.id)
      // Une relance envoyée à la main remplace celle du cron : l'original ne doit plus être relancé.
      if (message.follow_up_of) await admin.from('acquisition_messages').update({ next_follow_up_at: null }).eq('id', message.follow_up_of)
      sent += 1
    }
    await pause(600)
  }
  return NextResponse.json({ sent, failed, skipped, deferred: messages.length - batch.length, remainingToday: Math.max(0, remaining - sent - failed) })
}
