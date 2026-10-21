import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

type HunterCompany = { domain?: string; organization?: string; emails_count?: { total?: number } }

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const apiKey = process.env.HUNTER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'HUNTER_API_KEY n’est pas configurée.' }, { status: 503 })
  const body = await request.json().catch(() => ({})) as { query?: string }
  const query = String(body.query ?? '').trim().slice(0, 300)
  if (!query) return NextResponse.json({ error: 'Décris la cible à rechercher.' }, { status: 400 })
  let response: Response
  try {
    response = await fetch(`https://api.hunter.io/v2/discover?api_key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ query, limit: 25 }), cache: 'no-store' })
  } catch (error) {
    console.error('[Acquisition Discover] Hunter network error', error)
    return NextResponse.json({ error: 'Qualio ne parvient pas à joindre Hunter pour le moment.' }, { status: 502 })
  }
  const payload = await response.json().catch(() => null) as { data?: HunterCompany[]; errors?: unknown } | null
  if (!response.ok) {
    console.error('[Acquisition Discover] Hunter error', { status: response.status, errors: payload?.errors ?? null })
    const reason = response.status === 401 ? 'La clé Hunter est invalide ou absente.' : response.status === 403 ? 'Ton compte Hunter ne permet pas cette recherche.' : response.status === 429 ? 'La limite Hunter a été atteinte. Réessaie plus tard.' : 'Hunter a refusé la recherche. Vérifie la formulation ou les filtres.'
    return NextResponse.json({ error: reason }, { status: response.status })
  }
  const companies = (payload?.data ?? []).filter((item) => item.domain && item.organization).map((item) => ({ name: item.organization!, domain: item.domain!, website_url: `https://${item.domain}`, relevance_score: null, status: 'discovered', source_url: 'https://hunter.io', source_notes: `Hunter Discover · ${item.emails_count?.total ?? 0} email(s) recensé(s)` }))
  if (companies.length) {
    const { error } = await (getSupabaseAdminClient() as any).from('acquisition_companies').upsert(companies, { onConflict: 'domain', ignoreDuplicates: true })
    if (error) { console.error('[Acquisition Discover] Supabase error', error.message); return NextResponse.json({ error: 'Hunter a trouvé les entreprises, mais Qualio n’a pas pu les enregistrer.' }, { status: 500 }) }
  }
  return NextResponse.json({ count: companies.length, companies })
}
