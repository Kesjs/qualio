import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const body = await request.json().catch(() => ({})) as { targets?: string }
  const targets = [...new Set(String(body.targets ?? '').split(/[\n,;]+/).map((value) => value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')).filter((value) => /^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/i.test(value)))].slice(0, 50)
  if (!targets.length) return NextResponse.json({ error: 'Ajoute au moins un domaine valide, un par ligne.' }, { status: 400 })
  const rows = targets.map((domain) => ({ name: domain.split('.')[0], domain, website_url: `https://${domain}`, status: 'discovered', source_url: `https://${domain}`, source_notes: 'Domaine ajouté depuis la recherche publique · à analyser' }))
  const admin = getSupabaseAdminClient() as any
  let added = 0
  for (const row of rows) {
    const { data: existing, error: lookupError } = await admin.from('acquisition_companies').select('id').eq('domain', row.domain).maybeSingle()
    if (lookupError) return NextResponse.json({ error: 'Qualio n’a pas pu vérifier les domaines.' }, { status: 500 })
    if (existing) continue
    const { error: insertError } = await admin.from('acquisition_companies').insert(row)
    if (insertError) return NextResponse.json({ error: 'Qualio n’a pas pu enregistrer ces domaines.' }, { status: 500 })
    added += 1
  }
  return NextResponse.json({ companiesAdded: added, contactsAdded: 0 })
}
