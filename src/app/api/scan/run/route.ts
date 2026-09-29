import { NextRequest, NextResponse } from 'next/server'
import { QAOrchestrator } from '@/lib/qa'
import { assertPublicScanUrl } from '@/lib/qa/ssrf'
import { DEFAULT_SCAN_MODULES, type ScanModule } from '@/lib/qa/types'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'

const STALE_WORKER_MS = 10 * 60 * 1000

function parseModules(value: unknown): ScanModule[] {
  if (!Array.isArray(value)) return DEFAULT_SCAN_MODULES
  const allowed = new Set<ScanModule>(DEFAULT_SCAN_MODULES)
  const modules = value.filter((item): item is ScanModule => typeof item === 'string' && allowed.has(item as ScanModule))
  return modules.length > 0 ? modules : DEFAULT_SCAN_MODULES
}

async function recoverStaleScans(admin: ReturnType<typeof getSupabaseAdminClient>) {
  const staleBefore = new Date(Date.now() - STALE_WORKER_MS).toISOString()
  const { data: staleScans } = await admin
    .from('scans')
    .select('id, attempt_count, max_attempts')
    .in('status', ['running', 'discovering', 'crawling', 'browser_testing', 'analyzing', 'reporting'])
    .lt('worker_started_at', staleBefore)

  await Promise.all((staleScans ?? []).map((scan) => {
    const exhausted = scan.attempt_count >= scan.max_attempts
    return admin.from('scans').update(exhausted
      ? { status: 'failed', completed_at: new Date().toISOString(), error: 'Le worker a expiré après plusieurs tentatives.' }
      : { status: 'queued', queued_at: new Date().toISOString(), worker_started_at: null, error: 'Le worker a expiré ; nouvelle tentative planifiée.' }
    ).eq('id', scan.id)
  }))
}

// POST /api/scan/run — called by GitHub Actions cron.
// A scanId is optional: the worker claims the next queued scan when omitted.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const body = await req.json().catch(() => ({})) as { scanId?: string }
  const admin = getSupabaseAdminClient()

  const isCronRequest = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`)
  if (!isCronRequest) {
    // The onboarding can kick off the worker for the scan just created by the
    // signed-in user. It is deliberately limited to an explicit scanId and
    // ownership check; queue processing without a scanId remains cron-only.
    if (!body.scanId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: ownedScan } = await supabase
      .from('scans')
      .select('id')
      .eq('id', body.scanId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!ownedScan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  await recoverStaleScans(admin)

  let query = admin.from('scans').select('*')
  query = body.scanId
    ? query.eq('id', body.scanId)
    : query.eq('status', 'queued').order('queued_at', { ascending: true }).limit(1)

  const { data: candidate, error: candidateError } = await query.maybeSingle()
  if (candidateError) return NextResponse.json({ error: candidateError.message }, { status: 500 })
  if (!candidate) return NextResponse.json({ processed: false, reason: 'No queued scan' })
  if (candidate.status !== 'queued') {
    return NextResponse.json({ error: `Scan already in status: ${candidate.status}` }, { status: 409 })
  }

  const now = new Date().toISOString()
  const { data: scan, error: claimError } = await admin
    .from('scans')
    .update({
      status: 'running',
      worker_started_at: now,
      attempt_count: candidate.attempt_count + 1,
      error: null,
    })
    .eq('id', candidate.id)
    .eq('status', 'queued')
    .select('*')
    .maybeSingle()

  if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 })
  if (!scan) return NextResponse.json({ processed: false, reason: 'Scan claimed by another worker' })

  const { data: site } = await admin
    .from('sites')
    .select('url, journey_definitions')
    .eq('id', scan.site_id)
    .maybeSingle()
  if (!site?.url) {
    await admin.from('scans').update({ status: 'failed', completed_at: new Date().toISOString(), error: 'Site URL not found' }).eq('id', scan.id)
    return NextResponse.json({ error: 'Site URL not found' }, { status: 400 })
  }

  try {
    await assertPublicScanUrl(site.url)
    const orchestrator = new QAOrchestrator(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    await orchestrator.runScan({
      scanId: scan.id,
      siteId: scan.site_id,
      userId: scan.user_id,
      url: site.url,
      previousScanId: scan.previous_scan_id ?? undefined,
      consentConfirmedAt: scan.consent_confirmed_at,
      modules: parseModules(scan.scan_modules),
      journeys: site.journey_definitions,
    })
    return NextResponse.json({ success: true, scanId: scan.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown scan execution error'
    const retry = scan.attempt_count < scan.max_attempts
    await admin.from('scans').update(retry
      ? { status: 'queued', queued_at: new Date().toISOString(), worker_started_at: null, error: message }
      : { status: 'failed', completed_at: new Date().toISOString(), error: message }
    ).eq('id', scan.id)
    return NextResponse.json({ error: message, retryQueued: retry }, { status: 500 })
  }
}
