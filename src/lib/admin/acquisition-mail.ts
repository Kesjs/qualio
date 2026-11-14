import { renderAcquisitionEmail } from '@/lib/email/layout'
import { createProspectUnsubscribeToken } from '@/lib/email/unsubscribe'
import { LEGAL, senderIdentityReady } from '@/lib/legal'
import { loadReportCardForBody, type ReportCard } from '@/lib/admin/acquisition-report-card'

export const SENDER_IDENTITY_ERROR = 'Complète l’éditeur et l’adresse postale dans src/lib/legal.ts avant d’envoyer : un email commercial doit dire qui écrit et où.'

export function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://tryqualio.pro').replace(/\/$/, '')
}

export function acquisitionReplyTo() {
  return process.env.ACQUISITION_REPLY_TO || LEGAL.email
}

export { senderIdentityReady }

/** Tout ce qu'il faut pour envoyer un message de prospection : html, texte brut et en-têtes de désinscription (RFC 8058, un clic). */
export function buildProspectMail(input: { messageId: string; subject: string; body: string; from: string; card?: ReportCard | null }) {
  const origin = siteOrigin()
  const token = encodeURIComponent(createProspectUnsubscribeToken(input.messageId))
  const unsubscribeUrl = `${origin}/desinscription?token=${token}`
  const oneClickUrl = `${origin}/api/acquisition/unsubscribe?token=${token}`
  const trackingUrl = new URL('/api/acquisition/click', origin)
  trackingUrl.searchParams.set('message', input.messageId)
  const reportMatch = input.body.match(/\/rapport\/([\w-]{12,80})/)
  if (reportMatch) trackingUrl.searchParams.set('to', `/rapport/${reportMatch[1]}`)
  const { html, text } = renderAcquisitionEmail({ subject: input.subject, body: input.body, trackingUrl: trackingUrl.toString(), unsubscribeUrl, card: input.card })
  const replyTo = acquisitionReplyTo()
  return {
    html,
    text,
    replyTo,
    headers: {
      'List-Unsubscribe': `<${oneClickUrl}>, <mailto:${replyTo}?subject=stop>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  }
}

/** Comme buildProspectMail, mais joint la carte du rapport lié au message (image + récap) quand il existe. Un rapport introuvable ne bloque jamais l'envoi : le mail part sans carte. */
export async function buildProspectMailWithReport(admin: any, input: { messageId: string; subject: string; body: string; from: string }) {
  const card = await loadReportCardForBody(admin, input.body).catch(() => null)
  return buildProspectMail({ ...input, card })
}

/** Mots d'une réponse automatique : elle ne compte pas comme une vraie réponse. */
export const AUTO_REPLY_SUBJECT = /(réponse automatique|reponse automatique|automatic reply|auto[- ]?reply|autoreply|out of office|absence du bureau|absent du bureau|hors du bureau|undeliverable|delivery status)/i
/** Un « stop » dans l'objet : c'est ce que produit le lien mailto de désinscription. */
export const STOP_SUBJECT = /^\s*(re\s*:\s*)*(stop|unsubscribe|désinscription|desinscription|désabonnement|desabonnement)\b/i
