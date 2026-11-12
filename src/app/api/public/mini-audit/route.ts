import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { fetchAppStoreReviews, parsePastedReviews, type PublicReview } from '@/lib/admin/acquisition-reviews'
import { analyzePublicReviews, REPORT_MIN_REVIEWS, reportToken, type ProspectReport } from '@/lib/admin/acquisition-report'
import { consumeMiniAuditQuota, getTrustedClientIp } from '@/lib/public/mini-audit-guard'

export const maxDuration = 60

const MAX_PUBLIC_REVIEWS = 60
const MAX_DB_AUDITS_PER_HOUR = 20
const CACHE_TTL_HOURS = 24

export async function POST(request: NextRequest) {
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
  let source: 'app_store' | 'pasted' = 'pasted'
  let sourceLabel = 'Avis clients'
  let sourceUrl: string | null = null
  let reviews: PublicReview[] = []

  const admin = getSupabaseAdminClient() as any

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

    // 1. VÉRIFICATION DU CACHE 24H : Si cette application a déjà été analysée récemment,
    // on renvoie le diagnostic existant sans consommer AUCUN token IA ni quota de requêtes.
    try {
      const cacheThreshold = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString()
      const { data: cachedRow } = await admin
        .from('acquisition_reports')
        .select('token, report, subject_name, source_label, review_count, average_rating')
        .eq('source_url', sourceUrl)
        .gte('created_at', cacheThreshold)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cachedRow?.report && typeof cachedRow.report === 'object') {
        const cachedReport = cachedRow.report as ProspectReport
        const problems = Array.isArray(cachedReport.problems) ? cachedReport.problems : []
        if (problems.length > 0) {
          const [topProblem = null, ...restProblems] = problems
          return NextResponse.json({
            subjectName: (typeof body.appName === 'string' && body.appName.trim()) || cachedRow.subject_name || subjectName,
            sourceLabel: cachedRow.source_label || sourceLabel,
            reviewCount: cachedReport.reviewCount ?? cachedRow.review_count ?? 0,
            averageRating: cachedReport.averageRating ?? cachedRow.average_rating ?? null,
            negativeCount: cachedReport.negativeCount ?? 0,
            summary: cachedReport.summary ?? '',
            topProblem,
            lockedProblems: restProblems.map((p) => ({
              theme: p.theme,
              mentions: p.mentions,
              priority: p.priority,
            })),
            themes: (cachedReport.themes ?? []).slice(0, 4).map((t) => ({
              name: t.name,
              mentions: t.mentions,
              negativeShare: t.negativeShare,
            })),
            token: cachedRow.token ? String(cachedRow.token) : null,
            cached: true,
          })
        }
      }
    } catch {
      /* Cache miss ou indisponibilité DB non bloquante */
    }

    // Si pas en cache, on extrait les avis du flux public Apple
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

  // 2. Vérification du quota IP : consommé uniquement si un NOUVEL appel IA est nécessaire
  const ip = getTrustedClientIp(request)
  const quota = consumeMiniAuditQuota(ip)
  if (!quota.allowed) {
    return NextResponse.json(
      { error: 'Vous avez atteint la limite d’aperçus gratuits sur cette heure. Créez un compte gratuit pour analyser jusqu’à 50 avis complets.' },
      { status: 429, headers: { 'Retry-After': String(quota.retryAfterSec) } },
    )
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

  // 3. Garde-fou global persistant (inter-instances serverless) si la table acquisition_reports est accessible
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count, error: countError } = await admin
      .from('acquisition_reports')
      .select('id', { count: 'exact', head: true })
      .is('company_id', null)
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
  let report: ProspectReport
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
        company_id: null,
        subject_name: subjectName.slice(0, 200),
        source,
        source_label: sourceLabel.slice(0, 60),
        source_url: sourceUrl,
        review_count: report.reviewCount,
        average_rating: report.averageRating,
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
