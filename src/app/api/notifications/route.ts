import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

async function context() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await context()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await (supabase as any).from('dashboard_notifications')
    .select('id, type, title, body, href, read_at, created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)
  if (error) return NextResponse.json({ error: 'Impossible de charger les notifications.' }, { status: 503 })
  return NextResponse.json({ notifications: data ?? [], unread: (data ?? []).filter((item: { read_at: string | null }) => !item.read_at).length })
}

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await context()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { id?: unknown; all?: unknown } | null
  const query = (supabase as any).from('dashboard_notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id)
  const { error } = body?.all === true ? await query.is('read_at', null) : await query.eq('id', typeof body?.id === 'string' ? body.id : '').is('read_at', null)
  if (error) return NextResponse.json({ error: 'Impossible de mettre à jour les notifications.' }, { status: 503 })
  return NextResponse.json({ ok: true })
}
