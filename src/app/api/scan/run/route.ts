import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { QAOrchestrator } from '@/lib/qa'

// POST /api/scan/run — called by GitHub Actions cron
// Authorization: Bearer <CRON_SECRET>
export async function POST(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { scanId } = body

  if (!scanId) return NextResponse.json({ error: 'scanId is required' }, { status: 400 })

  const admin = getSupabaseAdminClient()

  // Fetch scan record
  const { data: scan } = await admin
    .from('scans')
    .select('*, sites(url)')
    .eq('id', scanId)
    .single()

  if (!scan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  if (scan.status !== 'created') {
    return NextResponse.json({ error: `Scan already in status: ${scan.status}` }, { status: 409 })
  }

  const siteUrl = (scan as any).sites?.url
  if (!siteUrl) return NextResponse.json({ error: 'Site URL not found' }, { status: 400 })

  const orchestrator = new QAOrchestrator(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    // Run the full scan (long-running, blocks the request)
    await orchestrator.runScan({
      siteId: scan.site_id,
      userId: scan.user_id,
      url: siteUrl,
      previousScanId: scan.previous_scan_id ?? undefined,
      consentConfirmedAt: scan.consent_confirmed_at,
    })

    return NextResponse.json({ success: true, scanId })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
