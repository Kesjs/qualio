import { NextRequest, NextResponse } from 'next/server'
import { getAuthedContext } from '@/lib/supabase/auth'
import { buildDailySeries, buildThemeStats, parseDays } from '@/lib/feedback/stats'

const MIN_FOR_SYNTHESIS = 3
const DAY = 86_400_000

/**
 * Un seul appel pour toute la vue d'ensemble : projet actif, compteurs, série,
 * thèmes, actions, derniers avis, dernière synthèse. Les requêtes partent en parallèle.
 */
export async function GET(request: NextRequest) {
  const { supabase, userId } = await getAuthedContext()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const days = parseDays(request.nextUrl.searchParams.get('days'))
  const requestedId = request.nextUrl.searchParams.get('siteId')
  const db = supabase as any

  // Même ordre que la liste des projets (le plus récemment modifié d'abord) : le repli est cohérent avec le sélecteur.
  const pickProject = (id: string | null) => {
    let query = db.from('sites').select('id, name, url, onboarding_method').eq('user_id', userId)
    query = id ? query.eq('id', id).limit(1) : query.order('updated_at', { ascending: false }).limit(1)
    return query
  }
  let { data: projects } = await pickProject(requestedId)
  if (!projects?.length && requestedId) ({ data: projects } = await pickProject(null))
  const project = projects?.[0]
  if (!project) return NextResponse.json({ state: 'no_project', project: null })

  const since = new Date(Date.now() - days * 2 * DAY).toISOString()
  const [totalRes, rowsRes, recentRes, actionsRes, synthesisRes, sourceRes, exampleRes] = await Promise.all([
    db.from('feedback_items').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('site_id', project.id).not('status', 'in', '(archived,locked)'),
    db.from('feedback_items').select('theme, sentiment, created_at, content').eq('user_id', userId).eq('site_id', project.id).not('status', 'in', '(archived,locked)').gte('created_at', since).order('created_at', { ascending: false }).limit(2000),
    db.from('feedback_items').select('id, content, source, author_name, theme, sentiment, status, created_at').eq('user_id', userId).eq('site_id', project.id).not('status', 'in', '(archived,locked)').order('created_at', { ascending: false }).limit(4),
    db.from('feedback_recommendations').select('id, title, description, action, rationale, priority, theme, status, feedback_ids, created_at').eq('user_id', userId).eq('site_id', project.id).eq('status', 'open').order('created_at', { ascending: false }).limit(30),
    db.from('feedback_syntheses').select('id, title, summary, created_at').eq('user_id', userId).eq('site_id', project.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    db.from('collection_sources').select('id', { count: 'exact', head: true }).eq('site_id', project.id).eq('active', true),
    db.from('feedback_items').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('site_id', project.id).eq('metadata->>is_example', 'true'),
  ])

  const rows: Array<{ theme: string | null; sentiment: string | null; created_at: string; content: string }> = rowsRes.data ?? []
  const total: number = totalRes.count ?? 0
  const currentStart = Date.now() - days * DAY
  const current = rows.filter((row) => new Date(row.created_at).getTime() >= currentStart)
  const previousRows = rows.filter((row) => new Date(row.created_at).getTime() < currentStart)
  const share = (list: typeof rows) => (list.length ? Math.round((list.filter((row) => row.sentiment === 'positive').length / list.length) * 100) : null)

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  const actions = [...(actionsRes.data ?? [])].sort((a, b) => (priorityOrder[a.priority ?? 'medium'] ?? 1) - (priorityOrder[b.priority ?? 'medium'] ?? 1))
  const synthesis = synthesisRes.data ?? null
  const unsynthesized = synthesis ? rows.filter((row) => row.created_at > synthesis.created_at).length : total

  const state = total === 0 ? 'empty' : total < MIN_FOR_SYNTHESIS && !synthesis ? 'warming' : !synthesis ? 'ready_to_synthesize' : 'ready'

  return NextResponse.json({
    state,
    days,
    project,
    hasSource: (sourceRes.count ?? 0) > 0,
    exampleCount: exampleRes.count ?? 0,
    counts: {
      total,
      period: current.length,
      previousPeriod: previousRows.length,
      positiveShare: share(current),
      previousPositiveShare: share(previousRows),
      pendingActions: actions.length,
      unsynthesized,
      missingForSynthesis: Math.max(0, MIN_FOR_SYNTHESIS - total),
    },
    series: buildDailySeries(current, days),
    topThemes: buildThemeStats(rows, days).filter((theme) => !theme.isUnclassified).slice(0, 5),
    actions: actions.slice(0, 3),
    recent: recentRes.data ?? [],
    synthesis,
  })
}
