import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { syncWeeklyDigestPreference } from '@/lib/auth/notification-preferences'

export async function POST() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await syncWeeklyDigestPreference(user)


    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[sync-preferences] failed:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Préférences temporairement indisponibles.' }, { status: 503 })
  }
}
