import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

type HunterEmail = { value?: string; type?: string; confidence?: number; first_name?: string; last_name?: string; position?: string; verification?: { status?: string } }
type HunterResult = { data?: { domain?: string; organization?: string; emails?: HunterEmail[] }; errors?: unknown }

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const apiKey = process.env.HUNTER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'HUNTER_API_KEY n’est pas configurée.' }, { status: 503 })
  const body = await request.json().catch(() => ({})) as { targets?: string }
  const targets = [...new Set(String(body.targets ?? '').split(/[\n,;]+/).map((value) => value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(Boolean))].slice(0, 10)
  if (!targets.length) return NextResponse.json({ error: 'Ajoute au moins un domaine ou nom d’entreprise.' }, { status: 400 })
  const admin = getSupabaseAdminClient() as any
  let companiesAdded = 0
  let contactsAdded = 0
  const errors: string[] = []
  for (const target of targets) {
    const parameter = target.includes('.') ? `domain=${encodeURIComponent(target)}` : `company=${encodeURIComponent(target)}`
    try {
      const response = await fetch(`https://api.hunter.io/v2/domain-search?${parameter}&api_key=${encodeURIComponent(apiKey)}`, { headers: { accept: 'application/json' }, cache: 'no-store' })
      const payload = await response.json().catch(() => null) as HunterResult | null
      if (!response.ok) { errors.push(`${target}: Hunter HTTP ${response.status}`); continue }
      const domain = payload?.data?.domain ?? target
      const name = payload?.data?.organization ?? target
      const { data: company, error: companyError } = await admin.from('acquisition_companies').upsert({ name, domain, website_url: `https://${domain}`, status: 'review', source_url: 'https://hunter.io', source_notes: 'Hunter Domain Search · source autorisée' }, { onConflict: 'domain' }).select('id').single()
      if (companyError || !company) { errors.push(`${target}: enregistrement impossible`); continue }
      companiesAdded += 1
      for (const email of payload?.data?.emails ?? []) {
        if (!email.value) continue
        const { error } = await admin.from('acquisition_contacts').upsert({ company_id: company.id, email: email.value, full_name: [email.first_name, email.last_name].filter(Boolean).join(' ') || null, role: email.position ?? null, email_status: email.verification?.status === 'valid' ? 'verified' : 'unverified', email_source_url: 'https://hunter.io', confidence: email.confidence ?? null }, { onConflict: 'email', ignoreDuplicates: true })
        if (!error) contactsAdded += 1
      }
    } catch { errors.push(`${target}: Hunter injoignable`) }
  }
  return NextResponse.json({ companiesAdded, contactsAdded, errors }, { status: companiesAdded || contactsAdded ? 200 : 502 })
}
