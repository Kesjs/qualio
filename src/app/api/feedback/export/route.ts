import { NextRequest, NextResponse } from 'next/server'
import { getAuthedContext } from '@/lib/supabase/auth'
import { getUserPlan } from '@/lib/billing/limits'

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value)
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Plan Agence : export CSV des avis du projet (sans les avis en attente, et sans adresse e-mail des auteurs). */
export async function GET(request: NextRequest) {
  const { supabase, userId } = await getAuthedContext()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if ((await getUserPlan(supabase as any, userId)) !== 'agency') return NextResponse.json({ error: 'L’export est réservé au plan Agence.' }, { status: 403 })
  const siteId = request.nextUrl.searchParams.get('siteId') ?? ''
  const { data: site } = await (supabase as any).from('sites').select('id, name').eq('id', siteId).eq('user_id', userId).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })
  const { data } = await (supabase as any).from('feedback_items').select('content, author_name, source, theme, sentiment, status, created_at').eq('site_id', siteId).eq('user_id', userId).neq('status', 'locked').order('created_at', { ascending: false }).limit(5000)
  const header = ['content', 'author_name', 'source', 'theme', 'sentiment', 'status', 'created_at']
  const lines = [header.join(','), ...(data ?? []).map((row: Record<string, unknown>) => header.map((key) => csvCell(row[key])).join(','))]
  const filename = `${(site.name || 'avis').replace(/[^a-zA-Z0-9-_]+/g, '-')}-avis.csv`
  return new NextResponse('\uFEFF' + lines.join('\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"` } })
}
