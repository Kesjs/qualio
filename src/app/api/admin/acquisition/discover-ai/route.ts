import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { discoverCompaniesWithAi } from '@/lib/admin/acquisition-ai'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export const maxDuration = 60

const chunk = <T,>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, index * size + size)
  )

export async function POST(request: Request) {
  if (!await requireAdminApi()) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    target?: string
    location?: string
    limit?: number
  }

  const target = String(body.target ?? '').trim().slice(0, 300)
  const location = String(body.location ?? '').trim().slice(0, 150)
  const limit = Math.min(Math.max(Math.floor(Number(body.limit) || 20), 5), 50)

  if (!target) {
    return NextResponse.json(
      { error: 'Indique une cible ou un secteur à rechercher (ex. « Boutiques E-commerce mode & beauté »).' },
      { status: 400 }
    )
  }

  let result
  try {
    result = await discoverCompaniesWithAi({ target, location, limit })
  } catch (error) {
    console.error('[Discover AI] error', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'L’IA n’a pas pu générer les prospects.' },
      { status: 502 }
    )
  }

  const { companies: generated, provider } = result
  if (!generated.length) {
    return NextResponse.json(
      { error: 'Aucune entreprise valide n’a été trouvée pour ces critères.' },
      { status: 404 }
    )
  }

  const admin = getSupabaseAdminClient() as any
  const domains = generated.map((c) => c.domain.toLowerCase())
  const known = new Set<string>()

  for (const part of chunk(domains, 100)) {
    const { data, error } = await admin
      .from('acquisition_companies')
      .select('domain')
      .in('domain', part)

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des doublons.' },
        { status: 500 }
      )
    }

    for (const row of data ?? []) {
      known.add(String(row.domain).toLowerCase())
    }
  }

  const fresh = generated.filter((c) => !known.has(c.domain.toLowerCase()))

  if (!fresh.length) {
    return NextResponse.json({
      found: generated.length,
      added: 0,
      alreadyKnown: generated.length,
      provider,
      message:
        'Toutes les entreprises suggérées par l’IA sont déjà enregistrées dans votre liste. Essayez une autre cible ou ville.',
    })
  }

  const records = fresh.map((c) => ({
    name: c.name.slice(0, 120),
    domain: c.domain.toLowerCase(),
    website_url: `https://${c.domain.toLowerCase()}`,
    country: c.country?.slice(0, 80) || (location ? location.slice(0, 80) : 'France'),
    company_size: c.company_size || 'PME',
    relevance_score: 85,
    status: 'discovered',
    source_url: `https://${c.domain.toLowerCase()}`,
    source_notes: `IA Qualio (${provider}) · ${c.relevance_reason.slice(0, 200)}`,
  }))

  for (const part of chunk(records, 100)) {
    const { error } = await admin.from('acquisition_companies').insert(part)
    if (error) {
      console.error('[Discover AI] insert error', error.message)
      return NextResponse.json(
        { error: 'Qualio n’a pas pu enregistrer les entreprises générées.' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({
    found: generated.length,
    added: fresh.length,
    alreadyKnown: known.size,
    provider,
    companies: fresh,
  })
}
