import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const { id, subject, body } = await request.json().catch(() => ({})) as { id?: string; subject?: string; body?: string }
  const cleanSubject = String(subject ?? '').trim()
  const cleanBody = String(body ?? '').trim()
  if (!id || !cleanSubject || !cleanBody) return NextResponse.json({ error: 'Le sujet et le message ne peuvent pas être vides.' }, { status: 400 })
  if (cleanSubject.length > 200 || cleanBody.length > 5000) return NextResponse.json({ error: 'Message trop long (200 caractères pour le sujet, 5000 pour le corps).' }, { status: 400 })
  const { data, error } = await (getSupabaseAdminClient() as any).from('acquisition_messages').update({ subject: cleanSubject, body: cleanBody, status: 'draft' }).eq('id', id).in('status', ['draft', 'approved']).select('id')
  if (error) return NextResponse.json({ error: 'Impossible d’enregistrer le message.' }, { status: 500 })
  if (!data?.length) return NextResponse.json({ error: 'Ce message a déjà été envoyé : il n’est plus modifiable.' }, { status: 409 })
  return NextResponse.json({ ok: true })
}
