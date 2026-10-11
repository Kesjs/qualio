import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ siteId: string }> }

async function getUser() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { siteId } = await params
  const { supabase, user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: site, error } = await supabase
    .from('sites')
    .select('id, user_id, url, name, created_at, updated_at')
    .eq('id', siteId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Impossible de charger le projet.' }, { status: 500 })
  if (!site) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })
  return NextResponse.json(site)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { siteId } = await params
  const { user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as { name?: unknown; url?: unknown } | null
  const updates: { name?: string | null; url?: string | null } = {}
  if (body && 'name' in body) {
    if (typeof body.name !== 'string') return NextResponse.json({ error: 'Nom invalide.' }, { status: 400 })
    updates.name = body.name.trim().slice(0, 160) || null
  }
  if (body && 'url' in body) {
    if (body.url !== null && typeof body.url !== 'string') return NextResponse.json({ error: 'URL invalide.' }, { status: 400 })
    if (typeof body.url === 'string' && body.url.trim()) {
      const candidate = body.url.trim().startsWith('http') ? body.url.trim() : `https://${body.url.trim()}`
      try {
        const parsed = new URL(candidate)
        if (!['http:', 'https:'].includes(parsed.protocol) || ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) throw new Error('invalid')
        updates.url = parsed.toString().replace(/\/$/, '')
      } catch {
        return NextResponse.json({ error: 'L’URL doit être publique et commencer par http:// ou https://.' }, { status: 400 })
      }
    } else {
      updates.url = null
    }
  }
  if (!Object.keys(updates).length) return NextResponse.json({ error: 'Aucune modification à enregistrer.' }, { status: 400 })
  if (updates.name === null && updates.url === null) return NextResponse.json({ error: 'Le projet doit garder un nom ou une URL.' }, { status: 400 })

  const admin = getSupabaseAdminClient() as any
  const { data: site, error } = await admin
    .from('sites')
    .update(updates)
    .eq('id', siteId)
    .eq('user_id', user.id)
    .select('id, user_id, url, name, created_at, updated_at')
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Impossible de modifier le projet.' }, { status: 500 })
  if (!site) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })
  return NextResponse.json(site)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { siteId } = await params
  const { user } = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getSupabaseAdminClient()
  const { error } = await admin.from('sites').delete().eq('id', siteId).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: 'Impossible de supprimer le projet.' }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
