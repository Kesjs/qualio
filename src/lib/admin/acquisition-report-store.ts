import { cleanDomain } from '@/lib/admin/acquisition-ai'
import type { DraftReport } from '@/lib/admin/acquisition-draft'
import { analyzePublicReviews, REPORT_MIN_REVIEWS, reportToken, type ProspectReport } from '@/lib/admin/acquisition-report'
import { publicReportUrl } from '@/lib/admin/acquisition-report-url'
import { appStoreIdFrom, fetchAppStoreReviews, searchAppStore } from '@/lib/admin/acquisition-reviews'

/** Convertit un ProspectReport en DraftReport pour buildDraft. */
export function toDraftReport(input: {
  url: string
  reviewCount: number
  sourceLabel: string
  subjectName: string
  report: ProspectReport
}): DraftReport {
  const topThemeName = input.report.themes?.[0]?.name?.toLowerCase() ?? ''
  const matchingProblem =
    input.report.problems?.find((p) => p.quotes?.length && p.theme?.toLowerCase() === topThemeName) ??
    input.report.problems?.find((p) => p.quotes?.length)
  return {
    url: input.url,
    reviewCount: input.reviewCount,
    sourceLabel: input.sourceLabel,
    subjectName: input.subjectName,
    themes: (input.report.themes ?? []).slice(0, 3).map((theme) => ({
      name: theme.name,
      mentions: theme.mentions,
      negativeShare: theme.negativeShare ?? null,
    })),
    topQuote: matchingProblem?.quotes?.[0]?.text ?? null,
    periodStart: input.report.periodStart ?? null,
    periodEnd: input.report.periodEnd ?? null,
  }
}

/** Dernier rapport actif d'une entreprise, au format attendu par les brouillons. Null si aucun ou si la table n'existe pas encore. */
export async function loadDraftReport(admin: any, companyId: string | null | undefined): Promise<DraftReport | null> {
  if (!companyId) return null
  const { data, error } = await admin
    .from('acquisition_reports')
    .select('token, subject_name, source_label, review_count, report')
    .eq('company_id', companyId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return toDraftReport({
    url: publicReportUrl(data.token),
    reviewCount: data.review_count,
    sourceLabel: data.source_label,
    subjectName: data.subject_name,
    report: data.report as ProspectReport,
  })
}

/**
 * Tente de générer automatiquement un rapport App Store pour une entreprise découverte sur le web
 * (via un signal `app_store` déjà détecté sur le site, ou une recherche iTunes correspondant au même domaine).
 * Retourne `null` si aucune app correspondante ou trop peu d'avis (< REPORT_MIN_REVIEWS).
 */
export async function tryAutoCreateAppStoreReport(
  admin: any,
  company: { id: string; name: string; domain: string; country?: string | null },
): Promise<DraftReport | null> {
  const country = (company.country || 'fr').toLowerCase()
  let appId: string | null = null
  let sourceUrl: string | null = null

  const { data: signal } = await admin
    .from('acquisition_signals')
    .select('source_url')
    .eq('company_id', company.id)
    .eq('signal_type', 'app_store')
    .limit(1)
    .maybeSingle()

  if (signal?.source_url) {
    appId = appStoreIdFrom(String(signal.source_url))
    sourceUrl = String(signal.source_url)
  }

  if (!appId) {
    const targetDomain = cleanDomain(company.domain)
    if (targetDomain && company.name) {
      const candidates = await searchAppStore(company.name, country, 5).catch(() => [])
      const match = candidates.find((app) => cleanDomain(app.sellerUrl) === targetDomain)
      if (match) {
        appId = match.id
        sourceUrl = match.url
      }
    }
  }

  if (!appId) return null

  const reviews = await fetchAppStoreReviews(appId, country).catch(() => [])
  if (reviews.length < REPORT_MIN_REVIEWS) return null

  const report = await analyzePublicReviews(reviews).catch(() => null)
  if (!report) return null

  const token = reportToken()
  const { data: inserted, error } = await admin
    .from('acquisition_reports')
    .insert({
      company_id: company.id,
      token,
      subject_name: company.name,
      source: 'app_store',
      source_label: 'App Store',
      source_url: sourceUrl,
      review_count: report.reviewCount,
      average_rating: report.averageRating,
      report,
    })
    .select('token')
    .single()

  if (error || !inserted) return null

  return toDraftReport({
    url: publicReportUrl(inserted.token),
    reviewCount: report.reviewCount,
    sourceLabel: 'App Store',
    subjectName: company.name,
    report,
  })
}

