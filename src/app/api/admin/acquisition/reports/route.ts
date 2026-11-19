import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { fetchAppStoreReviews, parsePastedReviews, searchAppStore, type PublicReview } from '@/lib/admin/acquisition-reviews'
import { analyzePublicReviews, reportToken } from '@/lib/admin/acquisition-report'
import { publicReportUrl } from '@/lib/admin/acquisition-report-url'
import { buildDraft, GENERIC_EMAIL } from '@/lib/admin/acquisition-draft'
import { toDraftReport } from '@/lib/admin/acquisition-report-store'
import { pickBestContact, resolveAppStoreCompany } from '@/lib/admin/acquisition-company'
import { sameCompanyDomain, scanCompany } from '@/lib/admin/acquisition-scan'

export const maxDuration = 90

const UUID = /^[0-9a-f-]{36}$/i

type Body = {
  source?: 'app_store' | 'pasted'
  appId?: string
  appName?: string
  appUrl?: string
  sellerUrl?: string | null
  country?: string
  text?: string
  subjectName?: string
  sourceLabel?: string
  sourceUrl?: string
  companyId?: string | null
}

/** Génère un rapport d'avis publics, l'enregistre et met à jour le brouillon existant (s'il y en a un) avec l'accroche personnalisée. */
export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as Body
  const companyId = body.companyId && UUID.test(body.companyId) ? body.companyId : null

  let reviews: PublicReview[]
  let subjectName: string
  let sourceLabel: string
  let sourceUrl: string | null = null
  if (body.source === 'app_store') {
    const appId = String(body.appId ?? '')
    if (!/^\d{6,12}$/.test(appId)) return NextResponse.json({ error: 'Choisis une app dans les résultats de recherche ou colle son lien App Store.' }, { status: 400 })
    subjectName = String(body.appName ?? '').trim().slice(0, 200) || 'Application'
    sourceLabel = 'App Store'
    sourceUrl = typeof body.appUrl === 'string' && body.appUrl.startsWith('https://apps.apple.com/') ? body.appUrl : null
    try {
      reviews = await fetchAppStoreReviews(appId, String(body.country ?? 'fr').toLowerCase())
    } catch (error) {
      console.error('[Report] App Store reviews', error)
      return NextResponse.json({ error: 'Impossible de lire les avis App Store pour le moment.' }, { status: 502 })
    }
  } else if (body.source === 'pasted') {
    reviews = parsePastedReviews(String(body.text ?? '').slice(0, 200_000))
    subjectName = String(body.subjectName ?? '').trim().slice(0, 200)
    sourceLabel = String(body.sourceLabel ?? '').trim().slice(0, 60) || 'publics'
    if (typeof body.sourceUrl === 'string' && /^https?:\/\//i.test(body.sourceUrl.trim())) {
      sourceUrl = body.sourceUrl.trim().slice(0, 500)
    }
    if (!subjectName) return NextResponse.json({ error: 'Indique le nom de l’entreprise ou du produit analysé.' }, { status: 400 })
  } else {
    return NextResponse.json({ error: 'Source d’avis inconnue.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient() as any

  type ContactRow = {
    id: string
    email: string
    full_name: string | null
    email_status: string
    email_source_url: string | null
    confidence: number | null
  }

  // Résolution de l'entreprise et scan du site menés EN PARALLÈLE de la synthèse IA Gemini,
  // avec un plafond de 18 s pour ne jamais faire expirer la fonction serverless (60 s max sur Vercel).
  const resolveCompanyAndContacts = async (): Promise<{
    company: { id: string; name: string; domain: string; source_notes: string | null } | null
    contacts: ContactRow[]
  }> => {
    try {
      let company: { id: string; name: string; domain: string; source_notes: string | null } | null = null
      if (companyId) {
        const { data: existingCompany } = await admin
          .from('acquisition_companies')
          .select('id, name, domain, source_notes')
          .eq('id', companyId)
          .maybeSingle()
        if (existingCompany) company = existingCompany
      } else if (body.source === 'app_store') {
        let sellerUrl = body.sellerUrl
        if (sellerUrl === undefined && body.appId) {
          const lookup = await searchAppStore(String(body.appId), String(body.country ?? 'fr').toLowerCase(), 1).catch(() => [])
          sellerUrl = lookup[0]?.sellerUrl ?? null
        }
        company = await resolveAppStoreCompany(admin, {
          sellerUrl,
          companyName: subjectName,
          sourceUrl,
          country: String(body.country ?? 'fr'),
        })
      }

      if (!company) return { company: null, contacts: [] }

      const loadContacts = async (): Promise<ContactRow[]> =>
        ((await admin
          .from('acquisition_contacts')
          .select('id, email, full_name, email_status, email_source_url, confidence')
          .eq('company_id', company!.id)).data ?? []) as ContactRow[]

      let companyContacts = await loadContacts()
      if (companyContacts.length === 0 || companyContacts.every((c) => !c.email_source_url)) {
        await Promise.race([
          scanCompany(admin, company),
          new Promise((resolve) => setTimeout(resolve, 15_000)),
        ]).catch((err) => console.warn('[Report] scanCompany warning', err))
        companyContacts = await loadContacts()
      }

      // Si un contact du domaine de l'entreprise n'a toujours pas d'email_source_url, rattacher https://{domain}
      for (const contact of companyContacts) {
        if (!contact.email_source_url && company.domain && sameCompanyDomain(contact.email, company.domain)) {
          const fallbackUrl = `https://${company.domain}`
          await admin
            .from('acquisition_contacts')
            .update({ email_source_url: fallbackUrl })
            .eq('id', contact.id)
          contact.email_source_url = fallbackUrl
        }
      }

      return { company, contacts: companyContacts }
    } catch (err) {
      console.warn('[Report] resolveCompanyAndContacts warning', err)
      return { company: null, contacts: [] }
    }
  }

  let report
  let companyResult: {
    company: { id: string; name: string; domain: string; source_notes: string | null } | null
    contacts: ContactRow[]
  }
  try {
    ;[report, companyResult] = await Promise.all([
      analyzePublicReviews(reviews),
      resolveCompanyAndContacts(),
    ])
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'L’analyse a échoué.' }, { status: 422 })
  }

  const resolvedCompany = companyResult.company
  const companyContacts = companyResult.contacts
  const resolvedCompanyId = resolvedCompany?.id ?? companyId

  const token = reportToken()
  const { data, error } = await admin
    .from('acquisition_reports')
    .insert({
      company_id: resolvedCompanyId,
      token,
      subject_name: subjectName,
      source: body.source,
      source_label: sourceLabel,
      source_url: sourceUrl,
      review_count: report.reviewCount,
      average_rating: report.averageRating,
      report,
    })
    .select('id, token')
    .single()

  if (error) {
    console.error('[Report] insert', error)
    return NextResponse.json(
      { error: 'Le rapport a été calculé mais n’a pas pu être enregistré. Applique la migration « 20261104020000_acquisition_reports.sql » sur Supabase puis réessaie.' },
      { status: 500 },
    )
  }

  const url = publicReportUrl(data.token)
  let draftUpdated = false
  let bestContactPayload: {
    id: string
    email: string
    fullName: string | null
    emailStatus: string
    emailSourceUrl: string | null
    isGeneric: boolean
  } | null = null

  if (resolvedCompany) {
    const best = pickBestContact(companyContacts)
    if (best) {
      bestContactPayload = {
        id: best.id,
        email: best.email,
        fullName: best.full_name,
        emailStatus: best.email_status,
        emailSourceUrl: best.email_source_url ?? null,
        isGeneric: GENERIC_EMAIL.test(best.email),
      }
    }

    // Si ce prospect a déjà un brouillon non envoyé, on remplace son texte par l'accroche « valeur d'abord ».
    const contactIds = companyContacts.map((c) => c.id)
    if (contactIds.length > 0) {
      const { data: openDrafts } = await admin
        .from('acquisition_messages')
        .select('id, contact_id, follow_up_of')
        .in('contact_id', contactIds)
        .in('status', ['draft', 'approved'])
        .is('follow_up_of', null)
        .limit(5)
      if (openDrafts?.length) {
        const contactMap = new Map(companyContacts.map((c) => [c.id, c]))
        const draftReport = toDraftReport({
          url,
          reviewCount: report.reviewCount,
          sourceLabel,
          subjectName,
          report,
        })
        for (const msg of openDrafts as Array<{ id: string; contact_id: string }>) {
          const contact = contactMap.get(msg.contact_id)
          const rebuilt = buildDraft({
            report: draftReport,
            fullName: contact && GENERIC_EMAIL.test(contact.email) ? null : contact?.full_name,
            companyName: resolvedCompany.name ?? subjectName,
            companyNotes: resolvedCompany.source_notes,
          })
          await admin.from('acquisition_messages').update({ subject: rebuilt.subject, body: rebuilt.body }).eq('id', msg.id)
          draftUpdated = true
        }
      }
    }
  }

  return NextResponse.json({
    id: data.id,
    token: data.token,
    url,
    reviewCount: report.reviewCount,
    averageRating: report.averageRating,
    draftUpdated,
    companyId: resolvedCompanyId,
    contact: bestContactPayload,
    problems: report.problems.map((item) => ({ title: item.title, mentions: item.mentions })),
    themes: report.themes.slice(0, 3),
  })
}
