import { createHash } from 'node:crypto'
import { after, NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { BILLING_PLANS, LOCKED_FEEDBACK_MAX } from '@/lib/billing/plans'
import { getFeedbackCapacity, getLockedCount, getUserPlan, isSiteWritable } from '@/lib/billing/limits'
import { sendLimitReached } from '@/lib/email/billing-emails'
import { isDuplicateIntakeEvent, MAX_INTAKE_BODY_BYTES, validateIntakeBody } from '@/lib/feedback/intake-validation'
import { classifyAndSaveFeedback } from '@/lib/feedback/classify'

function corsHeaders(extra: Record<string, string> = {}) {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', ...extra }
}

function json(data: Record<string, unknown>, status = 200, extra: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: corsHeaders(extra) })
}

function getClientIp(request: NextRequest) {
  const vercelIp = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
  if (vercelIp) return vercelIp.slice(0, 128)
  if (process.env.VERCEL === '1') return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 128) || 'unknown'
  return 'unknown'
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_INTAKE_BODY_BYTES) return json({ error: 'Votre message est trop volumineux.' }, 413)
  if (!(request.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) return json({ error: 'Le format JSON est obligatoire.' }, 415)

  let body: Record<string, unknown>
  try {
    const raw = await request.arrayBuffer()
    if (raw.byteLength > MAX_INTAKE_BODY_BYTES) return json({ error: 'Votre message est trop volumineux.' }, 413)
    body = JSON.parse(new TextDecoder().decode(raw)) as Record<string, unknown>
  } catch {
    return json({ error: 'Le message envoyé est invalide.' }, 400)
  }

  if (typeof body.honeypot === 'string' && body.honeypot.trim()) return json({ ok: true }, 202)
  const key = typeof body.key === 'string' ? body.key.trim() : ''
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  const authorName = typeof body.authorName === 'string' ? body.authorName.trim() : ''
  const authorEmail = typeof body.authorEmail === 'string' ? body.authorEmail.trim() : ''
  const validationError = validateIntakeBody(body, new TextEncoder().encode(JSON.stringify(body)).byteLength)
  if (validationError) return json({ error: validationError }, 400)

  const admin = getSupabaseAdminClient() as any
  const { data: source, error: sourceError } = await admin.from('collection_sources').select('site_id, user_id, active').eq('public_key', key).eq('type', 'widget').maybeSingle()
  if (sourceError) {
    console.error('[Feedback intake] source lookup failed', sourceError)
    return json({ error: 'La collecte est temporairement indisponible.' }, 503)
  }
  if (!source) return json({ error: 'Cette clé de collecte est invalide.' }, 403)
  if (!source.active) return json({ error: 'Cette clé de collecte est désactivée.' }, 403)

  const ipAddress = getClientIp(request)
  const contentHash = createHash('sha256').update(content.normalize('NFKC')).digest('hex')
  const minuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const dedupeAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const [{ count: ipCount }, { count: keyCount }, { data: duplicate }] = await Promise.all([
    admin.from('feedback_intake_events').select('id', { count: 'exact', head: true }).eq('ip_address', ipAddress).gte('created_at', minuteAgo),
    admin.from('feedback_intake_events').select('id', { count: 'exact', head: true }).eq('public_key', key).gte('created_at', hourAgo),
    admin.from('feedback_intake_events').select('id').eq('ip_address', ipAddress).eq('content_hash', contentHash).gte('created_at', dedupeAgo).limit(1).maybeSingle(),
  ])
  if ((ipCount ?? 0) >= 10) return json({ error: 'Trop d’avis envoyés en peu de temps. Réessayez dans une minute.' }, 429, { 'Retry-After': '60' })
  if ((keyCount ?? 0) >= 200) return json({ error: 'La collecte de ce projet a atteint sa limite horaire. Réessayez plus tard.' }, 429, { 'Retry-After': '3600' })
  if (isDuplicateIntakeEvent(duplicate)) return json({ ok: true, duplicate: true }, 202)

  const plan = await getUserPlan(admin, source.user_id)
  if (!BILLING_PLANS[plan].widget) return json({ error: 'Le widget n’est pas disponible pour ce plan. Les avis déjà reçus restent conservés.' }, 403)
  if (!(await isSiteWritable(admin, source.user_id, source.site_id, plan))) return json({ error: 'Ce projet est en lecture seule.' }, 403)
  const capacity = await getFeedbackCapacity(admin, source.site_id, plan)
  // Limite atteinte : l'avis du visiteur est quand même conservé (statut « locked », non analysé, sans appel IA)
  // et sera débloqué si le compte passe à un plan payant. Plafonné pour éviter le stockage illimité.
  const overflow = capacity.remaining < 1
  if (overflow && (await getLockedCount(admin, source.site_id)) >= LOCKED_FEEDBACK_MAX) return json({ error: 'La limite d’avis de ce projet est atteinte.' }, 429, { 'Retry-After': '3600' })

  const { data: saved, error } = await admin.from('feedback_items').insert({
    user_id: source.user_id,
    site_id: source.site_id,
    source: 'widget',
    status: overflow ? 'locked' : 'open',
    content,
    author_name: authorName || null,
    author_email: authorEmail || null,
    source_url: request.headers.get('origin') ?? null,
    sentiment: null,
    theme: null,
    confidence: null,
    metadata: { ip_address: ipAddress, user_agent: request.headers.get('user-agent') ?? null, classification_status: overflow ? 'locked' : 'pending' },
  }).select('id').single()
  if (error) {
    console.error('[Feedback intake] insert failed', error)
    return json({ error: 'Votre avis n’a pas pu être enregistré. Réessayez.' }, 500)
  }
  const { error: eventError } = await admin.from('feedback_intake_events').insert({ public_key: key, site_id: source.site_id, ip_address: ipAddress, content_hash: contentHash })
  if (eventError) console.error('[Feedback intake] rate-limit event insert failed', eventError)
  if (saved?.id && overflow) after(async () => { try { await sendLimitReached(admin, source.user_id, source.site_id, 'Votre projet', capacity.limit) } catch (limitError) { console.error('[Feedback intake] limit email failed', limitError) } })
  if (saved?.id && !overflow) after(async () => {
    try { await classifyAndSaveFeedback(admin, saved.id, source.site_id, content) } catch (classificationError) { console.error('[Feedback intake] async classification failed', classificationError) }
  })
  return json({ ok: true })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}
