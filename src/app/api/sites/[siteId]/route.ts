import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server'

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
