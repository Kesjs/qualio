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
  { code: 'ci', label: 'Côte d’Ivoire' },
  { code: 'sn', label: 'Sénégal' },
  { code: 'ma', label: 'Maroc' },
  { code: 'cm', label: 'Cameroun' },
  { code: 'us', label: 'États-Unis' },
  { code: 'gb', label: 'Royaume-Uni' },
] as const

const FALLBACK_STOREFRONTS = ['fr', 'ci', 'sn', 'ma', 'cm', 'be', 'ch', 'ca', 'gb', 'us'] as const

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

/** Extrait les avis embarqués dans `serialized-server-data` sur `apps.apple.com/.../app/id...?see-all=reviews`. */
export function parseAppStoreWebReviews(html: string): PublicReview[] {
  const marker = '<script type="application/json" id="serialized-server-data">'
  const start = html.indexOf(marker)
  if (start === -1) return []
  const jsonStart = start + marker.length
  const jsonEnd = html.indexOf('</script>', jsonStart)
  if (jsonEnd === -1) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(html.slice(jsonStart, jsonEnd))
  } catch {
    return []
  }

  const results: PublicReview[] = []
  const seen = new Set<string>()
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    const obj = node as Record<string, unknown>
    if (obj.$kind === 'Review' && typeof obj.contents === 'string' && typeof obj.rating === 'number') {
      const id = String(obj.id ?? '').trim()
      const content = obj.contents.trim()
      if (id && content.length >= 3 && !seen.has(id)) {
        seen.add(id)
        results.push({
          id,
          content,
          rating: obj.rating,
          title: typeof obj.title === 'string' && obj.title.trim() ? obj.title.trim() : null,
          created_at: typeof obj.date === 'string' ? new Date(obj.date).toISOString() : new Date().toISOString(),
        })
      }
    }
    for (const value of Object.values(obj)) walk(value)
  }
  walk(parsed)
  return results
}

async function fetchAppStoreWebReviews(appId: string, storefront: string): Promise<PublicReview[]> {
  const url = `https://apps.apple.com/${storefront}/app/id${appId}?see-all=reviews`
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  }).catch(() => null)
  if (!response?.ok) return []
  return parseAppStoreWebReviews(await response.text().catch(() => ''))
}

/**
 * Avis les plus récents, jusqu'à `maxPages` pages de 50 (limite Apple : 10 pages).
 * Si le flux RSS historique renvoie trop peu d'avis (ex. Yango, Viator), bascule sur la page publique
 * `apps.apple.com/...?see-all=reviews` et élargit aux autres boutiques francophones/internationales.
 */
export async function fetchAppStoreReviews(appId: string, country = 'fr', maxPages = 6): Promise<PublicReview[]> {
  const cc = COUNTRY.test(country) ? country : 'fr'
  const reviews: PublicReview[] = []
  const seen = new Set<string>()

  const addBatch = (batch: PublicReview[]) => {
    let added = 0
    for (const review of batch) {
      if (!seen.has(review.id)) {
        seen.add(review.id)
        reviews.push(review)
        added += 1
      }
    }
    return added
  }

  const fetchFeedPage = async (storefront: string, page: number): Promise<PublicReview[]> => {
    const pagedUrl = `https://itunes.apple.com/${storefront}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/json`
    const response = await fetch(pagedUrl, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(5000), cache: 'no-store' }).catch(() => null)
    if (response?.ok) {
      const parsed = parseAppStoreFeed(await response.json().catch(() => null))
      if (parsed.length > 0 || page > 1) return parsed
    }
    if (page === 1) {
      const unpagedUrl = `https://itunes.apple.com/${storefront}/rss/customerreviews/id=${appId}/sortby=mostrecent/json`
      const fallbackRes = await fetch(unpagedUrl, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(5000), cache: 'no-store' }).catch(() => null)
      if (fallbackRes?.ok) return parseAppStoreFeed(await fallbackRes.json().catch(() => null))
    }
    return []
  }

  for (let page = 1; page <= Math.min(maxPages, 10); page += 1) {
    const batch = await fetchFeedPage(cc, page)
    if (!addBatch(batch)) break
  }

  // Repli 1 : page web App Store sur la boutique choisie (certains apps ont un flux RSS vide mais 20 avis sur ?see-all=reviews)
  if (reviews.length < 15) {
    addBatch(await fetchAppStoreWebReviews(appId, cc))
  }

  // Repli 2 : autres boutiques francophones puis internationales (RSS + web)
  if (reviews.length < 15) {
    const fallbacks = FALLBACK_STOREFRONTS.filter((code) => code !== cc)
    for (let i = 0; i < fallbacks.length && reviews.length < 40; i += 3) {
      const slice = fallbacks.slice(i, i + 3)
      const batches = await Promise.all(
        slice.map(async (code) => {
          const rss = await fetchFeedPage(code, 1)
          if (rss.length > 0) return rss
          return fetchAppStoreWebReviews(appId, code)
        }),
      )
      for (const batch of batches) addBatch(batch)
    }
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
