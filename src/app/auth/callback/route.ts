import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { syncWeeklyDigestPreference } from '@/lib/auth/notification-preferences'
import { getAuthoritativeAdminUser, isAllowedAdmin } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email/billing-emails'

// GET /auth/callback — handles Supabase OAuth and OTP redirects
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery' | 'signup' | 'email'
  const callbackError = searchParams.get('error')
  const isAdminHost = new URL(req.url).hostname === 'admin.tryqualio.pro'
  const requestedNext = searchParams.get('next') ?? (isAdminHost ? '/admin' : '/dashboard')
  const legacyPrefixes = ['/dashboard/sites', '/dashboard/scans', '/dashboard/bugs', '/scan']
  const isLegacyPath = legacyPrefixes.some((prefix) => requestedNext === prefix || requestedNext.startsWith(`${prefix}/`))
  const fallbackNext = isAdminHost ? '/admin' : '/dashboard'
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
        if (!isAdminHost && type !== 'recovery' && user.email) {
          try {
            const admin = getSupabaseAdminClient() as any
            const { count } = await admin.from('feedback').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
            await sendWelcomeEmail(admin, user.id, user.email, count ?? 0)
          } catch (welcomeError) { console.error('[auth-callback] welcome email failed:', welcomeError) }
        }
      }
      const adminUser = isAdminHost && user ? await getAuthoritativeAdminUser(user) : user
      if (isAdminHost && !isAllowedAdmin(adminUser)) {
        return NextResponse.redirect(`${origin}/admin-auth?error=not_admin&redirectTo=/admin`)
      }
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}${isAdminHost ? '/admin-auth' : '/login'}?mode=reset-password&next=${encodeURIComponent(next)}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If type=recovery, redirect to password reset page
  if (type === 'recovery' && !callbackError && !code) {
    return NextResponse.redirect(`${origin}/login?mode=reset-password&next=${encodeURIComponent(next)}`)
  }

  const errorPath = isAdminHost
    ? '/admin-auth?error=auth_callback_failed&redirectTo=/admin'
    : '/login?error=auth_callback_failed'
  return NextResponse.redirect(`${origin}${errorPath}`)
}
