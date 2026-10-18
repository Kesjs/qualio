import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getAuthedContext } from '@/lib/supabase/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/billing/limits'
import { appOrigin } from '@/lib/email/send'

const UUID = /^[0-9a-f-]{36}$/i
const FORBIDDEN = 'Le lien de partage est réservé aux plans Pro et Agence.'

async function context(recommendationId: string) {
  const { supabase, userId } = await getAuthedContext()
  if (!userId) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const
  if (!UUID.test(recommendationId)) return { error: NextResponse.json({ error: 'Recommandation invalide.' }, { status: 400 }) } as const
  const plan = await getUserPlan(supabase as any, userId)
  const admin = getSupabaseAdminClient() as any
  const { data: recommendation } = await admin.from('feedback_recommendations').select('id, site_id').eq('id', recommendationId).eq('user_id', userId).maybeSingle()
  if (!recommendation) return { error: NextResponse.json({ error: 'Recommandation introuvable.' }, { status: 404 }) } as const
  return { userId, plan, admin, recommendation } as const
}

/** État du partage d'une tâche : lien actif ou non. */
export async function GET(request: NextRequest) {
  const ctx = await context(request.nextUrl.searchParams.get('recommendationId') ?? '')
  if ('error' in ctx) return ctx.error
  if (ctx.plan === 'free') return NextResponse.json({ allowed: false, active: false })
  const { data } = await ctx.admin.from('recommendation_shares').select('token').eq('recommendation_id', ctx.recommendation.id).is('revoked_at', null).maybeSingle()
  return NextResponse.json({ allowed: true, active: Boolean(data), url: data ? `${appOrigin(request.nextUrl.origin)}/partage/${data.token}` : null })
}

/** Crée le lien de partage (ou renvoie le lien actif). Pro et Agence. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { recommendationId?: unknown } | null
  const ctx = await context(typeof body?.recommendationId === 'string' ? body.recommendationId : '')
  if ('error' in ctx) return ctx.error
  if (ctx.plan === 'free') return NextResponse.json({ error: FORBIDDEN }, { status: 403 })
  const origin = appOrigin(request.nextUrl.origin)
  const existing = await ctx.admin.from('recommendation_shares').select('token').eq('recommendation_id', ctx.recommendation.id).is('revoked_at', null).maybeSingle()
  if (existing.data) return NextResponse.json({ url: `${origin}/partage/${existing.data.token}` })
  const token = randomBytes(32).toString('base64url')
  const { error } = await ctx.admin.from('recommendation_shares').insert({ user_id: ctx.userId, site_id: ctx.recommendation.site_id, recommendation_id: ctx.recommendation.id, token })
  if (error) {
    // Deux demandes simultanées : l'autre a créé le lien, on le renvoie.
    const retry = await ctx.admin.from('recommendation_shares').select('token').eq('recommendation_id', ctx.recommendation.id).is('revoked_at', null).maybeSingle()
    if (retry.data) return NextResponse.json({ url: `${origin}/partage/${retry.data.token}` })
    return NextResponse.json({ error: 'Impossible de créer le lien.' }, { status: 500 })
  }
  return NextResponse.json({ url: `${origin}/partage/${token}` })
}

/** « Arrêter le partage » : révoque immédiatement le lien actif. */
export async function DELETE(request: NextRequest) {
  const ctx = await context(request.nextUrl.searchParams.get('recommendationId') ?? '')
  if ('error' in ctx) return ctx.error
  await ctx.admin.from('recommendation_shares').update({ revoked_at: new Date().toISOString() }).eq('recommendation_id', ctx.recommendation.id).is('revoked_at', null)
  return NextResponse.json({ ok: true })
}
