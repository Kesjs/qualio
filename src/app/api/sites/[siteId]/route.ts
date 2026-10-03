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
        critical_count, major_count, summary, error
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
  const body = await req.json().catch(() => null) as { journeyDefinitions?: unknown } | null
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
