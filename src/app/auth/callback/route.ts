import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// GET /auth/callback — handles Supabase OAuth and OTP redirects
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type') // 'recovery' | 'signup' | 'email'
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If type=recovery, redirect to password reset page
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/login?mode=reset-password`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
