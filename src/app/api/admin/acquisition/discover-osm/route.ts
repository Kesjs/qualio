import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { areaIdFromNominatim, categoryFilter, overpassQuery, placesFromOverpass } from '@/lib/admin/acquisition-osm'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export const maxDuration = 60

const UA = 'QualioResearchBot/1.0 (+https://tryqualio.pro)'
const chunk = <T,>(items: T[], size: number) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size))

/** Trouve des entreprises locales avec un site web via OpenStreetMap et les ajoute à « À contacter ». */
export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const body = await request.json().catch(() => ({})) as { city?: string; category?: string; limit?: number }
  const city = String(body.city ?? '').trim().slice(0, 120)
  const filter = categoryFilter(String(body.category ?? ''))
  const limit = Math.min(Math.max(Math.floor(Number(body.limit) || 50), 1), 100)
  if (!city) return NextResponse.json({ error: 'Indique une ville.' }, { status: 400 })
  if (!filter) return NextResponse.json({ error: 'Choisis un type d’établissement.' }, { status: 400 })

  let place: { osm_type?: string; osm_id?: number; display_name?: string; boundingbox?: string[] } | undefined
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: city, format: 'json', limit: '1' })}`, { headers: { 'user-agent': UA, accept: 'application/json' }, signal: AbortSignal.timeout(10_000), cache: 'no-store' })
    if (!response.ok) throw new Error(`nominatim ${response.status}`)
    place = ((await response.json()) as Array<typeof place>)[0]
  } catch (error) {
    console.error('[Discover OSM] nominatim', error)
    return NextResponse.json({ error: 'OpenStreetMap ne répond pas pour le moment. Réessaie dans une minute.' }, { status: 502 })
  }
  if (!place) return NextResponse.json({ error: `Ville introuvable : « ${city} ». Essaie avec le pays (ex. « Cotonou, Bénin »).` }, { status: 404 })

  const areaId = areaIdFromNominatim(place)
  const box = place.boundingbox?.map(Number)
  const bbox = box && box.length === 4 && box.every(Number.isFinite) ? [box[0], box[2], box[1], box[3]] as [number, number, number, number] : undefined
  if (!areaId && !bbox) return NextResponse.json({ error: 'Zone introuvable pour cette ville.' }, { status: 404 })

  let elements: Array<{ type: string; id: number; tags?: Record<string, string> }> = []
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'user-agent': UA, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ data: overpassQuery({ filter, areaId: areaId ?? undefined, bbox }) }), signal: AbortSignal.timeout(40_000), cache: 'no-store' })
    if (!response.ok) throw new Error(`overpass ${response.status}`)
    elements = ((await response.json()) as { elements?: typeof elements }).elements ?? []
  } catch (error) {
    console.error('[Discover OSM] overpass', error)
    return NextResponse.json({ error: 'La recherche OpenStreetMap a expiré (zone trop grande ou service saturé). Réessaie, ou choisis une ville plus petite.' }, { status: 502 })
  }

  const admin = getSupabaseAdminClient() as any
  const candidates = placesFromOverpass(elements)
  const known = new Set<string>()
  for (const part of chunk(candidates.map((candidate) => candidate.domain), 100)) {
    const { data, error } = await admin.from('acquisition_companies').select('domain').in('domain', part)
    if (error) return NextResponse.json({ error: 'Qualio n’a pas pu vérifier les entreprises existantes.' }, { status: 500 })
    for (const row of data ?? []) known.add(String(row.domain).toLowerCase())
  }
  const fresh = candidates.filter((candidate) => !known.has(candidate.domain)).slice(0, limit)
  if (!fresh.length) {
    return NextResponse.json({ found: candidates.length, added: 0, withEmail: 0, alreadyKnown: candidates.length, message: candidates.length ? 'Toutes les entreprises trouvées sont déjà dans ta liste. Essaie une autre ville ou un autre type.' : 'Aucune entreprise avec un site web renseigné dans OpenStreetMap pour cette zone. Essaie une ville plus grande ou un autre type.' })
  }

  const companies = fresh.map((item) => ({ name: item.name, domain: item.domain, website_url: `https://${item.domain}`, status: 'discovered', source_url: item.sourceUrl, source_notes: 'OpenStreetMap · © contributeurs OpenStreetMap (ODbL)' }))
  const ids = new Map<string, string>()
  for (const part of chunk(companies, 100)) {
    const { data, error } = await admin.from('acquisition_companies').insert(part).select('id, domain')
    if (error) { console.error('[Discover OSM] insert', error.message); return NextResponse.json({ error: 'Qualio n’a pas pu enregistrer les entreprises trouvées.' }, { status: 500 }) }
    for (const row of data ?? []) ids.set(String(row.domain).toLowerCase(), row.id)
  }

  const withEmail = fresh.filter((item) => item.email && ids.has(item.domain))
  let emailsAdded = 0
  if (withEmail.length) {
    const emails = withEmail.map((item) => item.email as string)
    const existing = new Set<string>()
    for (const part of chunk(emails, 100)) {
      const { data } = await admin.from('acquisition_contacts').select('email').in('email', part)
      for (const row of data ?? []) existing.add(String(row.email).toLowerCase())
    }
    const contacts = withEmail.filter((item) => !existing.has(item.email as string)).map((item) => ({ company_id: ids.get(item.domain), email: item.email, email_status: 'public', email_source_url: item.sourceUrl, confidence: 70 }))
    for (const part of chunk(contacts, 100)) {
      const { error } = await admin.from('acquisition_contacts').insert(part)
      if (!error) emailsAdded += part.length
    }
  }
  return NextResponse.json({ found: candidates.length, added: fresh.length, withEmail: emailsAdded, alreadyKnown: known.size })
}
