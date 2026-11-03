// Distingue les clics automatiques (antivirus, passerelles mail, robots d'aperçu) des clics probablement humains.
// Un filtre de sécurité ouvre les liens quelques secondes après la livraison, souvent plusieurs fois de suite.

/** Un clic aussi proche de la livraison est automatique : personne ne lit et clique en moins d'une minute. */
export const AUTOMATED_WINDOW_MS = 60_000
/** Les clics qui s'enchaînent à moins de 5 minutes d'une rafale automatique en font partie. */
export const BURST_GAP_MS = 5 * 60_000
/** Au-delà, on arrête d'enregistrer : un même message ne peut pas être « cliqué » des dizaines de fois. */
export const MAX_RAW_CLICKS_PER_MESSAGE = 25

const AUTOMATED_USER_AGENT = /(bot|crawl|spider|preview|scanner|headless|python-requests|curl\/|wget|go-http-client|okhttp|axios|node-fetch|java\/|libwww|safelinks|proofpoint|mimecast|barracuda|trendmicro|symantec|messagelabs|forcepoint|sophos|fireeye|mailscanner|urlscan|googleimageproxy|google-safety|yahoomailproxy|skypeuripreview|slackbot|facebookexternalhit|whatsapp|telegrambot)/i

/** Robots connus. Un user-agent absent est aussi traité comme automatique. */
export function isAutomatedUserAgent(userAgent: string | null | undefined) {
  const value = userAgent?.trim() ?? ''
  return !value || AUTOMATED_USER_AGENT.test(value)
}

/**
 * Parmi les clics d'un même message (horodatages en ms), renvoie le premier qui a l'air humain, ou null.
 * `baselineMs` est la date de livraison (à défaut d'envoi) du message.
 */
export function firstHumanClick(clickTimes: number[], baselineMs: number | null): number | null {
  const times = [...clickTimes].filter(Number.isFinite).sort((a, b) => a - b)
  let inBurst = false
  let previous = baselineMs
  for (const time of times) {
    const tooEarly = baselineMs !== null && time - baselineMs < AUTOMATED_WINDOW_MS
    const chained = inBurst && previous !== null && time - previous < BURST_GAP_MS
    if (tooEarly || chained) {
      inBurst = true
      previous = time
      continue
    }
    return time
  }
  return null
}
