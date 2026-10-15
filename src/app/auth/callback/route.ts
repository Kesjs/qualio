import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { syncWeeklyDigestPreference } from '@/lib/auth/notification-preferences'
import { isAllowedAdmin } from '@/lib/admin/auth'

// GET /auth/callback — handles Supabase OAuth and OTP redirects
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery' | 'signup' | 'email'
  const callbackError = searchParams.get('error')
  const requestedNext = searchParams.get('next') ?? (new URL(req.url).hostname === 'admin.tryqualio.pro' ? '/admin' : '/dashboard')
  const legacyPrefixes = ['/dashboard/sites', '/dashboard/scans', '/dashboard/bugs', '/scan']
  const isLegacyPath = legacyPrefixes.some((prefix) => requestedNext === prefix || requestedNext.startsWith(`${prefix}/`))
  const fallbackNext = new URL(req.url).hostname === 'admin.tryqualio.pro' ? '/admin' : '/dashboard'
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') && !isLegacyPath ? requestedNext : fallbackNext

  if (code) {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        try {
          await syncWeeklyDigestPreference(user)
        } catch (syncError) { console.error('[auth-callback] preference sync failed:', syncError) }
      }
      if (new URL(req.url).hostname === 'admin.tryqualio.pro' && !isAllowedAdmin(user)) {
        return NextResponse.redirect(`${origin}/login?error=not_admin&redirectTo=/admin`)
      }
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/login?mode=reset-password&next=${encodeURIComponent(next)}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If type=recovery, redirect to password reset page
  if (type === 'recovery' && !callbackError && !code) {
    return NextResponse.redirect(`${origin}/login?mode=reset-password&next=${encodeURIComponent(next)}`)
  }

  const errorPath = new URL(req.url).hostname === 'admin.tryqualio.pro'
    ? '/login?error=auth_callback_failed&redirectTo=/admin'
    : '/login?error=auth_callback_failed'
  return NextResponse.redirect(`${origin}${errorPath}`)
}
