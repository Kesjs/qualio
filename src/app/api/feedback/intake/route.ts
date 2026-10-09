import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

function classify(content: string) {
  const value = content.toLocaleLowerCase('fr-FR')
  const theme = value.match(/navigation|menu|page|parcours/) ? 'Navigation' : value.match(/erreur|bug|bloqué|problème/) ? 'Fiabilité' : value.match(/lent|rapide|chargement/) ? 'Performance' : value.match(/prix|payer|tarif|coût/) ? 'Prix' : null
  const sentiment = value.match(/difficile|confus|erreur|lent|bloqué|impossible|manque|problème|bug/) ? 'negative' : value.match(/merci|simple|rapide|clair|excellent|utile|facile/) ? 'positive' : 'neutral'
  return { theme, sentiment, confidence: theme ? 0.72 : 0.35 }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const key = typeof body.key === 'string' ? body.key.trim() : ''
  const content = typeof body.content === 'string' ? body.content.trim().slice(0, 10000) : ''
  if (!key || !content) return NextResponse.json({ error: 'key and content are required' }, { status: 400, headers: corsHeaders() })
  const admin = getSupabaseAdminClient()
  const { data: source } = await (admin as any).from('collection_sources').select('site_id, user_id, active').eq('public_key', key).eq('type', 'widget').maybeSingle()
  if (!source?.active) return NextResponse.json({ error: 'Collection source not found' }, { status: 404, headers: corsHeaders() })
  const classification = classify(content)
  const { error } = await (admin as any).from('feedback_items').insert({ user_id: source.user_id, site_id: source.site_id, source: 'widget', content, author_name: typeof body.authorName === 'string' ? body.authorName.trim().slice(0, 160) || null : null, author_email: typeof body.authorEmail === 'string' ? body.authorEmail.trim().slice(0, 320) || null : null, source_url: request.headers.get('origin') ?? null, theme: classification.theme, sentiment: classification.sentiment, confidence: classification.confidence, metadata: { user_agent: request.headers.get('user-agent') ?? null } })
  if (error) return NextResponse.json({ error: 'Unable to save feedback' }, { status: 500, headers: corsHeaders() })
  return NextResponse.json({ ok: true }, { headers: corsHeaders() })
}

function corsHeaders() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } }
export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: corsHeaders() }) }
