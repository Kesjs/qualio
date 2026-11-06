import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { cleanDomain, discoverCompaniesWithAi } from '@/lib/admin/acquisition-ai'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export const maxDuration = 60

const chunk = <T>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size),
  )

export async function POST(request: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    target?: string
    location?: string
    limit?: number
  }

  const target = String(body.target ?? '').trim().slice(0, 300)
  const location = String(body.location ?? '').trim().slice(0, 150)
  const limit = Math.min(Math.max(Math.floor(Number(body.limit) || 20), 5), 40)

  if (!target) {
    return NextResponse.json(
      { error: 'Indique une cible ou un secteur à rechercher (ex. « Studios UX/UI ou SaaS RH »).' },
      { status: 400 },
    )
  }

  const admin = getSupabaseAdminClient() as any

  // Charger les domaines déjà présents (y compris archivés) pour éviter que l'IA ne tourne en rond
  const { data: existingRows } = await admin
    .from('acquisition_companies')
    .select('domain')
    .order('created_at', { ascending: false })
    .limit(500)

  const known = new Set<string>(
    (existingRows ?? [])
      .map((r: { domain?: string }) => cleanDomain(r.domain))
      .filter((d: string | null): d is string => Boolean(d)),
  )

  let result
  try {
    result = await discoverCompaniesWithAi({
      target,
      location,
      limit,
      excludeDomains: [...known],
    })
  } catch (error) {
    console.error('[Discover AI] error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'L’IA n’a pas pu générer les prospects.' },
      { status: 502 },
    )
  }

  const { companies: generated, provider } = result
  if (!generated.length) {
    return NextResponse.json(
      { error: 'Aucune entreprise valide n’a été trouvée pour ces critères.' },
      { status: 404 },
    )
  }

  // Vérification complémentaire sur les domaines exacts retournés (au cas où la base dépasse 500 entrées)
  const candidateDomains = generated.map((c) => c.domain.toLowerCase())
  for (const part of chunk(candidateDomains, 100)) {
    const { data, error } = await admin
      .from('acquisition_companies')
      .select('domain')
      .in('domain', part)

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des doublons.' },
        { status: 500 },
      )
    }

    for (const row of data ?? []) {
      known.add(String(row.domain).toLowerCase())
    }
  }

  const seenInBatch = new Set<string>()
  const fresh = generated.filter((c) => {
    const dom = c.domain.toLowerCase()
    if (known.has(dom) || seenInBatch.has(dom)) return false
    seenInBatch.add(dom)
    return true
  })

  const duplicateCount = generated.length - fresh.length

  if (!fresh.length) {
    return NextResponse.json({
      found: generated.length,
      added: 0,
      duplicates: duplicateCount,
      alreadyKnown: duplicateCount,
      provider,
      insertedCompanies: [],
      message:
        'Toutes les entreprises suggérées sont déjà connues dans ta base. Précise un sous-secteur ou une ville.',
    })
  }

  const records = fresh.map((c) => ({
    name: c.name.slice(0, 120),
    domain: c.domain.toLowerCase(),
    website_url: `https://${c.domain.toLowerCase()}`,
    country: c.country?.slice(0, 80) || (location ? location.slice(0, 80) : 'France'),
    company_size: c.company_size || null,
    relevance_score: null,
    status: 'discovered',
    source_url: `https://${c.domain.toLowerCase()}`,
    source_notes: `IA Qualio (${provider}) · ${c.relevance_reason.slice(0, 200)}`,
  }))

  const insertedCompanies: Array<{ id: string; name: string; domain: string }> = []

  for (const part of chunk(records, 50)) {
    const { data, error } = await admin
      .from('acquisition_companies')
      .insert(part)
      .select('id, name, domain')

    if (error) {
      // Repli ligne par ligne si un domaine venait d'être inséré en parallèle
      for (const single of part) {
        const { data: one } = await admin
          .from('acquisition_companies')
          .insert(single)
          .select('id, name, domain')
          .maybeSingle()
        if (one?.id) {
          insertedCompanies.push({
            id: String(one.id),
            name: String(one.name),
            domain: String(one.domain).toLowerCase(),
          })
        }
      }
      continue
    }

    for (const row of data ?? []) {
      insertedCompanies.push({
        id: String(row.id),
        name: String(row.name),
        domain: String(row.domain).toLowerCase(),
      })
    }
  }

  return NextResponse.json({
    found: generated.length,
    added: insertedCompanies.length,
    duplicates: duplicateCount,
    alreadyKnown: duplicateCount,
    provider,
    companies: fresh,
    insertedCompanies,
  })
}
