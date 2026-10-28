import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tryqualio.pro'

export async function GET(request: NextRequest) {
  const messageId = request.nextUrl.searchParams.get('message')?.trim() ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(messageId)) return NextResponse.redirect(new URL('/', SITE_URL))
  const admin = getSupabaseAdminClient() as any
  const { data: message } = await admin.from('acquisition_messages').select('id, status').eq('id', messageId).maybeSingle()
  if (message?.id && ['sent', 'replied'].includes(message.status)) {
    await admin.from('acquisition_messages').update({ clicked_at: new Date().toISOString() }).eq('id', message.id).is('clicked_at', null)
    const utm = { utm_source: 'email', utm_medium: 'outreach', utm_campaign: 'prospection', utm_content: message.id }
    await admin.from('acquisition_visitor_events').insert({ session_id: crypto.randomUUID(), event_name: 'email_clicked', path: '/', acquisition_message_id: message.id, ...utm, consented: false })
    const destination = new URL('/acquisition/visite', SITE_URL)
    destination.searchParams.set('destination', '/')
    Object.entries(utm).forEach(([key, value]) => destination.searchParams.set(key, value))
    return NextResponse.redirect(destination)
  }
  return NextResponse.redirect(new URL('/', SITE_URL))
}
