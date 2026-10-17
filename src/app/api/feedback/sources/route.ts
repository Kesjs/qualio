import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { BILLING_PLANS } from '@/lib/billing/plans'
import { getUserPlan, isSiteWritable } from '@/lib/billing/limits'

const WIDGET_PLAN_REQUIRED = { error: 'La collecte par widget n’est pas disponible pour ce plan. Vos avis déjà reçus restent conservés.', quota: 'widget' } as const

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = request.nextUrl.searchParams.get('siteId')
  let query = (supabase as any).from('collection_sources').select('id, site_id, type, public_key, active, accent_color, position, button_label, thank_you_message, form_title, form_intro, form_question, created_at').eq('user_id', user.id).order('created_at', { ascending: false })
  if (siteId) query = query.eq('site_id', siteId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const siteId = typeof body.siteId === 'string' ? body.siteId : ''
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
  const { data: site } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  const plan = await getUserPlan(supabase, user.id)
  if (!BILLING_PLANS[plan].widget) return NextResponse.json({ ...WIDGET_PLAN_REQUIRED, plan }, { status: 403 })
  if (!(await isSiteWritable(supabase as any, user.id, siteId, plan))) return NextResponse.json({ error: 'Ce projet est en lecture seule.' }, { status: 403 })

  const existing = await (supabase as any).from('collection_sources').select('id, site_id, type, public_key, active, accent_color, position, button_label, thank_you_message, form_title, form_intro, form_question, created_at').eq('site_id', siteId).eq('type', 'widget').maybeSingle()
  if (existing.data) return NextResponse.json(existing.data)

  const { data, error } = await (supabase as any).from('collection_sources').insert({ user_id: user.id, site_id: siteId, type: 'widget', public_key: randomBytes(24).toString('base64url') }).select('id, site_id, type, public_key, active, accent_color, position, button_label, thank_you_message, form_title, form_intro, form_question, created_at').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { siteId?: unknown; action?: unknown; accentColor?: unknown; position?: unknown; buttonLabel?: unknown; thankYou?: unknown; formTitle?: unknown; formIntro?: unknown; formQuestion?: unknown } | null
  const siteId = typeof body?.siteId === 'string' ? body.siteId : ''
  const action = body?.action
  if (!siteId || !['disable', 'enable', 'regenerate', 'settings'].includes(String(action))) return NextResponse.json({ error: 'Action de source invalide.' }, { status: 400 })
  const { data: source } = await (supabase as any).from('collection_sources').select('id').eq('user_id', user.id).eq('site_id', siteId).eq('type', 'widget').maybeSingle()
  if (!source) return NextResponse.json({ error: 'Source widget introuvable.' }, { status: 404 })
  // Rétrogradé en Gratuit : on peut toujours désactiver la clé, mais plus la réactiver, la régénérer ni la configurer.
  if (action !== 'disable') {
    const plan = await getUserPlan(supabase, user.id)
    if (!BILLING_PLANS[plan].widget) return NextResponse.json({ ...WIDGET_PLAN_REQUIRED, plan }, { status: 403 })
    if (!(await isSiteWritable(supabase as any, user.id, siteId, plan))) return NextResponse.json({ error: 'Ce projet est en lecture seule : réactivation impossible sur le plan actuel.' }, { status: 403 })
  }
  let updates: Record<string, unknown>
  if (action === 'disable') updates = { active: false }
  else if (action === 'enable') updates = { active: true }
  else if (action === 'regenerate') updates = { public_key: randomBytes(24).toString('base64url'), active: true }
  else {
    const accentColor = typeof body?.accentColor === 'string' && /^#[0-9a-f]{6}$/i.test(body.accentColor) ? body.accentColor : null
    const position = body?.position === 'left' || body?.position === 'right' ? body.position : null
    const buttonLabel = typeof body?.buttonLabel === 'string' ? body.buttonLabel.trim().slice(0, 60) : ''
    const thankYou = typeof body?.thankYou === 'string' ? body.thankYou.trim().slice(0, 200) : 'Votre message a bien été envoyé.'
    const formTitle = typeof body?.formTitle === 'string' ? body.formTitle.trim().slice(0, 120) : 'Votre avis compte'
    const formIntro = typeof body?.formIntro === 'string' ? body.formIntro.trim().slice(0, 300) : 'Dites-nous ce qui fonctionne ou ce qui pourrait être amélioré.'
    const formQuestion = typeof body?.formQuestion === 'string' ? body.formQuestion.trim().slice(0, 160) : 'Votre avis'
    if (!accentColor || !position || !buttonLabel || !thankYou || !formTitle || !formIntro || !formQuestion) return NextResponse.json({ error: 'Configuration du widget invalide.' }, { status: 400 })
    updates = { accent_color: accentColor, position, button_label: buttonLabel, thank_you_message: thankYou, form_title: formTitle, form_intro: formIntro, form_question: formQuestion }
  }
  const { data, error } = await (supabase as any).from('collection_sources').update(updates).eq('id', source.id).eq('user_id', user.id).select('id, site_id, type, public_key, active, accent_color, position, button_label, thank_you_message, form_title, form_intro, form_question, created_at').single()
  if (error) return NextResponse.json({ error: 'Impossible de modifier la source widget.' }, { status: 500 })
  return NextResponse.json(data)
}
