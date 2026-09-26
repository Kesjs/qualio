import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { parseIssueDiagnostic } from '@/lib/qa/ai'

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch all issues for the user's sites
    const { data: issues, error } = await supabase
      .from('issues')
      .select(`
        *,
        site:sites!inner (id, user_id, url, name)
      `)
      .eq('sites.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching issues:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(issues)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
