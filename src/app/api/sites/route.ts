import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server'
import { BILLING_PLANS, resolvePlan } from '@/lib/billing/plans'

function normalizeProjectUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const candidate = value.trim().startsWith('http') ? value.trim() : `https://${value.trim()}`
  try {
    const url = new URL(candidate)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    if (['localhost', '127.0.0.1', '::1'].includes(url.hostname)) return null
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sites, error } = await supabase
    .from('sites')
    .select('id, user_id, url, name, onboarding_method, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Impossible de charger les projets.' }, { status: 500 })
  return NextResponse.json(sites ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as { name?: unknown; url?: unknown } | null
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 160) : ''
  const projectUrl = normalizeProjectUrl(body?.url)
  if (!name && !projectUrl) {
    return NextResponse.json({ error: 'Ajoutez un nom de projet ou une URL valide.' }, { status: 400 })
  }
  if (body?.url && !projectUrl) {
    return NextResponse.json({ error: 'L’URL doit commencer par http:// ou https://.' }, { status: 400 })
  }

  const { data: subscription } = await (supabase as any)
    .from('billing_subscriptions')
    .select('plan, status, source, trial_ends_at, current_period_end')
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
    .insert({ user_id: user.id, url: projectUrl, name: name || null })
    .select('id, user_id, url, name, onboarding_method, created_at, updated_at')
    .single()

  if (error) return NextResponse.json({ error: 'Impossible de créer le projet.' }, { status: 500 })
  return NextResponse.json(site, { status: 201 })
}
