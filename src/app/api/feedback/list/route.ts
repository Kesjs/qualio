import { NextRequest, NextResponse } from 'next/server'
import { getAuthedContext } from '@/lib/supabase/auth'

const PAGE_SIZE = 50
const SOURCES = ['manual', 'widget', 'csv']
const SENTIMENTS = ['positive', 'neutral', 'negative']

/** GET /api/feedback/list?siteId=&status=open|archived|all&theme=&sentiment=&source=&q=&days=&page= */
export async function GET(request: NextRequest) {
  const { supabase, userId } = await getAuthedContext()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = request.nextUrl.searchParams
  const siteId = params.get('siteId')
  if (!siteId) return NextResponse.json({ error: 'siteId is required' }, { status: 400 })

  const status = params.get('status') ?? 'open'
  const theme = params.get('theme')
  const sentiment = params.get('sentiment')
  const source = params.get('source')
  const q = (params.get('q') ?? '').trim().replace(/[%,()*\\]/g, ' ').slice(0, 100)
  const days = Number(params.get('days') ?? 0)
  const page = Math.max(0, Math.min(1000, Number(params.get('page') ?? 0) || 0))

  let query = (supabase as any)
    .from('feedback_items')
    .select('id, content, source, author_name, author_email, source_url, theme, sentiment, status, created_at, metadata', { count: 'exact' })
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

  // "Nouveau" regroupe les statuts open et reviewed ; "Archivé" = archived.
  if (status === 'archived') query = query.eq('status', 'archived')
  else query = query.neq('status', 'archived')
  if (theme === '__none__') query = query.is('theme', null)
  else if (theme) query = query.eq('theme', theme)
  if (sentiment && SENTIMENTS.includes(sentiment)) query = query.eq('sentiment', sentiment)
  if (source && SOURCES.includes(source)) query = query.eq('source', source)
  if (q) query = query.or(`content.ilike.%${q}%,author_name.ilike.%${q}%`)
  if (days > 0) query = query.gte('created_at', new Date(Date.now() - days * 86_400_000).toISOString())

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: 'Impossible de charger les avis.' }, { status: 500 })
  return NextResponse.json({ items: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE })
}
