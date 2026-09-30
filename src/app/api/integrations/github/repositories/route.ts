import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { listInstallationRepositories } from '@/lib/github/app'

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: installation } = await supabase.from('github_installations' as never).select('installation_id, account_login').eq('user_id', user.id).maybeSingle() as never
  if (!installation) return NextResponse.json({ connected: false, repositories: [] })
  try {
    const result = await listInstallationRepositories(Number((installation as { installation_id: number }).installation_id))
    return NextResponse.json({ connected: true, account: (installation as { account_login: string }).account_login, installationId: Number((installation as { installation_id: number }).installation_id), repositories: result.repositories })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'GitHub indisponible' }, { status: 502 })
  }
}
