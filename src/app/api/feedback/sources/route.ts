import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await (supabase as any).from('collection_sources').select('id, site_id, type, public_key, active, created_at').eq('user_id', user.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const siteId = typeof body.siteId === 'string' ? body.siteId : ''
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
  const { data: site } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const existing = await (supabase as any).from('collection_sources').select('id, site_id, type, public_key, active').eq('site_id', siteId).eq('type', 'widget').maybeSingle()
  if (existing.data) return NextResponse.json(existing.data)

  const { data, error } = await (supabase as any).from('collection_sources').insert({ user_id: user.id, site_id: siteId, type: 'widget', public_key: randomBytes(24).toString('base64url') }).select('id, site_id, type, public_key, active').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
