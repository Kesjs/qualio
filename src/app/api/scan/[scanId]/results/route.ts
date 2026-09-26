import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ scanId: string }> }

// GET /api/scan/[scanId]/results
export async function GET(_req: NextRequest, { params }: Params) {
  const { scanId } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: scan } = await supabase
    .from('scans')
    .select('*')
    .eq('id', scanId)
    .eq('user_id', user.id)
    .single()

  if (!scan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 })

  const [pagesRes, issuesRes, checksRes] = await Promise.all([
    supabase.from('pages').select('*').eq('scan_id', scanId).order('depth').order('url'),
    supabase
      .from('issues')
      .select(`
        *,
        page:pages!issues_page_id_fkey (url),
        evidence (*)
      `)
      .eq('scan_id', scanId)
      .order('severity')
      .order('created_at'),
    supabase.from('checks').select('*').eq('scan_id', scanId).order('category').order('status'),
  ])

  return NextResponse.json({
    scan,
    pages: pagesRes.data ?? [],
    issues: issuesRes.data ?? [],
    checks: checksRes.data ?? [],
  })
}
