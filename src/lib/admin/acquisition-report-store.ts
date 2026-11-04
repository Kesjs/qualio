import type { DraftReport } from '@/lib/admin/acquisition-draft'
import type { ProspectReport } from '@/lib/admin/acquisition-report'
import { publicReportUrl } from '@/lib/admin/acquisition-report-url'

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
  const report = data.report as ProspectReport
  const top = report.problems?.[0]
  return {
    url: publicReportUrl(data.token),
    reviewCount: data.review_count,
    sourceLabel: data.source_label,
    subjectName: data.subject_name,
    topProblem: top ? { title: top.title, mentions: top.mentions } : null,
    problemCount: report.problems?.length ?? 0,
  }
}

