import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { createGithubState } from '@/lib/github/state'

export async function GET(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const slug = process.env.GITHUB_APP_SLUG
  if (!slug) return NextResponse.json({ error: 'GitHub App non configurée' }, { status: 503 })
  const state = createGithubState()
  const response = NextResponse.redirect(`https://github.com/apps/${slug}/installations/new?state=${encodeURIComponent(state.value)}`)
  response.cookies.set(state.cookie, state.value, { httpOnly: true, sameSite: 'lax', secure: true, maxAge: 600, path: '/' })
  return response
}
