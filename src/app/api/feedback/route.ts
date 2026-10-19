import { after, NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'
import { classifyAndSaveFeedback } from '@/lib/feedback/classify'
import { getFeedbackCapacity, getUserPlan, getWritableSiteIds, isSiteWritable, READ_ONLY_MESSAGE } from '@/lib/billing/limits'

type FeedbackPayload = {
  siteId?: string
  content?: string
  source?: 'manual' | 'widget' | 'csv'
  authorName?: string
  authorEmail?: string
  /** Date de l'avis : AAAA-MM-JJ (saisie manuelle) ou ISO. Aujourd'hui par défaut. */
  createdAt?: string
  sourceUrl?: string
  externalId?: string
  metadata?: Record<string, unknown>
}

type FeedbackUpdatePayload = {
  id?: string
  ids?: string[]
  status?: 'open' | 'reviewed' | 'archived'
  theme?: string | null
}

/** Date saisie : AAAA-MM-JJ (midi UTC pour éviter tout décalage) ou ISO, sans date future ni antérieure à 2000. */
function parseCreatedAt(value: unknown): string | null | 'invalid' {
  if (typeof value !== 'string' || !value.trim()) return null
  const raw = value.trim()
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00.000Z`) : new Date(raw)
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() < 2000 || date.getTime() > Date.now() + 24 * 3600_000) return 'invalid'
  return date.toISOString()
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

async function getUserAndClient() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await getUserAndClient()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = request.nextUrl.searchParams.get('siteId')
  let query = (supabase as any)
    .from('feedback_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (siteId) query = query.eq('site_id', siteId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getUserAndClient()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: FeedbackPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const siteId = cleanText(body.siteId, 64)
  const content = cleanText(body.content, 2000)
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 })
  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 })
  if (typeof body.content === 'string' && body.content.trim().length > 2000) return NextResponse.json({ error: 'Votre avis ne peut pas dépasser 2 000 caractères.' }, { status: 400 })

  const { data: site } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const plan = await getUserPlan(supabase, user.id)
  if (!(await isSiteWritable(supabase, user.id, siteId, plan))) return NextResponse.json({ error: READ_ONLY_MESSAGE, quota: 'read_only', plan }, { status: 403 })
  const capacity = await getFeedbackCapacity(supabase, siteId, plan)
  if (capacity.remaining < 1) {
    const nextStep = plan === 'free' ? 'Passez à Pro pour augmenter votre capacité.' : plan === 'pro' ? 'Archivez des avis ou passez à Agence pour augmenter votre capacité.' : 'Archivez des avis ou contactez Qualio pour une capacité adaptée.'
    return NextResponse.json({ error: `Vous avez atteint la capacité de continuité de ${capacity.limit.toLocaleString('fr-FR')} avis. ${nextStep} Vos avis restent visibles.`, quota: 'feedback', plan, limit: capacity.limit, used: capacity.used }, { status: 403 })
  }

  const source = ['manual', 'widget', 'csv'].includes(body.source ?? '') ? body.source : 'manual'
  const createdAt = parseCreatedAt(body.createdAt)
  if (createdAt === 'invalid') return NextResponse.json({ error: 'La date de l’avis est invalide.' }, { status: 400 })
  const { data, error } = await (supabase as any)
    .from('feedback_items')
    .insert({
      user_id: user.id,
      site_id: siteId,
      source,
      content,
      author_name: cleanText(body.authorName, 160) || null,
      author_email: cleanText(body.authorEmail, 320) || null,
      source_url: cleanText(body.sourceUrl, 2000) || null,
      external_id: cleanText(body.externalId, 240) || null,
      ...(createdAt ? { created_at: createdAt } : {}),
       theme: null,
       sentiment: null,
       confidence: null,
       metadata: { ...(body.metadata && typeof body.metadata === 'object' ? body.metadata : {}), classification_status: 'pending' },
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (data?.id) after(async () => {
    try { await classifyAndSaveFeedback(getSupabaseAdminClient(), data.id, siteId, content) } catch (classificationError) { console.error('[Feedback] async classification failed', classificationError) }
  })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await getUserAndClient()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: FeedbackUpdatePayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((value): value is string => typeof value === 'string').slice(0, 200) : []
  const id = cleanText(body.id, 64)
  if (!id && !ids.length) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (body.status !== undefined) {
    if (!['open', 'reviewed', 'archived'].includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    updates.status = body.status
  }
  if (body.theme !== undefined) updates.theme = cleanText(body.theme, 80) || null
  if (!Object.keys(updates).length) return NextResponse.json({ error: 'No changes provided' }, { status: 400 })

  if (ids.length) {
    // Mise à jour groupée (archiver / restaurer / reclasser plusieurs avis).
    const { data: updated, error: bulkError } = await (supabase as any).from('feedback_items').update(updates).in('id', ids).eq('user_id', user.id).neq('status', 'locked').select('id')
    if (bulkError) return NextResponse.json({ error: bulkError.message }, { status: 500 })
    return NextResponse.json({ updated: updated?.length ?? 0 })
  }

  const { data, error } = await (supabase as any)
    .from('feedback_items')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .neq('status', 'locked')
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  return NextResponse.json(data)
}

/** Suppression définitive d'avis (sélection ou un seul). Réservée aux avis du compte connecté. */
export async function DELETE(request: NextRequest) {
  const { supabase, user } = await getUserAndClient()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as { ids?: unknown } | null
  const ids = Array.isArray(body?.ids) ? body.ids.filter((value): value is string => typeof value === 'string').slice(0, 200) : []
  if (!ids.length) return NextResponse.json({ error: 'Sélectionnez au moins un avis.' }, { status: 400 })

  // Projets en lecture seule : on ne supprime rien dedans (les avis restent visibles).
  const { data: owned } = await (supabase as any).from('feedback_items').select('id, site_id').in('id', ids).eq('user_id', user.id)
  const plan = await getUserPlan(supabase as any, user.id)
  const writable = new Set(await getWritableSiteIds(supabase as any, user.id, plan))
  const allowed = (owned ?? []).filter((row: { site_id: string }) => writable.has(row.site_id)).map((row: { id: string }) => row.id)
  const blocked = (owned?.length ?? 0) - allowed.length
  if (!allowed.length) return NextResponse.json({ error: blocked ? READ_ONLY_MESSAGE : 'Aucun avis à supprimer.' }, { status: blocked ? 403 : 400 })
  const { data, error } = await (supabase as any).from('feedback_items').delete().in('id', allowed).eq('user_id', user.id).select('id')
  if (error) return NextResponse.json({ error: 'Impossible de supprimer ces avis.' }, { status: 500 })
  return NextResponse.json({ deleted: data?.length ?? 0, blocked })
}
