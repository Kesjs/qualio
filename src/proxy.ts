import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes protégées — redirige vers /login si non authentifié
const PROTECTED_PREFIXES = ['/dashboard', '/onboarding', '/admin']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const hostname = request.headers.get('host')?.split(':')[0].toLowerCase()
  if (hostname === 'admin.tryqualio.pro' && pathname === '/login') {
    const adminLoginUrl = request.nextUrl.clone()
    adminLoginUrl.pathname = '/admin-auth'
    return NextResponse.rewrite(adminLoginUrl)
  }

  if (hostname === 'admin.tryqualio.pro' && !pathname.startsWith('/admin') && !pathname.startsWith('/auth')) {
    const adminUrl = request.nextUrl.clone()
    adminUrl.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`
    return NextResponse.rewrite(adminUrl)
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (!isProtected) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // Fail closed: every dashboard URL must pass onboarding before any page can render.
  // Keep /onboarding itself reachable so a user can create the first project.
  if (pathname.startsWith('/dashboard')) {
    const { count, error } = await supabase
      .from('sites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((error || !count) && !pathname.startsWith('/dashboard/feedback-produit')) {
      const onboardingUrl = request.nextUrl.clone()
      onboardingUrl.pathname = '/onboarding'
      return NextResponse.redirect(onboardingUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|widget\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
