import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { syncWeeklyDigestPreference } from '@/lib/auth/notification-preferences'

// GET /auth/callback — handles Supabase OAuth and OTP redirects
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery' | 'signup' | 'email'
  const callbackError = searchParams.get('error')
  const requestedNext = searchParams.get('next') ?? '/dashboard'
  const legacyPrefixes = ['/dashboard/sites', '/dashboard/scans', '/dashboard/bugs', '/scan']
  const isLegacyPath = legacyPrefixes.some((prefix) => requestedNext === prefix || requestedNext.startsWith(`${prefix}/`))
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') && !isLegacyPath ? requestedNext : '/dashboard'

  if (code) {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        try { await syncWeeklyDigestPreference(user) } catch (syncError) { console.error('[auth-callback] preference sync failed:', syncError) }
      }
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/login?mode=reset-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If type=recovery, redirect to password reset page
  if (type === 'recovery' && !callbackError && !code) {
    return NextResponse.redirect(`${origin}/login?mode=reset-password`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
