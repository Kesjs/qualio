import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getUserPlan, isSiteWritable } from '@/lib/billing/limits'
import { computeEffect, EFFECT_WINDOW_MS, lockedEffect } from '@/lib/feedback/effect'

const ALLOWED_STATUSES = new Set(['open', 'accepted', 'dismissed', 'done'])

async function getContext(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const siteId = request.nextUrl.searchParams.get('siteId')?.trim()
  return { supabase, user, siteId }
}

export async function GET(request: NextRequest) {
  const { supabase, user, siteId } = await getContext(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 })

  const { data: site } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })
  const { data, error } = await (supabase as any)
    .from('feedback_recommendations')
    .select('*')
    .eq('user_id', user.id)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Impossible de charger les recommandations.' }, { status: 500 })

  const plan = await getUserPlan(supabase as any, user.id)
  const countTheme = async (theme: string, from: string, to: string) => {
    const { count } = await (supabase as any)
      .from('feedback_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('site_id', siteId)
      .eq('theme', theme)
      .not('status', 'in', '(archived,locked)')
      .gte('created_at', from)
      .lt('created_at', to)
    return count ?? 0
  }
  const recommendations = await Promise.all((data ?? []).map(async (recommendation: { status: string; theme?: string | null; decided_at?: string | null }) => {
    if (!['accepted', 'done'].includes(recommendation.status) || !recommendation.theme || !recommendation.decided_at) return recommendation
    // L'effet est réservé à Pro et Agence : Gratuit voit seulement qu'il existe.
    if (plan === 'free') return { ...recommendation, effect: lockedEffect() }
    const decidedAt = recommendation.decided_at
    const decided = Date.parse(decidedAt)
    const beforeCount = await countTheme(recommendation.theme, new Date(decided - EFFECT_WINDOW_MS).toISOString(), decidedAt)
    const afterCount = await countTheme(recommendation.theme, decidedAt, new Date(Math.min(decided + EFFECT_WINDOW_MS, Date.now())).toISOString())
    return { ...recommendation, effect: computeEffect({ beforeCount, afterCount, decidedAt }) }
  }))
  return NextResponse.json(recommendations)
}

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await getContext(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { id?: unknown; siteId?: unknown; status?: unknown } | null
  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  const siteId = typeof body?.siteId === 'string' ? body.siteId.trim() : ''
  const status = typeof body?.status === 'string' ? body.status : ''
  if (!id || !siteId) return NextResponse.json({ error: 'id et siteId sont requis.' }, { status: 400 })
  if (!ALLOWED_STATUSES.has(status)) return NextResponse.json({ error: 'Statut de recommandation invalide.' }, { status: 400 })

  const { data: site } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })
  if (!(await isSiteWritable(supabase as any, user.id, siteId, await getUserPlan(supabase as any, user.id)))) return NextResponse.json({ error: 'Ce projet est en lecture seule.' }, { status: 403 })

  const now = new Date().toISOString()
  const updates = {
    status,
    resolved_at: status === 'dismissed' || status === 'done' ? now : null,
    decided_at: status === 'accepted' || status === 'dismissed' || status === 'done' ? now : null,
    done_at: status === 'done' ? now : null,
  }
  const { data, error } = await (supabase as any)
    .from('feedback_recommendations')
    .update(updates)
    .eq('id', id)
    .eq('site_id', siteId)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Impossible de mettre à jour la recommandation.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Recommandation introuvable.' }, { status: 404 })
  return NextResponse.json(data)
}
