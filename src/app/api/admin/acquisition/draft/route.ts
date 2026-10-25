import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { buildDraft } from '@/lib/admin/acquisition-draft'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const { contactId, followUpOf } = await request.json().catch(() => ({})) as { contactId?: string; followUpOf?: string }
  const admin = getSupabaseAdminClient() as any
  let contactIdValue = contactId
  let original: { id: string; subject: string; contact_id: string; status: string } | null = null
  if (followUpOf) {
    const { data } = await admin.from('acquisition_messages').select('id, subject, contact_id, status').eq('id', followUpOf).maybeSingle()
    if (!data) return NextResponse.json({ error: 'Message d’origine introuvable.' }, { status: 404 })
    if (data.status !== 'sent') return NextResponse.json({ error: 'On ne relance que les messages envoyés sans réponse.' }, { status: 409 })
    original = data
    contactIdValue = data.contact_id
  }
  if (!contactIdValue) return NextResponse.json({ error: 'Contact manquant.' }, { status: 400 })
  const { data: contact } = await admin.from('acquisition_contacts').select('id, company_id, email, full_name, email_status, company:acquisition_companies(name)').eq('id', contactIdValue).maybeSingle()
  if (!contact) return NextResponse.json({ error: 'Contact introuvable.' }, { status: 404 })
  if (['suppressed', 'invalid'].includes(contact.email_status)) return NextResponse.json({ error: 'Ce contact ne doit plus être contacté.' }, { status: 409 })
  const { data: pending } = await admin.from('acquisition_messages').select('id').eq('contact_id', contact.id).in('status', ['draft', 'approved']).limit(1)
  if (pending?.length) return NextResponse.json({ error: 'Un brouillon existe déjà pour ce contact.' }, { status: 409 })
  const { data: evidence } = await admin.from('acquisition_signals').select('label, evidence, source_url').eq('company_id', contact.company_id).order('confidence', { ascending: false }).limit(3)
  const draft = buildDraft({ fullName: contact.full_name, companyName: contact.company?.name, followUpOf: original, evidence: evidence ?? [] })
  const { data, error } = await admin.from('acquisition_messages').insert({ contact_id: contact.id, subject: draft.subject, body: draft.body, status: 'draft', follow_up_of: original?.id ?? null }).select('id').single()
  if (error) return NextResponse.json({ error: 'Le brouillon n’a pas pu être enregistré.' }, { status: 500 })
  return NextResponse.json({ draft: data })
}
