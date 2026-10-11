import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

async function getContext() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET() {
  const { supabase, user } = await getContext()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await (supabase as any).from('notification_preferences').select('weekly_digest, consented_at, consent_source, unsubscribed_at').eq('user_id', user.id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Les préférences sont temporairement indisponibles.' }, { status: 503 })
  return NextResponse.json(data ?? { weekly_digest: false, consented_at: null, consent_source: null, unsubscribed_at: null })
}

export async function PUT(request: NextRequest) {
  const { supabase, user } = await getContext()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { weeklyDigest?: unknown } | null
  if (typeof body?.weeklyDigest !== 'boolean') return NextResponse.json({ error: 'Préférence invalide.' }, { status: 400 })
  const enabled = body.weeklyDigest
  const { data, error } = await (supabase as any).from('notification_preferences').upsert({
    user_id: user.id,
    weekly_digest: enabled,
    consented_at: enabled ? new Date().toISOString() : null,
    consent_source: enabled ? 'settings' : null,
    unsubscribed_at: enabled ? null : new Date().toISOString(),
  }, { onConflict: 'user_id' }).select('weekly_digest, consented_at, consent_source, unsubscribed_at').single()
  if (error) return NextResponse.json({ error: 'Impossible d’enregistrer cette préférence.' }, { status: 503 })
  return NextResponse.json(data)
}
