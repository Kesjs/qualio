import type { DraftReport } from '@/lib/admin/acquisition-draft'
import type { ProspectReport } from '@/lib/admin/acquisition-report'
import { publicReportUrl } from '@/lib/admin/acquisition-report-url'

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

