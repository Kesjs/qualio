import { NextRequest, NextResponse } from 'next/server'
import { getAuthedContext } from '@/lib/supabase/auth'
import { buildTasksCsv } from '@/lib/feedback/task-text'
import type { ActionItem } from '@/lib/feedback/types'

/** Export CSV des tâches : une tâche (id) ou toutes les décisions acceptées. Tous les plans. Sans auteur ni e-mail des avis. */
export async function GET(request: NextRequest) {
  const { supabase, userId } = await getAuthedContext()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = request.nextUrl.searchParams.get('siteId') ?? ''
  const id = request.nextUrl.searchParams.get('id') ?? ''
  const db = supabase as any
  const { data: site } = await db.from('sites').select('id, name').eq('id', siteId).eq('user_id', userId).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })

  let query = db.from('feedback_recommendations').select('id, title, description, action, rationale, priority, confidence, theme, status, feedback_ids, created_at, decided_at').eq('user_id', userId).eq('site_id', siteId)
  query = id ? query.eq('id', id) : query.in('status', ['accepted', 'done']).order('decided_at', { ascending: false }).limit(500)
  const { data: recs, error } = await query
  if (error) return NextResponse.json({ error: 'Impossible d’exporter les tâches.' }, { status: 500 })
  if (!recs?.length) return NextResponse.json({ error: id ? 'Recommandation introuvable.' : 'Aucune décision acceptée à exporter.' }, { status: id ? 404 : 400 })

  const cited = Array.from(new Set((recs as ActionItem[]).flatMap((rec) => (rec.feedback_ids ?? []).slice(0, 5)))).slice(0, 1000)
  const { data: items } = cited.length
    ? await db.from('feedback_items').select('id, content').eq('user_id', userId).eq('site_id', siteId).neq('status', 'locked').in('id', cited)
    : { data: [] }
  const byId = new Map<string, string>(((items ?? []) as Array<{ id: string; content: string }>).map((item) => [item.id, item.content]))
  const rows = (recs as ActionItem[]).map((action) => ({
    action,
    reviews: (action.feedback_ids ?? []).slice(0, 5).flatMap((feedbackId) => (byId.has(feedbackId) ? [{ content: byId.get(feedbackId)! }] : [])),
  }))
  const base = (site.name || 'projet').replace(/[^a-zA-Z0-9-_]+/g, '-')
  const filename = `${base}-${id ? 'tache' : 'decisions-acceptees'}.csv`
  return new NextResponse(buildTasksCsv(rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' } })
}
