/** Extrait l'identifiant et le pays d'une fiche App Store (https://apps.apple.com/fr/app/nom/id123456789). */
export function parseAppStoreUrl(url: string | null | undefined): { appId: string; country: string } | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (!/(^|\.)apps\.apple\.com$/i.test(parsed.hostname)) return null
    const appId = parsed.pathname.match(/\/id(\d{6,12})(?:\/|$)/)?.[1]
    if (!appId) return null
    const country = parsed.pathname.match(/^\/([a-z]{2})\//i)?.[1]?.toLowerCase() ?? 'fr'
    return { appId, country }
  } catch {
    return null
  }
}
