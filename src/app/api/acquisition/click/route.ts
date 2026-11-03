import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { firstHumanClick, isAutomatedUserAgent, MAX_RAW_CLICKS_PER_MESSAGE } from '@/lib/admin/acquisition-clicks'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tryqualio.pro'

export async function GET(request: NextRequest) {
  const ignored = request.cookies.get('qualio_ignore')?.value === '1'
  const messageId = request.nextUrl.searchParams.get('message')?.trim() ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(messageId)) return NextResponse.redirect(new URL('/', SITE_URL))
  const admin = getSupabaseAdminClient() as any
  const { data: message } = await admin.from('acquisition_messages').select('id, status, sent_at, delivered_at').eq('id', messageId).maybeSingle()
  if (ignored) return NextResponse.redirect(new URL('/', SITE_URL))
  if (message?.id && ['sent', 'replied'].includes(message.status)) {
    const utm = { utm_source: 'email', utm_medium: 'outreach', utm_campaign: 'prospection', utm_content: message.id }
    // Les robots (HEAD, aperçus, antivirus connus) sont redirigés sans rien enregistrer.
    const automated = request.method === 'HEAD' || isAutomatedUserAgent(request.headers.get('user-agent'))
    if (!automated) {
      const now = Date.now()
      const { data: previous } = await admin.from('acquisition_visitor_events').select('created_at').eq('acquisition_message_id', message.id).eq('event_name', 'email_clicked').order('created_at', { ascending: true }).limit(MAX_RAW_CLICKS_PER_MESSAGE)
      const previousTimes = ((previous ?? []) as Array<{ created_at: string }>).map((row) => new Date(row.created_at).getTime())
      const baselineValue = message.delivered_at ?? message.sent_at
      const baseline = baselineValue ? new Date(baselineValue).getTime() : null
      if (previousTimes.length < MAX_RAW_CLICKS_PER_MESSAGE) {
        await admin.from('acquisition_visitor_events').insert({ session_id: crypto.randomUUID(), event_name: 'email_clicked', path: '/', acquisition_message_id: message.id, ...utm, consented: false })
        // « clicked_at » n'est posé que pour le premier clic qui n'a pas l'air automatique.
        if (firstHumanClick([...previousTimes, now], baseline) === now) {
          await admin.from('acquisition_messages').update({ clicked_at: new Date(now).toISOString() }).eq('id', message.id).is('clicked_at', null)
        }
      }
    }
    const destination = new URL('/acquisition/visite', SITE_URL)
    destination.searchParams.set('destination', '/')
    Object.entries(utm).forEach(([key, value]) => destination.searchParams.set(key, value))
    return NextResponse.redirect(destination)
  }
  return NextResponse.redirect(new URL('/', SITE_URL))
}
