/** Lien public d'un rapport d'avis envoyé à un prospect (/rapport/[token]). */
export function publicReportUrl(token: string) {
  return `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://tryqualio.pro').replace(/\/$/, '')}/rapport/${token}`
}

/** Image d'aperçu d'un rapport (PNG généré à la volée) : email de prospection et aperçu LinkedIn / X / WhatsApp. */
export function reportImageUrl(token: string) {
  return `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://tryqualio.pro').replace(/\/$/, '')}/api/acquisition/report-image?t=${encodeURIComponent(token)}`
}
