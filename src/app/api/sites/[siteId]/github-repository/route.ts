import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params
  const body = await request.json().catch(() => ({})) as { owner?: string; repo?: string; defaultBranch?: string; installationId?: number }
  if (!body.owner || !body.repo || !body.defaultBranch || typeof body.installationId !== 'number' || !Number.isSafeInteger(body.installationId)) return NextResponse.json({ error: 'Dépôt GitHub invalide' }, { status: 400 })
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: installation } = await supabase.from('github_installations' as never).select('installation_id').eq('user_id', user.id).eq('installation_id', body.installationId).maybeSingle() as never
  if (!installation) return NextResponse.json({ error: 'Installation GitHub introuvable' }, { status: 403 })
  const { data, error } = await supabase.from('sites').update({ repository_provider: 'github', github_installation_id: body.installationId, github_owner: body.owner, github_repo: body.repo, github_default_branch: body.defaultBranch } as never).eq('id', siteId).eq('user_id', user.id).select('id, github_owner, github_repo, github_default_branch').single() as unknown as { data: unknown; error: { message: string } | null }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
