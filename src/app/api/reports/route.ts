import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getAuthedContext } from '@/lib/supabase/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/billing/limits'
import { appOrigin } from '@/lib/email/send'

/** Plan Agence : crée un lien de rapport (le précédent est révoqué). */
export async function POST(request: NextRequest) {
  const { supabase, userId } = await getAuthedContext()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { siteId?: unknown } | null
  const siteId = typeof body?.siteId === 'string' ? body.siteId : ''
  if (!siteId) return NextResponse.json({ error: 'siteId requis.' }, { status: 400 })
  if ((await getUserPlan(supabase as any, userId)) !== 'agency') return NextResponse.json({ error: 'Le rapport partageable est réservé au plan Agence.' }, { status: 403 })
  const admin = getSupabaseAdminClient() as any
  const { data: site } = await admin.from('sites').select('id').eq('id', siteId).eq('user_id', userId).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })
  await admin.from('feedback_reports').update({ revoked_at: new Date().toISOString() }).eq('site_id', siteId).is('revoked_at', null)
  const token = randomBytes(24).toString('base64url')
  const { error } = await admin.from('feedback_reports').insert({ user_id: userId, site_id: siteId, token })
  if (error) return NextResponse.json({ error: 'Impossible de créer le lien.' }, { status: 500 })
  return NextResponse.json({ url: `${appOrigin(request.nextUrl.origin)}/rapport/${token}` })
}

/** Révoque tous les liens actifs du projet. */
export async function DELETE(request: NextRequest) {
  const { userId } = await getAuthedContext()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = request.nextUrl.searchParams.get('siteId') ?? ''
  const admin = getSupabaseAdminClient() as any
  const { data: site } = await admin.from('sites').select('id').eq('id', siteId).eq('user_id', userId).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })
  await admin.from('feedback_reports').update({ revoked_at: new Date().toISOString() }).eq('site_id', siteId).is('revoked_at', null)
  return NextResponse.json({ ok: true })
}
