import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { isMarketingType, WEEKLY_CAP_COUNTED_TYPES, WEEKLY_MARKETING_CAP } from '@/lib/email/policy'

export type SendResult = 'sent' | 'duplicate' | 'capped' | 'failed' | 'not_configured'

/**
 * Envoi journalisé : une ligne email_log par (utilisateur, type, clé) rend l'envoi idempotent.
 * Supporte le SMTP direct Hostinger (si SMTP_PASSWORD défini) ou Resend (si RESEND_API_KEY défini).
 * Les emails marketing sont plafonnés à WEEKLY_MARKETING_CAP par utilisateur et par 7 jours.
 * Les emails de service (paiement, limite, bienvenue) ne sont pas plafonnés.
 */
export async function sendQualioEmail(admin: any, input: { userId: string; type: string; eventKey: string; recipient: string; subject: string; html: string; text: string }): Promise<SendResult> {
  const smtpPassword = process.env.SMTP_PASSWORD || process.env.HOSTINGER_EMAIL_PASSWORD
  const hasResend = Boolean(process.env.RESEND_API_KEY)

  if (!smtpPassword && !hasResend) return 'not_configured'
  if (!process.env.FEEDBACK_FROM_EMAIL && !process.env.SMTP_USER) return 'not_configured'

  if (isMarketingType(input.type)) {
    const since = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const { count } = await admin.from('email_log').select('id', { count: 'exact', head: true }).eq('user_id', input.userId).in('event_type', [...WEEKLY_CAP_COUNTED_TYPES]).in('status', ['pending', 'sent']).gte('created_at', since)
    if ((count ?? 0) >= WEEKLY_MARKETING_CAP) return 'capped'
  }

  const { data: logged, error: insertError } = await admin.from('email_log').insert({ user_id: input.userId, event_type: input.type, event_key: input.eventKey, recipient: input.recipient, status: 'pending' }).select('id').single()
  if (insertError || !logged) return insertError?.code === '23505' ? 'duplicate' : 'failed'

  const fromEmail = process.env.SMTP_USER || process.env.FEEDBACK_FROM_EMAIL || 'contact@tryqualio.pro'

  // 1. Envoi via Hostinger SMTP si mot de passe configuré
  if (smtpPassword) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.hostinger.com',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: (Number(process.env.SMTP_PORT) || 465) === 465,
        auth: {
          user: fromEmail,
          pass: smtpPassword,
        },
      })

      const info = await transporter.sendMail({
        from: `"Qualio" <${fromEmail}>`,
        to: input.recipient,
        subject: input.subject,
        html: input.html,
        text: input.text,
      })

      await admin.from('email_log').update({ status: 'sent', attempt_count: 1, provider_id: info.messageId, sent_at: new Date().toISOString() }).eq('id', logged.id)
      return 'sent'
    } catch (smtpErr) {
      const msg = smtpErr instanceof Error ? smtpErr.message : String(smtpErr)
      await admin.from('email_log').update({ status: 'failed', attempt_count: 1, last_error: msg }).eq('id', logged.id)
      console.error('[sendQualioEmail] Erreur SMTP Hostinger:', smtpErr)
      return 'failed'
    }
  }

  // 2. Envoi via Resend en alternative
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const result = await resend.emails.send({ from: fromEmail, to: input.recipient, subject: input.subject, html: input.html, text: input.text })
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

/** Vrai si un moyen d'envoi (SMTP ou Resend) et une adresse d'expéditeur sont configurés : même règle que sendQualioEmail. */
export function isEmailConfigured() {
  const hasTransport = Boolean(process.env.SMTP_PASSWORD || process.env.HOSTINGER_EMAIL_PASSWORD || process.env.RESEND_API_KEY)
  return hasTransport && Boolean(process.env.FEEDBACK_FROM_EMAIL || process.env.SMTP_USER)
}

export function appOrigin(fallback: string) {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || fallback
}
