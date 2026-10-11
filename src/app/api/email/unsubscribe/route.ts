import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { token?: unknown } | null
  const userId = typeof body?.token === 'string' ? verifyUnsubscribeToken(body.token) : null
  if (!userId) return NextResponse.json({ error: 'Ce lien de désinscription est invalide ou expiré.' }, { status: 400 })
  const { error } = await (getSupabaseAdminClient() as any).from('notification_preferences').upsert({ user_id: userId, weekly_digest: false, consent_source: null, consented_at: null, unsubscribed_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) return NextResponse.json({ error: 'Impossible de modifier votre préférence.' }, { status: 503 })
  return NextResponse.json({ ok: true })
}
