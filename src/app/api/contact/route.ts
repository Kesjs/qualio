import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

const CONTACT_EMAIL = process.env.FEEDBACK_FROM_EMAIL || 'contact@tryqualio.pro'
const ADMIN_USER_ID = 'cd4d774e-7701-4149-bd1d-e34cda2c83b5' // Ken's account

// Mémoire locale pour limitation de débit basique (5 requêtes par 10 min par IP)
const ipRateMap = new Map<string, { count: number; expiresAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = ipRateMap.get(ip)
  if (!entry || entry.expiresAt < now) {
    ipRateMap.set(ip, { count: 1, expiresAt: now + 10 * 60 * 1000 })
    return false
  }
  if (entry.count >= 5) return true
  entry.count++
  return false
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Trop de messages envoyés en peu de temps. Veuillez patienter quelques minutes.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Format de requête invalide.' }, { status: 400 })
    }

    // Protection anti-spam par champ honeypot
    if (typeof body.honeypot === 'string' && body.honeypot.trim() !== '') {
      return NextResponse.json({ ok: true, message: 'Message reçu' })
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const subject = typeof body.subject === 'string' ? body.subject.trim() : 'Demande générale'
    const message = typeof body.message === 'string' ? body.message.trim() : ''

    if (!name || name.length < 2 || name.length > 120) {
      return NextResponse.json({ error: 'Veuillez renseigner votre nom (2 à 120 caractères).' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'Veuillez renseigner une adresse email valide.' }, { status: 400 })
    }

    if (!message || message.length < 10 || message.length > 5000) {
      return NextResponse.json({ error: 'Votre message doit contenir entre 10 et 5 000 caractères.' }, { status: 400 })
    }

    const cleanSubject = (subject || 'Demande de contact').slice(0, 200)

    // Préparation de l'email
    const subjectLine = `[Contact Qualio] ${cleanSubject} — ${name}`
    const textContent = `Nouveau message reçu depuis le formulaire de contact Qualio\n\nNom: ${name}\nEmail: ${email}\nSujet: ${cleanSubject}\nDate: ${new Date().toLocaleString('fr-FR', { timeZone: 'UTC' })} UTC\nIP: ${ip}\n\nMessage:\n${message}\n`

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 24px; background: #f9fafb; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #18181b; color: #ffffff; padding: 24px; text-align: left; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 600; }
    .header p { margin: 4px 0 0; font-size: 13px; color: #a1a1aa; }
    .content { padding: 24px; }
    .field { margin-bottom: 16px; }
    .field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
    .field-value { font-size: 15px; color: #111827; margin-top: 2px; }
    .message-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; white-space: pre-wrap; font-size: 14px; color: #334155; margin-top: 6px; }
    .badge { display: inline-block; background: #fff1e9; color: #ee6018; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .footer { border-top: 1px solid #f3f4f6; padding: 16px 24px; font-size: 12px; color: #9ca3af; background: #fafafa; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Nouveau message de contact</h1>
      <p>Reçu depuis le formulaire tryqualio.pro/contact</p>
    </div>
    <div class="content">
      <div class="field">
        <span class="badge">${escapeHtml(cleanSubject)}</span>
      </div>
      <div class="field">
        <div class="field-label">Expéditeur</div>
        <div class="field-value"><strong>${escapeHtml(name)}</strong> &lt;<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>&gt;</div>
      </div>
      <div class="field">
        <div class="field-label">Message</div>
        <div class="message-box">${escapeHtml(message)}</div>
      </div>
    </div>
    <div class="footer">
      Date d'envoi : ${new Date().toLocaleString('fr-FR', { timeZone: 'UTC' })} UTC · IP : ${escapeHtml(ip)}
    </div>
  </div>
</body>
</html>
    `.trim()

    let emailSent = false
    let providerId: string | null = null
    let emailError: string | null = null

    const smtpPassword = process.env.SMTP_PASSWORD || process.env.HOSTINGER_EMAIL_PASSWORD

    // 1. Priorité SMTP Hostinger si le mot de passe est configuré
    if (smtpPassword) {
      try {
        const smtpHost = process.env.SMTP_HOST || 'smtp.hostinger.com'
        const smtpPort = Number(process.env.SMTP_PORT) || 465
        const smtpUser = process.env.SMTP_USER || process.env.FEEDBACK_FROM_EMAIL || 'contact@tryqualio.pro'

        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPassword,
          },
        })

        const info = await transporter.sendMail({
          from: `"Formulaire Qualio" <${smtpUser}>`,
          to: CONTACT_EMAIL,
          replyTo: `"${name}" <${email}>`,
          subject: subjectLine,
          text: textContent,
          html: htmlContent,
        })

        emailSent = true
        providerId = info.messageId
      } catch (smtpErr) {
        emailError = smtpErr instanceof Error ? smtpErr.message : String(smtpErr)
        console.error('[Contact Form] Erreur SMTP Hostinger:', smtpErr)
      }
    } else if (process.env.RESEND_API_KEY) {
      // 2. Envoi via Resend si clé API configurée
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const recipients = [CONTACT_EMAIL]
        if (process.env.RESEND_TEST_EMAIL && !recipients.includes(process.env.RESEND_TEST_EMAIL)) {
          recipients.push(process.env.RESEND_TEST_EMAIL)
        }

        const sendResult = await resend.emails.send({
          from: CONTACT_EMAIL,
          to: recipients,
          replyTo: email,
          subject: subjectLine,
          html: htmlContent,
          text: textContent,
        })

        if (sendResult.error) {
          emailError = sendResult.error.message
          console.error('[Contact Form] Erreur Resend:', sendResult.error)
        } else {
          emailSent = true
          providerId = sendResult.data?.id ?? null
        }
      } catch (err) {
        emailError = err instanceof Error ? err.message : String(err)
        console.error('[Contact Form] Exception envoi email:', err)
      }
    } else {
      console.warn('[Contact Form] Aucun service email configuré (ni SMTP_PASSWORD pour Hostinger, ni RESEND_API_KEY).')
    }

    // Journalisation dans Supabase pour ne perdre aucun prospect
    try {
      const admin = getSupabaseAdminClient() as any
      await admin.from('email_log').insert({
        user_id: ADMIN_USER_ID,
        event_type: 'contact_form',
        event_key: `contact:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`,
        recipient: CONTACT_EMAIL,
        status: emailSent ? 'sent' : 'logged',
        provider_id: providerId,
        last_error: emailError,
        sent_at: emailSent ? new Date().toISOString() : null,
      })
    } catch (dbErr) {
      console.error('[Contact Form] Erreur journalisation Supabase:', dbErr)
    }

    if (!emailSent) {
      const isConfigMissing = !smtpPassword && !process.env.RESEND_API_KEY
      return NextResponse.json(
        {
          ok: false,
          error: isConfigMissing
            ? "Le serveur d'envoi d'emails n'est pas encore configuré (mot de passe SMTP Hostinger ou clé Resend manquant dans .env.local). Votre message a été enregistré en interne."
            : `L'envoi par email a rencontré une erreur (${emailError || 'erreur inconnue'}). Veuillez nous écrire directement à ${CONTACT_EMAIL}.`,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'Votre message a bien été envoyé. Notre équipe vous répondra sous 24h ouvrées.',
    })
  } catch (error) {
    console.error('[Contact Form] Erreur inattendue:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l’envoi de votre message. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}
