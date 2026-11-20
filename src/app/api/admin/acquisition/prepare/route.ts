import { loadDraftReport, tryAutoCreateAppStoreReport } from '@/lib/admin/acquisition-report-store'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { buildDraft, GENERIC_EMAIL } from '@/lib/admin/acquisition-draft'
import { pickBestContact } from '@/lib/admin/acquisition-company'
import { sameCompanyDomain, scanCompany } from '@/lib/admin/acquisition-scan'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export const maxDuration = 60

/** Une seule étape : analyse le site si besoin, puis crée un brouillon pour le meilleur contact. */
export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const { companyId } = await request.json().catch(() => ({})) as { companyId?: string }
  if (!companyId) return NextResponse.json({ error: 'Entreprise manquante.' }, { status: 400 })
  const admin = getSupabaseAdminClient() as any
  const { data: company } = await admin.from('acquisition_companies').select('id, name, domain, country, source_notes').eq('id', companyId).maybeSingle()
  if (!company) return NextResponse.json({ error: 'Entreprise introuvable.' }, { status: 404 })

  type ContactRow = { id: string; email: string; full_name: string | null; email_status: string; email_source_url: string | null; confidence: number | null }
  const load = async (): Promise<ContactRow[]> =>
    ((await admin.from('acquisition_contacts').select('id, email, full_name, email_status, email_source_url, confidence').eq('company_id', company.id)).data ?? []) as ContactRow[]
  let contacts = await load()
  let scanned = false
  if (contacts.length === 0 || contacts.every((c) => !c.email_source_url)) {
    await Promise.race([scanCompany(admin, company), new Promise((resolve) => setTimeout(resolve, 15_000))]).catch(() => {})
    scanned = true
    contacts = await load()
  }
  for (const contact of contacts) {
    if (!contact.email_source_url && company.domain && sameCompanyDomain(contact.email, company.domain)) {
      const fallbackUrl = `https://${company.domain}`
      await admin.from('acquisition_contacts').update({ email_source_url: fallbackUrl }).eq('id', contact.id)
      contact.email_source_url = fallbackUrl
    }
  }
  const usable = contacts.filter((contact: any) => !['suppressed', 'invalid'].includes(contact.email_status))
  const best = pickBestContact(contacts)
  if (!best) return NextResponse.json({ scanned, emails: 0, drafted: 0, reason: 'Aucun email trouvé sur le site.' })

  const { data: existing } = await admin
    .from('acquisition_messages')
    .select('id, subject, body, status')
    .in('contact_id', usable.map((contact: any) => contact.id))
    .order('created_at', { ascending: false })
    .limit(1)
  if (existing?.length) {
    const open = existing.find((item: any) => item.status === 'draft' || item.status === 'approved') ?? null
    return NextResponse.json({ scanned, emails: usable.length, drafted: 0, reason: 'Un message existe déjà pour cette entreprise.', message: open })
  }

  const { data: evidence } = await admin.from('acquisition_signals').select('label, evidence, source_url').eq('company_id', company.id).order('confidence', { ascending: false }).limit(3)
  let report = await loadDraftReport(admin, company.id)
  if (!report) {
    report = await tryAutoCreateAppStoreReport(admin, company)
  }
  if (!report) {
    return NextResponse.json({
      scanned,
      emails: usable.length,
      drafted: 0,
      needsReport: true,
      reason: 'Aucun rapport d’avis lié : colle des avis (Trustpilot, G2, Play) dans le Studio pour générer ce brouillon avec rapport.',
    })
  }
  const draft = buildDraft({ report, fullName: GENERIC_EMAIL.test(best.email) ? null : best.full_name, companyName: company.name, companyNotes: company.source_notes, evidence: evidence ?? [] })
  const { data: inserted, error } = await admin
    .from('acquisition_messages')
    .insert({ contact_id: best.id, subject: draft.subject, body: draft.body, status: 'draft' })
    .select('id, subject, body, status')
    .single()
  if (error || !inserted) return NextResponse.json({ error: 'Le brouillon n’a pas pu être enregistré.' }, { status: 500 })
  return NextResponse.json({ scanned, emails: usable.length, drafted: 1, message: inserted })
}
