/** Lien public d'un rapport d'avis envoyé à un prospect (/rapport/[token]). */
export function publicReportUrl(token: string) {
  return `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://tryqualio.pro').replace(/\/$/, '')}/rapport/${token}`
}
