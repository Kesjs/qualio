import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

const ALLOWED = new Set(['page_view', 'widget_opened', 'feedback_submitted', 'cta_clicked'])
function cors() { return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } }

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const key = typeof body?.key === 'string' ? body.key.trim() : ''
  const eventName = typeof body?.eventName === 'string' ? body.eventName.trim() : ''
  if (!key || !ALLOWED.has(eventName)) return NextResponse.json({ error: 'Événement invalide.' }, { status: 400, headers: cors() })
  if ((eventName === 'page_view' || eventName === 'cta_clicked') && body?.consented !== true) return NextResponse.json({ error: 'Consentement requis.' }, { status: 403, headers: cors() })
  const admin = getSupabaseAdminClient() as any
  const { data: source } = await admin.from('collection_sources').select('site_id, active').eq('public_key', key).eq('type', 'widget').maybeSingle()
  if (!source?.active) return NextResponse.json({ error: 'Source inactive.' }, { status: 403, headers: cors() })
  const sessionId = typeof body?.sessionId === 'string' && body.sessionId.length < 100 ? body.sessionId : crypto.randomUUID()
  const { error } = await admin.from('acquisition_visitor_events').insert({ session_id: sessionId, event_name: eventName, path: typeof body?.path === 'string' ? body.path.slice(0, 500) : '/', referrer: typeof body?.referrer === 'string' ? body.referrer.slice(0, 500) : null, company_domain: typeof body?.host === 'string' ? body.host.toLowerCase().replace(/^www\./, '').slice(0, 160) : null, consented: body?.consented === true || eventName === 'widget_opened' || eventName === 'feedback_submitted' })
  if (error) return NextResponse.json({ error: 'Événement non enregistré.' }, { status: 500, headers: cors() })
  return NextResponse.json({ ok: true }, { headers: cors() })
}
export function OPTIONS() { return new NextResponse(null, { status: 204, headers: cors() }) }
