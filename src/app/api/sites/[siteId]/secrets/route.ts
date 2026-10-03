import { NextRequest, NextResponse } from 'next/server'
import { encryptSiteSecret } from '@/lib/qa/security/site-secrets'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ siteId: string }> }

async function getUserAndSite(siteId: string) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, site: null }
  const { data: site } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle()
  return { supabase, user, site }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { siteId } = await params
  const { user, site } = await getUserAndSite(siteId)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  const admin = getSupabaseAdminClient() as any
  const { data, error } = await admin
    .from('site_secrets')
    .select('id, name, created_at, updated_at')
    .eq('site_id', siteId)
    .eq('user_id', user.id)
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: Params) {
  const { siteId } = await params
  const { user, site } = await getUserAndSite(siteId)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  const body = await req.json().catch(() => null) as { name?: unknown; value?: unknown } | null
  const name = typeof body?.name === 'string' ? body.name.trim().toUpperCase() : ''
  const value = typeof body?.value === 'string' ? body.value : ''
  if (!/^[A-Z][A-Z0-9_]{1,63}$/.test(name)) return NextResponse.json({ error: 'Secret name must use A-Z, 0-9 and underscores.' }, { status: 400 })
  if (!value) return NextResponse.json({ error: 'Secret value is required.' }, { status: 400 })
  const admin = getSupabaseAdminClient() as any
  const { data, error } = await admin.from('site_secrets').upsert({
    site_id: siteId,
    user_id: user.id,
    name,
    encrypted_value: encryptSiteSecret(value),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'site_id,name' }).select('id, name, created_at, updated_at').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { siteId } = await params
  const { user, site } = await getUserAndSite(siteId)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  const name = new URL(req.url).searchParams.get('name')?.trim().toUpperCase() ?? ''
  if (!/^[A-Z][A-Z0-9_]{1,63}$/.test(name)) return NextResponse.json({ error: 'Invalid secret name.' }, { status: 400 })
  const admin = getSupabaseAdminClient() as any
  const { error } = await admin.from('site_secrets').delete().eq('site_id', siteId).eq('user_id', user.id).eq('name', name)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
