import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { cleanDomain } from '@/lib/admin/acquisition-ai'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as { targets?: string }
  const targets = [
    ...new Set(
      String(body.targets ?? '')
        .split(/[\n,;\s]+/)
        .map((value) => cleanDomain(value))
        .filter((value): value is string => Boolean(value)),
    ),
  ].slice(0, 50)

  if (!targets.length) {
    return NextResponse.json({ error: 'Ajoute au moins un domaine valide, un par ligne.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient() as any
  const insertedCompanies: Array<{ id: string; name: string; domain: string }> = []
  let duplicates = 0

  for (const domain of targets) {
    const { data: existing, error: lookupError } = await admin
      .from('acquisition_companies')
      .select('id')
      .eq('domain', domain)
      .maybeSingle()
    if (lookupError) return NextResponse.json({ error: 'Qualio n’a pas pu vérifier les domaines.' }, { status: 500 })
    if (existing) {
      duplicates += 1
      continue
    }
    const rawBrand = domain.split('.')[0]
    const prettyName = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1)
    const row = {
      name: prettyName,
      domain,
      website_url: `https://${domain}`,
      status: 'discovered',
      source_url: `https://${domain}`,
      source_notes: 'Domaine ajouté manuellement · vérifié au scan',
    }
    const { data: created, error: insertError } = await admin
      .from('acquisition_companies')
      .insert(row)
      .select('id, name, domain')
      .maybeSingle()
    if (insertError) return NextResponse.json({ error: 'Qualio n’a pas pu enregistrer ces domaines.' }, { status: 500 })
    if (created?.id) {
      insertedCompanies.push({
        id: String(created.id),
        name: String(created.name),
        domain: String(created.domain),
      })
    }
  }

  return NextResponse.json({
    companiesAdded: insertedCompanies.length,
    duplicates,
    contactsAdded: 0,
    insertedCompanies,
  })
}
