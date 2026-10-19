import { NextRequest, NextResponse } from 'next/server'
import { getAuthedContext } from '@/lib/supabase/auth'
import { buildThemeStats, parseDays, parseTzOffset, periodStart } from '@/lib/feedback/stats'

export async function GET(request: NextRequest) {
  const { supabase, userId } = await getAuthedContext()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = request.nextUrl.searchParams.get('siteId')
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
  const days = parseDays(request.nextUrl.searchParams.get('days'))

  // Même fenêtre que la vue d'ensemble : jours calendaires de l'utilisateur, donc mêmes chiffres sur les deux écrans.
  const DAY = 86_400_000
  const currentStart = periodStart(days, Date.now(), parseTzOffset(request.nextUrl.searchParams.get('tz')))
  const since = new Date(currentStart - days * DAY).toISOString()
  const { data, error } = await (supabase as any)
    .from('feedback_items')
    .select('theme, sentiment, created_at, content')
    .eq('user_id', userId).eq('site_id', siteId).not('status', 'in', '(archived,locked)')
    .gte('created_at', since).order('created_at', { ascending: false }).limit(2000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ days, themes: buildThemeStats(data ?? [], days, currentStart + days * DAY) })
}

/** PATCH { siteId, from, to } — renomme un thème ; si "to" existe déjà, les deux fusionnent. to vide = retire le thème. */
export async function PATCH(request: NextRequest) {
  const { supabase, userId } = await getAuthedContext()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const siteId = typeof body.siteId === 'string' ? body.siteId : ''
  const from = typeof body.from === 'string' ? body.from.trim() : ''
  const to = typeof body.to === 'string' ? body.to.trim().slice(0, 60) : ''
  if (!siteId || !from) return NextResponse.json({ error: 'siteId and from are required' }, { status: 400 })

  const { data, error } = await (supabase as any)
    .from('feedback_items')
    .update({ theme: to || null })
    .eq('user_id', userId).eq('site_id', siteId).eq('theme', from)
    .select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ updated: data?.length ?? 0 })
}
