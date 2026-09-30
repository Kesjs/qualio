import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { verifyGithubState } from '@/lib/github/state'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const cookieStore = await cookies()
  const state = cookieStore.get('qualio_github_state')?.value
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !verifyGithubState(state) || state !== url.searchParams.get('state')) return NextResponse.redirect(new URL('/dashboard/settings?github=error', request.url))
  const installationId = Number(url.searchParams.get('installation_id'))
  if (!Number.isSafeInteger(installationId) || installationId <= 0) return NextResponse.redirect(new URL('/dashboard/settings?github=error', request.url))
  const accountLogin = url.searchParams.get('account_login') || 'GitHub'
  const accountType = url.searchParams.get('account_type') || 'User'
  const { error } = await supabase.from('github_installations' as never).upsert({ user_id: user.id, installation_id: installationId, account_login: accountLogin, account_type: accountType, updated_at: new Date().toISOString() } as never, { onConflict: 'installation_id' })
  if (error) return NextResponse.redirect(new URL('/dashboard/settings?github=error', request.url))
  const response = NextResponse.redirect(new URL('/dashboard/settings?github=connected', request.url))
  response.cookies.delete('qualio_github_state')
  return response
}
