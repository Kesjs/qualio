import { after, NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'
import { classifyAndSaveFeedback } from '@/lib/feedback/classify'

type FeedbackPayload = {
  siteId?: string
  content?: string
  source?: 'manual' | 'widget' | 'csv'
  authorName?: string
  authorEmail?: string
  sourceUrl?: string
  externalId?: string
  metadata?: Record<string, unknown>
}

type FeedbackUpdatePayload = {
  id?: string
  status?: 'open' | 'reviewed' | 'archived'
  theme?: string | null
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

  const source = ['manual', 'widget', 'csv'].includes(body.source ?? '') ? body.source : 'manual'
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

  const id = cleanText(body.id, 64)
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (body.status !== undefined) {
    if (!['open', 'reviewed', 'archived'].includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    updates.status = body.status
  }
  if (body.theme !== undefined) updates.theme = cleanText(body.theme, 80) || null
  if (!Object.keys(updates).length) return NextResponse.json({ error: 'No changes provided' }, { status: 400 })

  const { data, error } = await (supabase as any)
    .from('feedback_items')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  return NextResponse.json(data)
}
