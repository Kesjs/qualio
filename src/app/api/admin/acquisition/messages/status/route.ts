import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/** Suivi manuel : « répondu », « stop reçu » (le contact ne sera plus jamais relancé) ou annulation d'une réponse. */
export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const { id, action } = await request.json().catch(() => ({})) as { id?: string; action?: 'replied' | 'stop' | 'undo' }
  if (!id || !['replied', 'stop', 'undo'].includes(String(action))) return NextResponse.json({ error: 'Action invalide.' }, { status: 400 })
  const admin = getSupabaseAdminClient() as any
  const { data: message } = await admin.from('acquisition_messages').select('id, contact_id, status').eq('id', id).maybeSingle()
  if (!message) return NextResponse.json({ error: 'Message introuvable.' }, { status: 404 })
  if (action === 'undo') {
    if (message.status !== 'replied') return NextResponse.json({ error: 'Seules les réponses peuvent être annulées.' }, { status: 409 })
    await admin.from('acquisition_messages').update({ status: 'sent', replied_at: null }).eq('id', id)
    return NextResponse.json({ ok: true })
  }
  if (!['sent', 'bounced'].includes(message.status)) return NextResponse.json({ error: 'Ce message n’est pas en attente de réponse.' }, { status: 409 })
  if (action === 'replied') {
    await admin.from('acquisition_messages').update({ status: 'replied', replied_at: new Date().toISOString() }).eq('id', id)
    return NextResponse.json({ ok: true })
  }
  await admin.from('acquisition_messages').update({ status: 'suppressed' }).eq('id', id)
  await admin.from('acquisition_contacts').update({ email_status: 'suppressed' }).eq('id', message.contact_id)
  return NextResponse.json({ ok: true })
}
