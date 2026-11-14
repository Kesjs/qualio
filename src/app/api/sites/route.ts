import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server'
import { BILLING_PLANS, resolvePlan } from '@/lib/billing/plans'
import { parseOptionalProjectUrl } from '@/lib/projects/url'

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sites, error } = await supabase
    .from('sites')
    .select('id, user_id, url, name, onboarding_method, onboarding_completed_at, sector, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Impossible de charger les projets.' }, { status: 500 })
  return NextResponse.json(sites ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { name?: unknown; url?: unknown; completeOnboarding?: unknown } | null
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 160) : ''
  const parsedUrl = parseOptionalProjectUrl(body?.url)
  if (parsedUrl.error) {
    return NextResponse.json({ error: parsedUrl.error }, { status: 400 })
  }
  const projectUrl = parsedUrl.url
  if (!name && !projectUrl) {
    return NextResponse.json({ error: 'Ajoutez un nom de projet ou une URL valide.' }, { status: 400 })
  }

  const { data: subscription } = await (supabase as any)
    .from('billing_subscriptions')
    .select('plan, status, source, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()
  const activePlan = resolvePlan(subscription)
  const { count: projectCount } = await supabase
    .from('sites')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  const projectLimit = BILLING_PLANS[activePlan].projects
  if ((projectCount ?? 0) >= projectLimit) {
    return NextResponse.json({
      error: `Votre plan ${BILLING_PLANS[activePlan].label} autorise ${projectLimit} projet${projectLimit > 1 ? 's' : ''}.`,
      plan: activePlan,
      projectLimit,
      projectCount: projectCount ?? 0,
    }, { status: 403 })
  }

  if (projectUrl) {
    const { data: existing } = await supabase
      .from('sites')
      .select('id')
      .eq('user_id', user.id)
      .eq('url', projectUrl)
      .maybeSingle()
    if (existing) return NextResponse.json({ error: 'Ce projet existe déjà dans votre espace.' }, { status: 409 })
  }

  const admin = getSupabaseAdminClient() as any
  const { data: site, error } = await admin
    .from('sites')
    .insert({
      user_id: user.id,
      url: projectUrl,
      name: name || null,
      ...(body?.completeOnboarding === true ? { onboarding_completed_at: new Date().toISOString() } : {}),
    })
    .select('id, user_id, url, name, onboarding_method, onboarding_completed_at, sector, created_at, updated_at')
    .single()

  if (error) return NextResponse.json({ error: 'Impossible de créer le projet.' }, { status: 500 })
  return NextResponse.json(site, { status: 201 })
}
