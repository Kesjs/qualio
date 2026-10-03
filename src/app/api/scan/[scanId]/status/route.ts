import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

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

  const { data, error } = await supabase
    .from('scans')
    .select('id, status, started_at, completed_at, error, summary, pages_discovered, checks_total, checks_failed, critical_count, major_count, ai_calls_count')
    .eq('id', scanId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })

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
  })
}
