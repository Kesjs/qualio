import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server'
import type { JourneyDefinition } from '@/lib/qa/types'

type Params = { params: Promise<{ siteId: string }> }

// GET /api/sites/[siteId]
export async function GET(_req: NextRequest, { params }: Params) {
  const { siteId } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: site, error } = await supabase
    .from('sites')
    .select(`
      *,
      scans!scans_site_id_fkey (
        id, status, started_at, completed_at, created_at, previous_scan_id,
        pages_discovered, checks_total, checks_passed, checks_warning, checks_failed,
        critical_count, major_count, summary, error, journey_scope, monitor_triggered
      )
    `)
    .eq('id', siteId)
    .eq('user_id', user.id)
    .order('created_at', { referencedTable: 'scans', ascending: false })
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })
  return NextResponse.json(site)
}

// DELETE /api/sites/[siteId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { siteId } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdminClient()
  const { error } = await admin.from('sites').delete().eq('id', siteId).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { siteId } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null) as { journeyDefinitions?: unknown; monitor?: { enabled?: boolean; frequencyHours?: number; targetUrl?: string; targetKind?: string } } | null
  if (body?.monitor) {
    const frequencyHours = body.monitor.frequencyHours ?? 24
    if (![1, 6, 12, 24, 168].includes(frequencyHours)) return NextResponse.json({ error: 'Fréquence non supportée.' }, { status: 400 })
    const admin = getSupabaseAdminClient()
    const enabled = body.monitor.enabled === true
    if (enabled) {
      const { data: selectedScan } = await admin.from('scans').select('selected_forms')
        .eq('site_id', siteId).eq('user_id', user.id).not('selected_forms', 'is', null)
        .not('consent_confirmed_at', 'is', null).in('status', ['completed', 'partial'])
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (!Array.isArray(selectedScan?.selected_forms) || !selectedScan.selected_forms.length) return NextResponse.json({ error: 'Lancez d’abord un audit avec une sélection de formulaires et un consentement.' }, { status: 400 })
    }
    const nextRun = enabled ? new Date(Date.now() + frequencyHours * 60 * 60 * 1000).toISOString() : null
    const { data, error } = await admin.from('sites').update({
      monitor_enabled: enabled,
      monitor_frequency_hours: frequencyHours,
      monitor_next_run_at: nextRun,
      monitor_target_url: body.monitor.targetUrl || null,
      monitor_target_kind: body.monitor.targetKind || null,
    } as any).eq('id', siteId).eq('user_id', user.id).select('id, monitor_enabled, monitor_frequency_hours, monitor_next_run_at, monitor_target_url, monitor_target_kind').single()
    if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })
    return NextResponse.json(data)
  }
  if (!Array.isArray(body?.journeyDefinitions)) return NextResponse.json({ error: 'journeyDefinitions must be an array' }, { status: 400 })
  const journeys = body.journeyDefinitions.filter((journey): journey is JourneyDefinition => {
    if (!journey || typeof journey !== 'object') return false
    const candidate = journey as Partial<JourneyDefinition>
    return typeof candidate.name === 'string' && candidate.name.trim().length > 0 && Array.isArray(candidate.steps) && candidate.steps.length > 0
  })
  if (journeys.length !== body.journeyDefinitions.length) return NextResponse.json({ error: 'Every journey needs a name and at least one step.' }, { status: 400 })
  const admin = getSupabaseAdminClient()
  const { data, error } = await admin.from('sites').update({ journey_definitions: journeys as any }).eq('id', siteId).eq('user_id', user.id).select('id, journey_definitions').single()
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 })
  return NextResponse.json(data)
}
