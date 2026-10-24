/** Découverte de prospects via OpenStreetMap (Nominatim + Overpass). Données © contributeurs OpenStreetMap, licence ODbL. */
import { isValidEmail } from '@/lib/admin/acquisition-csv'

export const OSM_CATEGORIES = [
  { value: 'restaurants', label: 'Restaurants et cafés', filter: '["amenity"~"^(restaurant|cafe|bar|fast_food)$"]' },
  { value: 'hotels', label: 'Hôtels et hébergements', filter: '["tourism"~"^(hotel|guest_house|hostel|motel|apartment)$"]' },
  { value: 'beauty', label: 'Coiffure et beauté', filter: '["shop"~"^(hairdresser|beauty)$"]' },
  { value: 'health', label: 'Cliniques, dentistes, vétérinaires', filter: '["amenity"~"^(clinic|dentist|veterinary)$"]' },
  { value: 'realestate', label: 'Agences immobilières', filter: '["office"="estate_agent"]' },
] as const

export type OsmCategory = (typeof OSM_CATEGORIES)[number]['value']

const BLOCKED_HOSTS = ['facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com', 'x.com', 'tiktok.com', 'youtube.com', 'tripadvisor.com', 'tripadvisor.fr', 'booking.com', 'airbnb.com', 'google.com', 'goo.gl', 'linktr.ee', 'wixsite.com', 'business.site', 'weebly.com', 'blogspot.com', 'wordpress.com', 'ubereats.com', 'thefork.com', 'lafourchette.com', 'doctolib.fr', 'pagesjaunes.fr']

export function categoryFilter(value: string) {
  return OSM_CATEGORIES.find((category) => category.value === value)?.filter ?? null
}

/** « https://www.Le-Bistro.fr/carte » devient « le-bistro.fr ». Retourne null pour réseaux sociaux, plateformes et valeurs invalides. */
export function domainFromWebsite(value: string | undefined) {
  if (!value) return null
  const first = value.split(';')[0].trim()
  if (!first) return null
  let host: string
  try { host = new URL(/^https?:\/\//i.test(first) ? first : `https://${first}`).hostname.toLowerCase().replace(/^www\./, '') } catch { return null }
  if (!/^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(host)) return null
  if (BLOCKED_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) return null
  return host
}

export type OsmPlace = { name: string; domain: string; email: string | null; sourceUrl: string }

type OverpassElement = { type: string; id: number; tags?: Record<string, string> }

/** Transforme la réponse Overpass en prospects uniques (un par domaine), sans doublon. */
export function placesFromOverpass(elements: OverpassElement[], exclude: Set<string> = new Set()): OsmPlace[] {
  const seen = new Set<string>()
  const places: OsmPlace[] = []
  for (const element of elements) {
    const tags = element.tags ?? {}
    const name = (tags.name ?? '').trim()
    const domain = domainFromWebsite(tags.website ?? tags['contact:website'])
    if (!name || !domain || seen.has(domain) || exclude.has(domain)) continue
    seen.add(domain)
    const rawEmail = (tags.email ?? tags['contact:email'] ?? '').split(';')[0].trim().toLowerCase()
    places.push({ name: name.slice(0, 120), domain, email: rawEmail && isValidEmail(rawEmail) ? rawEmail : null, sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}` })
  }
  return places
}

export function overpassQuery({ filter, areaId, bbox }: { filter: string; areaId?: number; bbox?: [number, number, number, number] }) {
  const scope = areaId ? '(area.a)' : `(${(bbox as [number, number, number, number]).join(',')})`
  const area = areaId ? `area(${areaId})->.a;` : ''
  return `[out:json][timeout:25];${area}(nwr${scope}${filter}["website"];nwr${scope}${filter}["contact:website"];);out tags 1000;`
}

/** Identifiant de zone Overpass à partir d'un résultat Nominatim (relation ou chemin), sinon null. */
export function areaIdFromNominatim(result: { osm_type?: string; osm_id?: number }) {
  if (result.osm_type === 'relation' && result.osm_id) return 3_600_000_000 + result.osm_id
  if (result.osm_type === 'way' && result.osm_id) return 2_400_000_000 + result.osm_id
  return null
}
