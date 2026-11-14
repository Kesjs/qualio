/**
 * Récupération d'avis publics pour la prospection « valeur d'abord ».
 * Sources : flux publics d'Apple (iTunes Search API + flux RSS des avis App Store) et avis collés à la main
 * (Trustpilot, G2, Capterra, Google Play… dont les conditions interdisent l'extraction automatique).
 */

export type PublicReview = { id: string; content: string; rating: number | null; title: string | null; created_at: string }

export type AppStoreApp = {
  id: string
  name: string
  seller: string
  icon: string | null
  rating: number | null
  ratingCount: number | null
  url: string
  sellerUrl: string | null
}

const UA = 'Mozilla/5.0 (compatible; QualioBot/1.0; +https://tryqualio.pro)'
const COUNTRY = /^[a-z]{2}$/

export const APP_STORE_COUNTRIES = [
  { code: 'fr', label: 'France' },
  { code: 'be', label: 'Belgique' },
  { code: 'ch', label: 'Suisse' },
  { code: 'ca', label: 'Canada' },
  { code: 'us', label: 'États-Unis' },
  { code: 'gb', label: 'Royaume-Uni' },
] as const

/** « https://apps.apple.com/fr/app/x/id123456789 » ou « 123456789 » → « 123456789 ». */
export function appStoreIdFrom(input: string): string | null {
  const value = input.trim()
  if (/^\d{6,12}$/.test(value)) return value
  const match = value.match(/apps\.apple\.com\/.*\/id(\d{6,12})/i) ?? value.match(/[?&]id=(\d{6,12})/)
  return match?.[1] ?? null
}

export async function searchAppStore(term: string, country = 'fr', limit = 6): Promise<AppStoreApp[]> {
  const cc = COUNTRY.test(country) ? country : 'fr'
  const clampedLimit = Math.min(Math.max(Math.floor(limit) || 6, 1), 200)
  const id = appStoreIdFrom(term)
  const url = id
    ? `https://itunes.apple.com/lookup?id=${id}&country=${cc}`
    : `https://itunes.apple.com/search?term=${encodeURIComponent(term.trim().slice(0, 100))}&entity=software&country=${cc}&limit=${clampedLimit}`
  const response = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000), cache: 'no-store' })
  if (!response.ok) throw new Error(`L’App Store a répondu ${response.status}.`)
  const data = (await response.json()) as { results?: Array<Record<string, any>> }
  return (data.results ?? [])
    .filter((item) => item.trackId && item.trackName)
    .map((item) => ({
      id: String(item.trackId),
      name: String(item.trackName),
      seller: String(item.sellerName ?? item.artistName ?? ''),
      icon: item.artworkUrl100 ?? item.artworkUrl60 ?? null,
      rating: typeof item.averageUserRating === 'number' ? Math.round(item.averageUserRating * 10) / 10 : null,
      ratingCount: typeof item.userRatingCount === 'number' ? item.userRatingCount : null,
      url: String(item.trackViewUrl ?? `https://apps.apple.com/${cc}/app/id${item.trackId}`),
      sellerUrl: item.sellerUrl ?? null,
    }))
}

/** Transforme une page du flux RSS JSON d'Apple en avis. Les entrées sans note (fiche de l'app) sont ignorées. */
export function parseAppStoreFeed(json: unknown): PublicReview[] {
  const entries = (json as any)?.feed?.entry
  const list: any[] = Array.isArray(entries) ? entries : entries ? [entries] : []
  return list
    .filter((entry) => entry?.['im:rating']?.label && entry?.content?.label)
    .map((entry) => ({
      id: String(entry.id?.label ?? ''),
      content: String(entry.content.label).trim(),
      rating: Number(entry['im:rating'].label) || null,
      title: entry.title?.label ? String(entry.title.label).trim() : null,
      created_at: entry.updated?.label ? new Date(entry.updated.label).toISOString() : new Date().toISOString(),
    }))
    .filter((review) => review.id && review.content.length >= 3)
}

/** Avis les plus récents, jusqu'à `maxPages` pages de 50 (limite Apple : 10 pages). */
export async function fetchAppStoreReviews(appId: string, country = 'fr', maxPages = 6): Promise<PublicReview[]> {
  const cc = COUNTRY.test(country) ? country : 'fr'
  const reviews: PublicReview[] = []
  const seen = new Set<string>()
  for (let page = 1; page <= Math.min(maxPages, 10); page += 1) {
    const response = await fetch(`https://itunes.apple.com/${cc}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/json`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000), cache: 'no-store' })
    if (!response.ok) break
    const batch = parseAppStoreFeed(await response.json().catch(() => null))
    const fresh = batch.filter((review) => !seen.has(review.id))
    if (!fresh.length) break
    for (const review of fresh) { seen.add(review.id); reviews.push(review) }
  }
  return reviews
}

const STAR_LINE = /^\s*(?:([1-5])\s*(?:\/\s*5|étoiles?|stars?|★)|(★{1,5})☆*)\s*$/i

export type PastedReviewsAnalysis = {
  reviews: PublicReview[]
  ignoredShortCount: number
}

/**
 * Avis collés depuis n'importe quelle plateforme : un avis par bloc, séparés par une ligne vide.
 * Une ligne isolée « 4/5 », « 2 étoiles » ou « ★★☆☆☆ » donne la note du bloc.
 * Les blocs non vides de moins de 15 caractères sont comptés à part pour informer l'utilisateur.
 */
export function analyzePastedReviews(text: string): PastedReviewsAnalysis {
  const now = new Date().toISOString()
  const parsed = text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((block, index) => {
      let rating: number | null = null
      const lines = block.split('\n').filter((line) => {
        const star = line.match(STAR_LINE)
        if (!star) return true
        rating = star[1] ? Number(star[1]) : star[2].length
        return false
      })
      return { id: `p${index + 1}`, content: lines.join(' ').replace(/\s+/g, ' ').trim(), rating: rating as number | null, title: null, created_at: now }
    })

  const nonEmpty = parsed.filter((review) => review.content.length > 0)
  const valid = nonEmpty.filter((review) => review.content.length >= 15)
  return {
    reviews: valid.slice(0, 400),
    ignoredShortCount: nonEmpty.length - valid.length,
  }
}

export function parsePastedReviews(text: string): PublicReview[] {
  return analyzePastedReviews(text).reviews
}
