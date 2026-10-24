import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { MAX_IMPORT_ROWS, normalizeRow, type ImportRow } from '@/lib/admin/acquisition-csv'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

const chunk = <T,>(items: T[], size: number) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size))

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const body = await request.json().catch(() => ({})) as { rows?: Array<Partial<ImportRow>>; verified?: boolean }
  if (!Array.isArray(body.rows) || body.rows.length === 0) return NextResponse.json({ error: 'Le fichier ne contient aucune ligne à importer.' }, { status: 400 })
  if (body.rows.length > MAX_IMPORT_ROWS) return NextResponse.json({ error: `Importe ${MAX_IMPORT_ROWS} lignes maximum à la fois.` }, { status: 400 })

  const seen = new Set<string>()
  const rows: ImportRow[] = []
  let ignored = 0
  for (const input of body.rows) {
    const result = normalizeRow(input)
    if ('reason' in result || seen.has(result.row.email)) { ignored += 1; continue }
    seen.add(result.row.email)
    rows.push(result.row)
  }
  if (!rows.length) return NextResponse.json({ error: 'Aucune ligne valide dans ce fichier.' }, { status: 400 })

  const admin = getSupabaseAdminClient() as any
  const domains = [...new Set(rows.map((row) => row.domain))]
  const emails = rows.map((row) => row.email)

  const companyIds = new Map<string, string>()
  for (const part of chunk(domains, 100)) {
    const { data, error } = await admin.from('acquisition_companies').select('id, domain').in('domain', part)
    if (error) return NextResponse.json({ error: 'Qualio n’a pas pu vérifier les entreprises.' }, { status: 500 })
    for (const row of data ?? []) companyIds.set(String(row.domain).toLowerCase(), row.id)
  }
  const newCompanies = domains.filter((domain) => !companyIds.has(domain)).map((domain) => ({
    name: rows.find((row) => row.domain === domain)?.company ?? domain, domain, website_url: `https://${domain}`, status: 'review', source_notes: 'Import CSV',
  }))
  for (const part of chunk(newCompanies, 100)) {
    const { data, error } = await admin.from('acquisition_companies').insert(part).select('id, domain')
    if (error) return NextResponse.json({ error: 'Qualio n’a pas pu enregistrer les entreprises.' }, { status: 500 })
    for (const row of data ?? []) companyIds.set(String(row.domain).toLowerCase(), row.id)
  }

  const existingEmails = new Set<string>()
  for (const part of chunk(emails, 100)) {
    const { data, error } = await admin.from('acquisition_contacts').select('email').in('email', part)
    if (error) return NextResponse.json({ error: 'Qualio n’a pas pu vérifier les contacts.' }, { status: 500 })
    for (const row of data ?? []) existingEmails.add(String(row.email).toLowerCase())
  }
  const newContacts = rows.filter((row) => !existingEmails.has(row.email) && companyIds.has(row.domain)).map((row) => ({
    company_id: companyIds.get(row.domain), email: row.email, full_name: row.name || null, role: row.role || null,
    email_status: body.verified ? 'verified' : 'unverified', confidence: body.verified ? 90 : 60,
  }))
  for (const part of chunk(newContacts, 100)) {
    const { error } = await admin.from('acquisition_contacts').insert(part)
    if (error) return NextResponse.json({ error: 'Qualio n’a pas pu enregistrer les contacts.' }, { status: 500 })
  }
  return NextResponse.json({ contactsAdded: newContacts.length, companiesAdded: newCompanies.length, duplicates: rows.length - newContacts.length, ignored })
}
