import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const { messageIds } = await request.json().catch(() => ({})) as { messageIds?: string[] }
  if (!Array.isArray(messageIds) || !messageIds.length || messageIds.length > 200) return NextResponse.json({ error: 'Sélection vide.' }, { status: 400 })
  const { data, error } = await (getSupabaseAdminClient() as any).from('acquisition_messages').delete().in('id', messageIds).in('status', ['draft', 'approved']).select('id')
  if (error) return NextResponse.json({ error: 'Impossible de supprimer ces brouillons.' }, { status: 500 })
  return NextResponse.json({ deleted: data?.length ?? 0 })
}
