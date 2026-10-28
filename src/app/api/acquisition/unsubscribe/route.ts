import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { verifyProspectUnsubscribeToken } from '@/lib/email/unsubscribe'
import { siteOrigin } from '@/lib/admin/acquisition-mail'

/** Désinscription d'un prospect : exclut l'adresse, annule tout brouillon ou relance en attente, garde la trace de la demande. */
async function unsubscribe(token: string | null, source: 'one_click' | 'page') {
  const messageId = token ? verifyProspectUnsubscribeToken(token) : null
  if (!messageId) return { ok: false as const, status: 400, error: 'Ce lien de désinscription est invalide ou a expiré. Répondez « stop » à l’email reçu.' }
  const admin = getSupabaseAdminClient() as any
  const { data: message } = await admin.from('acquisition_messages').select('id, contact_id').eq('id', messageId).maybeSingle()
  if (!message) return { ok: false as const, status: 404, error: 'Ce message est introuvable.' }
  // L'exclusion d'abord : c'est la seule écriture qui compte pour respecter la demande.
  const blocked = await admin.from('acquisition_contacts').update({ email_status: 'suppressed' }).eq('id', message.contact_id)
  if (blocked.error) return { ok: false as const, status: 503, error: 'Impossible d’enregistrer votre demande pour le moment. Répondez « stop » à l’email reçu.' }
  await admin.from('acquisition_messages').update({ status: 'suppressed', next_follow_up_at: null }).eq('contact_id', message.contact_id).in('status', ['draft', 'approved', 'sent'])
  // Trace de la demande (preuve en cas de contrôle) : ignorée si la migration n'est pas encore appliquée.
  await admin.from('acquisition_contacts').update({ unsubscribed_at: new Date().toISOString(), unsubscribe_source: source }).eq('id', message.contact_id)
  return { ok: true as const }
}

/** Clients mail (Gmail, Apple Mail…) : POST « List-Unsubscribe=One-Click » vers l'URL de l'en-tête, jeton dans l'adresse. */
export async function POST(request: NextRequest) {
  let token = request.nextUrl.searchParams.get('token')
  if (!token) {
    const body = await request.json().catch(() => null) as { token?: unknown } | null
    if (typeof body?.token === 'string') token = body.token
  }
  const result = await unsubscribe(token, request.nextUrl.searchParams.get('token') ? 'one_click' : 'page')
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ ok: true })
}

/** Un simple clic sur le lien ne désinscrit pas (les antivirus ouvrent les liens) : on affiche la page de confirmation. */
export async function GET(request: NextRequest) {
  const destination = new URL('/desinscription', siteOrigin())
  const token = request.nextUrl.searchParams.get('token')
  if (token) destination.searchParams.set('token', token)
  return NextResponse.redirect(destination)
}
