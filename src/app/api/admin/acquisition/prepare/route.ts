import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { buildDraft, GENERIC_EMAIL } from '@/lib/admin/acquisition-draft'
import { scanCompany } from '@/lib/admin/acquisition-scan'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export const maxDuration = 60

/** Une seule étape : analyse le site si besoin, puis crée un brouillon pour le meilleur contact. */
export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const { companyId } = await request.json().catch(() => ({})) as { companyId?: string }
  if (!companyId) return NextResponse.json({ error: 'Entreprise manquante.' }, { status: 400 })
  const admin = getSupabaseAdminClient() as any
  const { data: company } = await admin.from('acquisition_companies').select('id, name, domain').eq('id', companyId).maybeSingle()
  if (!company) return NextResponse.json({ error: 'Entreprise introuvable.' }, { status: 404 })

  const load = async () => (await admin.from('acquisition_contacts').select('id, email, full_name, email_status, confidence').eq('company_id', company.id)).data ?? []
  let contacts = await load()
  let scanned = false
  if (contacts.length === 0) { await scanCompany(admin, company); scanned = true; contacts = await load() }
  const usable = contacts.filter((contact: any) => !['suppressed', 'invalid'].includes(contact.email_status))
  if (usable.length === 0) return NextResponse.json({ scanned, emails: 0, drafted: 0, reason: 'Aucun email trouvé sur le site.' })

  const { data: existing } = await admin.from('acquisition_messages').select('id').in('contact_id', usable.map((contact: any) => contact.id)).limit(1)
  if (existing?.length) return NextResponse.json({ scanned, emails: usable.length, drafted: 0, reason: 'Un message existe déjà pour cette entreprise.' })

  const best = [...usable].sort((a: any, b: any) => Number(GENERIC_EMAIL.test(a.email)) - Number(GENERIC_EMAIL.test(b.email)) || (b.confidence ?? 0) - (a.confidence ?? 0))[0]
  const { data: evidence } = await admin.from('acquisition_signals').select('label, evidence, source_url').eq('company_id', company.id).order('confidence', { ascending: false }).limit(3)
  if (!evidence?.length) return NextResponse.json({ scanned, emails: usable.length, drafted: 0, reason: 'Aucun signal public suffisamment précis pour rédiger un email personnalisé.' })
  const draft = buildDraft({ fullName: best.full_name, companyName: company.name, evidence: evidence ?? [] })
  const { error } = await admin.from('acquisition_messages').insert({ contact_id: best.id, subject: draft.subject, body: draft.body, status: 'draft' })
  if (error) return NextResponse.json({ error: 'Le brouillon n’a pas pu être enregistré.' }, { status: 500 })
  return NextResponse.json({ scanned, emails: usable.length, drafted: 1 })
}
