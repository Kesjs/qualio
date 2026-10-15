import { Resend } from 'resend'
import { isMarketingType, WEEKLY_MARKETING_CAP } from '@/lib/email/policy'

export type SendResult = 'sent' | 'duplicate' | 'capped' | 'failed' | 'not_configured'

/**
 * Envoi journalisé : une ligne email_log par (utilisateur, type, clé) rend l'envoi idempotent.
 * Les emails marketing sont plafonnés à WEEKLY_MARKETING_CAP par utilisateur et par 7 jours.
 * Les emails de service (paiement, limite, bienvenue) ne sont pas plafonnés.
 */
export async function sendQualioEmail(admin: any, input: { userId: string; type: string; eventKey: string; recipient: string; subject: string; html: string; text: string }): Promise<SendResult> {
  if (!process.env.RESEND_API_KEY || !process.env.FEEDBACK_FROM_EMAIL) return 'not_configured'

  if (isMarketingType(input.type)) {
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const { count } = await admin.from('email_log').select('id', { count: 'exact', head: true }).eq('user_id', input.userId).in('event_type', ['weekly_digest', 'calm_digest', 'free_digest', 'alert']).in('status', ['pending', 'sent']).gte('created_at', since)
    if ((count ?? 0) >= WEEKLY_MARKETING_CAP) return 'capped'
  }

  const { data: logged, error: insertError } = await admin.from('email_log').insert({ user_id: input.userId, event_type: input.type, event_key: input.eventKey, recipient: input.recipient, status: 'pending' }).select('id').single()
  if (insertError || !logged) return insertError?.code === '23505' ? 'duplicate' : 'failed'

  const resend = new Resend(process.env.RESEND_API_KEY)
  const result = await resend.emails.send({ from: process.env.FEEDBACK_FROM_EMAIL, to: input.recipient, subject: input.subject, html: input.html, text: input.text })
  if (result.error) {
    await admin.from('email_log').update({ status: 'failed', attempt_count: 1, last_error: result.error.message }).eq('id', logged.id)
    return 'failed'
  }
  await admin.from('email_log').update({ status: 'sent', attempt_count: 1, provider_id: result.data?.id ?? null, sent_at: new Date().toISOString() }).eq('id', logged.id)
  return 'sent'
}

/** Adresse de l'utilisateur. En développement, on n'écrit qu'à l'adresse de test. */
export async function resolveRecipient(admin: any, userId: string): Promise<string | null> {
  if (process.env.NODE_ENV !== 'production') return process.env.RESEND_TEST_EMAIL ?? null
  const { data } = await admin.auth.admin.getUserById(userId)
  return data.user?.email ?? null
}

export function appOrigin(fallback: string) {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || fallback
}
