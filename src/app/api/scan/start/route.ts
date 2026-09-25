import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server'
import { validateUrl } from '@/lib/qa/utils'

// POST /api/scan/start
// Creates a scan record and returns the real scanId immediately.
// The actual scan is triggered by GitHub Actions cron via /api/scan/run.
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { siteId, url, consentConfirmedAt, previousScanId } = body

  if (!siteId || !url) return NextResponse.json({ error: 'siteId and url are required' }, { status: 400 })

  const validation = validateUrl(url)
  if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 })

  // Verify site belongs to user
  const { data: site } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  // Create scan record with service_role (bypasses RLS for insert)
  const admin = getSupabaseAdminClient()
  const { data: scan, error } = await admin
    .from('scans')
    .insert({
      site_id: siteId,
      user_id: user.id,
      status: 'created',
      previous_scan_id: previousScanId ?? null,
      consent_confirmed_at: consentConfirmedAt ? new Date(consentConfirmedAt).toISOString() : null,
    })
    .select('id')
    .single()

  if (error || !scan) return NextResponse.json({ error: error?.message ?? 'Failed to create scan' }, { status: 500 })

  // Return the real scanId — no fake UUID
  return NextResponse.json({ scanId: scan.id, siteId, status: 'created' }, { status: 201 })
}
