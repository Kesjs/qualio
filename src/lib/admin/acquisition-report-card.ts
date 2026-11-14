import type { ProspectReport } from '@/lib/admin/acquisition-report'
import { publicReportUrl, reportImageUrl } from '@/lib/admin/acquisition-report-url'

/** Données minimales d'un rapport pour l'afficher dans un email : aucune donnée personnelle, uniquement des chiffres et des avis déjà publics. */
export type ReportCard = {
  token: string
  subjectName: string
  sourceLabel: string
  reviewCount: number
  averageRating: number | null
  distribution: number[]
  problems: Array<{ title: string; mentions: number }>
  quote: { text: string; rating: number | null } | null
  reportUrl: string
  imageUrl: string
}

const REPORT_PATH = /\/rapport\/([\w-]{12,80})/

export function reportTokenFromBody(body: string): string | null {
  return body.match(REPORT_PATH)?.[1] ?? null
}

/** Charge la carte du rapport lié à un message (via le lien /rapport/[token] du texte). Null si aucun rapport actif. */
export async function loadReportCardForBody(admin: any, body: string): Promise<ReportCard | null> {
  const token = reportTokenFromBody(body)
  return token ? loadReportCard(admin, token) : null
}

export async function loadReportCard(admin: any, token: string): Promise<ReportCard | null> {
  const { data, error } = await admin
    .from('acquisition_reports')
    .select('token, subject_name, source_label, review_count, average_rating, report')
    .eq('token', token)
    .is('revoked_at', null)
    .maybeSingle()
  if (error || !data) return null
  const report = data.report as ProspectReport
  const problems = (report.problems ?? []).slice(0, 3)
  const quote = problems.find((problem) => problem.quotes?.length)?.quotes[0] ?? null
  const distribution = Array.isArray(report.ratingDistribution) && report.ratingDistribution.length === 5 ? report.ratingDistribution : [0, 0, 0, 0, 0]
  return {
    token: data.token,
    subjectName: data.subject_name,
    sourceLabel: data.source_label,
    reviewCount: data.review_count,
    averageRating: data.average_rating == null ? null : Number(data.average_rating),
    distribution,
    problems: problems.map((problem) => ({ title: problem.title, mentions: problem.mentions })),
    quote: quote ? { text: quote.text, rating: quote.rating } : null,
    reportUrl: publicReportUrl(data.token),
    imageUrl: reportImageUrl(data.token),
  }
}
