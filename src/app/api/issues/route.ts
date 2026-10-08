import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { parseIssueDiagnostic } from '@/lib/qa/ai'

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Resolve the user's scans first. `issues` belongs to a scan, not directly
    // to a site, so asking PostgREST for issues -> sites is not a valid relation.
    const { data: scans, error: scansError } = await (supabase as any)
      .from('scans')
      .select(`
        id,
        site_id,
        ai_status,
        summary,
        selected_forms,
        sites!scans_site_id_fkey (id, user_id, url, name, environment)
      `)
      .eq('user_id', user.id)

    if (scansError) {
      console.error('Error fetching scans for issues:', scansError)
      return NextResponse.json({ error: scansError.message }, { status: 500 })
    }

    const scanIds = (scans ?? []).map((scan: any) => scan.id)
    if (scanIds.length === 0) return NextResponse.json([])

    const { data: issues, error } = await supabase
      .from('issues')
      .select(`
        *,
        page:pages (url),
        evidence (*)
      `)
      .in('scan_id', scanIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching issues:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const sitesByScanId = new Map(
      (scans ?? []).map((scan: any) => [scan.id, scan.sites])
    )

    // Keep the response shape consumed by the Bugs page while deriving the
    // site through the real scan relationship.
    const normalizedIssues = (issues ?? []).map((issue) => ({
      ...issue,
      site: sitesByScanId.get(issue.scan_id) ?? null,
      scan_ai_status: scans?.find((scan: any) => scan.id === issue.scan_id)?.ai_status ?? 'not_needed',
      scan_summary: scans?.find((scan: any) => scan.id === issue.scan_id)?.summary ?? null,
      selected_forms_scan: Array.isArray(scans?.find((scan: any) => scan.id === issue.scan_id)?.selected_forms),
      url: issue.page?.url ?? null,
    }))

    return NextResponse.json(normalizedIssues)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
