import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { DEFAULT_SCAN_MODULES } from '@/lib/qa/types'

// Called by the same five-minute worker as queued scans. It only schedules due
// monitors; the existing scan worker remains the single execution path.
export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  const authorization = req.headers.get('authorization')
  if (!expected || authorization !== `Bearer ${expected}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdminClient()
  const now = new Date()
  const { data: sites, error } = await (admin as any).from('sites')
    .select('id, user_id, monitor_frequency_hours, monitor_next_run_at, journey_definitions')
    .eq('monitor_enabled', true)
    .lte('monitor_next_run_at', now.toISOString())
    .limit(20)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let scheduled = 0
  for (const site of sites ?? []) {
    const journeys = Array.isArray(site.journey_definitions) ? site.journey_definitions : []
    if (journeys.length === 0) continue
    const frequencyHours = Number(site.monitor_frequency_hours) || 24
    const nextRun = new Date(now.getTime() + frequencyHours * 60 * 60 * 1000).toISOString()
    const { error: scanError } = await admin.from('scans').insert({
      site_id: site.id,
      user_id: site.user_id,
      status: 'queued',
      scan_modules: DEFAULT_SCAN_MODULES,
      journey_scope: 'p0',
      queued_at: now.toISOString(),
      consent_confirmed_at: now.toISOString(),
    } as any)
    if (scanError) continue
    await admin.from('sites').update({ monitor_next_run_at: nextRun, monitor_last_run_at: now.toISOString() } as any).eq('id', site.id)
    scheduled += 1
  }
  return NextResponse.json({ scheduled })
}
