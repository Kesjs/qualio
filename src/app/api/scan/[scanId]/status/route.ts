import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { FormSelection, FormScanProgress } from '@/lib/qa/types'

type Params = { params: Promise<{ scanId: string }> }

const PROGRESS_MAP: Record<string, number> = {
  created: 2, queued: 5, running: 8, discovering: 10, crawling: 30,
  browser_testing: 60, analyzing: 80, reporting: 90, completed: 100,
  failed: 100, partial: 100, blocked: 100,
}

// GET /api/scan/[scanId]/status
export async function GET(_req: NextRequest, { params }: Params) {
  const { scanId } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (supabase
    .from('scans')
    .select('id, status, started_at, completed_at, error, summary, pages_discovered, checks_total, checks_failed, critical_count, major_count, ai_calls_count, ai_status, ai_error, selected_forms') as any)
    .eq('id', scanId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  const { data: events, error: evidenceError } = await supabase.from('evidence')
    .select('payload').eq('scan_id', scanId).eq('type', 'diagnostic')
    .contains('payload', { kind: 'form_status' }).order('created_at', { ascending: true })
  if (evidenceError) return NextResponse.json({ error: 'Impossible de charger le suivi des formulaires.' }, { status: 500 })
  const states = new Map<string, Record<string, unknown>>()
  for (const event of events ?? []) {
    const payload = event.payload as Record<string, unknown>
    if (typeof payload?.signature === 'string') states.set(payload.signature, payload)
  }
  const terminal = ['completed', 'partial', 'failed', 'blocked'].includes(data.status)
  const forms = (Array.isArray(data.selected_forms) ? data.selected_forms as FormSelection[] : []).map((form): FormScanProgress => {
    const state = states.get(form.signature)
    let status = String(state?.status ?? 'pending')
    let reason = typeof state?.reason === 'string' ? state.reason : undefined
    if (terminal && status === 'running') { status = 'inconclusive'; reason = 'Le scan a été interrompu après le début de la tentative. Aucun rejeu.' }
    if (terminal && status === 'pending') { status = 'skipped'; reason = 'Le scan a terminé avant de tester ce formulaire.' }
    return { signature: form.signature, pageUrl: form.pageUrl, formType: form.formType, status, ...(reason ? { reason } : {}) } as FormScanProgress
  })

  return NextResponse.json({
    scanId: data.id,
    status: data.status,
    progress: PROGRESS_MAP[data.status] ?? 0,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    error: data.error,
    summary: data.summary,
    pagesDiscovered: data.pages_discovered,
    checksTotal: data.checks_total,
    checksFailed: data.checks_failed,
    criticalCount: data.critical_count,
    majorCount: data.major_count,
    aiCallsCount: data.ai_calls_count,
    aiStatus: data.ai_status,
    aiError: data.ai_error,
    forms,
  })
}
