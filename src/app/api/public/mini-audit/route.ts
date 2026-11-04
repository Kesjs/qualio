import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { fetchAppStoreReviews, parsePastedReviews, type PublicReview } from '@/lib/admin/acquisition-reviews'
import { analyzePublicReviews, REPORT_MIN_REVIEWS, reportToken } from '@/lib/admin/acquisition-report'
import { consumeMiniAuditQuota, getTrustedClientIp } from '@/lib/public/mini-audit-guard'

export const maxDuration = 60

const MAX_PUBLIC_REVIEWS = 60
const MAX_DB_AUDITS_PER_HOUR = 40

export async function POST(request: NextRequest) {
  const ip = getTrustedClientIp(request)
  const quota = consumeMiniAuditQuota(ip)
  if (!quota.allowed) {
    return NextResponse.json(
      { error: 'Vous avez atteint la limite d’aperçus gratuits sur cette heure. Créez un compte gratuit pour analyser jusqu’à 50 avis complets.' },
      { status: 429, headers: { 'Retry-After': String(quota.retryAfterSec) } },
    )
  }

  const body = (await request.json().catch(() => ({}))) as {
    mode?: unknown
    appId?: unknown
    appName?: unknown
    appUrl?: unknown
    country?: unknown
    subjectName?: unknown
    text?: unknown
  }

  let subjectName = ''
  let source: 'app_store' | 'other' = 'other'
  let sourceLabel = 'Avis clients'
  let sourceUrl: string | null = null
  let reviews: PublicReview[] = []

  if (body.mode === 'app_store') {
    const appId = typeof body.appId === 'string' ? body.appId.trim() : ''
    const country = typeof body.country === 'string' ? body.country.trim().toLowerCase() : 'fr'
    if (!/^\d{6,12}$/.test(appId)) {
      return NextResponse.json({ error: 'Sélectionnez une application iOS valide.' }, { status: 400 })
    }
    subjectName = (typeof body.appName === 'string' ? body.appName.trim() : '') || 'Application iOS'
    source = 'app_store'
    sourceLabel = 'App Store'
    sourceUrl =
      typeof body.appUrl === 'string' && /^https:\/\/apps\.apple\.com\//i.test(body.appUrl.trim())
        ? body.appUrl.trim()
        : `https://apps.apple.com/${country}/app/id${appId}`

    try {
      reviews = await fetchAppStoreReviews(appId, country, 1)
    } catch {
      return NextResponse.json({ error: 'Impossible de lire les avis App Store pour le moment.' }, { status: 502 })
    }
  } else if (body.mode === 'pasted') {
    subjectName = (typeof body.subjectName === 'string' ? body.subjectName.trim().slice(0, 100) : '') || 'Mon produit'
    const text = typeof body.text === 'string' ? body.text.slice(0, 80_000) : ''
    reviews = parsePastedReviews(text)
  } else {
    return NextResponse.json({ error: 'Mode d’analyse non reconnu.' }, { status: 400 })
  }

  if (reviews.length < REPORT_MIN_REVIEWS) {
    return NextResponse.json(
      {
        error:
          body.mode === 'app_store'
            ? `Seulement ${reviews.length} avis écrit${reviews.length > 1 ? 's' : ''} trouvé${reviews.length > 1 ? 's' : ''} sur cet App Store (minimum ${REPORT_MIN_REVIEWS} requis). Essayez un autre pays ou collez vos avis manuellement.`
            : `Ajoutez au moins ${REPORT_MIN_REVIEWS} avis séparés par une ligne vide (${reviews.length} détecté${reviews.length > 1 ? 's' : ''}).`,
      },
      { status: 422 },
    )
  }

  // Garde-fou global persistant (inter-instances serverless) si la table acquisition_reports est accessible
  const admin = getSupabaseAdminClient() as any
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: countError } = await admin
      .from('acquisition_reports')
      .select('id', { count: 'exact', head: true })
      .is('prospect_id', null)
      .gte('created_at', oneHourAgo)
    if (!countError && (count ?? 0) >= MAX_DB_AUDITS_PER_HOUR) {
      return NextResponse.json(
        { error: 'Le mini-audit en direct est très sollicité en ce moment. Créez votre espace gratuit pour lancer votre analyse immédiatement.' },
        { status: 429 },
      )
    }
  } catch {
    /* Non bloquant si la base est hors ligne ou avant migration */
  }

  const sample = reviews.slice(0, MAX_PUBLIC_REVIEWS)
  let report
  try {
    report = await analyzePublicReviews(sample)
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : 'L’analyse n’a pas pu aboutir.'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // Persister le rapport pour permettre l'ouverture 1-clic après création de compte (/onboarding?report=token)
  let persistedToken: string | null = null
  try {
    const candidateToken = reportToken()
    const { data: savedRow, error: insertError } = await admin
      .from('acquisition_reports')
      .insert({
        token: candidateToken,
        prospect_id: null,
        subject_name: subjectName.slice(0, 160),
        source,
        source_label: sourceLabel,
        source_url: sourceUrl,
        review_count: report.reviewCount,
        report,
      })
      .select('token')
      .maybeSingle()
    if (!insertError && savedRow?.token) {
      persistedToken = String(savedRow.token)
    }
  } catch {
    /* Si la migration n'est pas encore jouée, l'aperçu fonctionne quand même sans token */
  }

  const [topProblem = null, ...restProblems] = report.problems

  return NextResponse.json({
    subjectName,
    sourceLabel,
    reviewCount: report.reviewCount,
    averageRating: report.averageRating,
    negativeCount: report.negativeCount,
    summary: report.summary,
    topProblem,
    lockedProblems: restProblems.map((p) => ({
      theme: p.theme,
      mentions: p.mentions,
      priority: p.priority,
    })),
    themes: report.themes.slice(0, 4).map((t) => ({
      name: t.name,
      mentions: t.mentions,
      negativeShare: t.negativeShare,
    })),
    token: persistedToken,
  })
}
