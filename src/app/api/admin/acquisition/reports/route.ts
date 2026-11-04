import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { fetchAppStoreReviews, parsePastedReviews, type PublicReview } from '@/lib/admin/acquisition-reviews'
import { analyzePublicReviews, reportToken } from '@/lib/admin/acquisition-report'
import { publicReportUrl } from '@/lib/admin/acquisition-report-url'
import { buildDraft, GENERIC_EMAIL, type DraftReport } from '@/lib/admin/acquisition-draft'

export const maxDuration = 90

const UUID = /^[0-9a-f-]{36}$/i

type Body = {
  source?: 'app_store' | 'pasted'
  appId?: string
  appName?: string
  appUrl?: string
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

  let report
  try {
    report = await analyzePublicReviews(reviews)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'L’analyse a échoué.' }, { status: 422 })
  }

  const admin = getSupabaseAdminClient() as any
  const token = reportToken()
  const { data, error } = await admin
    .from('acquisition_reports')
    .insert({
      company_id: companyId,
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

  // Si ce prospect a déjà un brouillon non envoyé, on remplace son texte par l'accroche « valeur d'abord ».
  if (companyId) {
    const [{ data: companyRow }, { data: companyContacts }] = await Promise.all([
      admin.from('acquisition_companies').select('name, source_notes').eq('id', companyId).maybeSingle(),
      admin.from('acquisition_contacts').select('id, email, full_name').eq('company_id', companyId),
    ])
    const contactIds = ((companyContacts ?? []) as Array<{ id: string; email: string; full_name: string | null }>).map((c) => c.id)
    if (contactIds.length > 0) {
      const { data: openDrafts } = await admin
        .from('acquisition_messages')
        .select('id, contact_id, follow_up_of')
        .in('contact_id', contactIds)
        .in('status', ['draft', 'approved'])
        .is('follow_up_of', null)
        .limit(5)
      if (openDrafts?.length) {
        const contactMap = new Map(((companyContacts ?? []) as Array<{ id: string; email: string; full_name: string | null }>).map((c) => [c.id, c]))
        const top = report.problems[0]
        const draftReport: DraftReport = {
          url,
          reviewCount: report.reviewCount,
          sourceLabel,
          subjectName,
          topProblem: top ? { title: top.title, mentions: top.mentions } : null,
          problemCount: report.problems.length,
        }
        for (const msg of openDrafts as Array<{ id: string; contact_id: string }>) {
          const contact = contactMap.get(msg.contact_id)
          const rebuilt = buildDraft({
            report: draftReport,
            fullName: contact && GENERIC_EMAIL.test(contact.email) ? null : contact?.full_name,
            companyName: companyRow?.name ?? subjectName,
            companyNotes: companyRow?.source_notes,
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
    problems: report.problems.map((item) => ({ title: item.title, mentions: item.mentions })),
  })
}
