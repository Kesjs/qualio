import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export async function GET() {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const { data, error } = await (getSupabaseAdminClient() as any).from('acquisition_messages').select('id, subject, body, status, created_at, contact:acquisition_contacts(email, company:acquisition_companies(name))').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Impossible de charger les brouillons.' }, { status: 500 })
  return NextResponse.json({ messages: data ?? [] })
}
