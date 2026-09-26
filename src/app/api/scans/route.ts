import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// GET /api/scans — list recent scans across all user sites
export async function GET() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: scans, error } = await supabase
    .from('scans')
    .select(`
      id,
      status,
      started_at,
      completed_at,
      created_at,
      pages_discovered,
      checks_total,
      checks_passed,
      checks_warning,
      checks_failed,
      critical_count,
      major_count,
      summary,
      site_id,
      sites!scans_site_id_fkey (
        id,
        name,
        url,
        environment
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(scans)
}
