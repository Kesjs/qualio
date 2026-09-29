import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server'
import { normalizeUserUrl, validateUrl } from '@/lib/qa/utils'

// GET /api/sites — list user's sites with latest scan
export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sites, error } = await supabase
    .from('sites')
    .select(`
      *,
      last_scan:scans!sites_last_scan_id_fkey (
        id, status, started_at, completed_at,
        pages_discovered, checks_total, checks_passed, checks_warning, checks_failed,
        critical_count, major_count, summary, created_at
      )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(sites)
}

// POST /api/sites — create new site
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { url, name, environment } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const normalizedUrl = normalizeUserUrl(url)
  const validation = validateUrl(normalizedUrl)
  if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 })

  // Check if site already exists for this user
  const { data: existing } = await supabase
    .from('sites')
    .select('id')
    .eq('user_id', user.id)
    .eq('url', normalizedUrl)
    .single()

  if (existing) return NextResponse.json({ error: 'This site already exists in your workspace' }, { status: 409 })

  const admin = getSupabaseAdminClient()
  const { data: site, error } = await admin
    .from('sites')
    .insert({
      user_id: user.id,
      url: normalizedUrl,
      name: name || new URL(normalizedUrl).hostname,
      environment: environment === 'staging' ? 'staging' : 'production',
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(site, { status: 201 })
}
