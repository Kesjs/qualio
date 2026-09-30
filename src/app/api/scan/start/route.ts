import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server'
import { validateUrl } from '@/lib/qa/utils'
import { assertPublicScanUrl } from '@/lib/qa/ssrf'
import { DEFAULT_SCAN_MODULES, type ScanModule } from '@/lib/qa/types'

// POST /api/scan/start
// Creates a scan record and returns the real scanId immediately.
// The actual scan is triggered by GitHub Actions cron via /api/scan/run.
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { siteId, url, consentConfirmedAt, previousScanId, selectedModules } = body

  if (!siteId || !url) return NextResponse.json({ error: 'siteId and url are required' }, { status: 400 })

  const validation = validateUrl(url)
  if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 })
  try {
    await assertPublicScanUrl(url)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'This URL is not allowed' }, { status: 400 })
  }

  const modules = Array.isArray(selectedModules)
    ? selectedModules.filter((module): module is ScanModule => DEFAULT_SCAN_MODULES.includes(module))
    : DEFAULT_SCAN_MODULES
  if (modules.length === 0) return NextResponse.json({ error: 'Select at least one scan module' }, { status: 400 })

  // Verify site belongs to user
  const { data: site } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  let validatedPreviousScanId: string | null = null
  if (previousScanId) {
    const { data: previousScan } = await supabase
      .from('scans')
      .select('id')
      .eq('id', previousScanId)
      .eq('site_id', siteId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!previousScan) {
      return NextResponse.json({ error: 'Previous scan not found' }, { status: 400 })
    }
    validatedPreviousScanId = previousScan.id
  }

  // Create scan record with service_role (bypasses RLS for insert)
  const admin = getSupabaseAdminClient()
  const { data: scan, error } = await admin
    .from('scans')
    .insert({
      site_id: siteId,
      user_id: user.id,
      status: 'queued',
      previous_scan_id: validatedPreviousScanId,
      scan_modules: modules,
      queued_at: new Date().toISOString(),
      consent_confirmed_at: consentConfirmedAt ? new Date(consentConfirmedAt).toISOString() : null,
    })
    .select('id')
    .single()

  if (error || !scan) return NextResponse.json({ error: error?.message ?? 'Failed to create scan' }, { status: 500 })

  // Return the real scanId — no fake UUID
  return NextResponse.json({ scanId: scan.id, siteId, status: 'queued' }, { status: 201 })
}
