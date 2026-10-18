import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { parseFeedbackPatch } from '@/lib/admin/feedback-patch'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/** Met à jour le statut, la priorité ou la note interne d'un retour produit. */
export async function PATCH(request: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = parseFeedbackPatch(await request.json().catch(() => null))
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const admin = getSupabaseAdminClient() as any
  const { data, error } = await admin.from('product_feedback').update(parsed.changes).eq('id', parsed.id).select('id, status, priority, admin_note, updated_at').maybeSingle()
  if (error) return NextResponse.json({ error: 'Impossible d’enregistrer la modification.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Retour introuvable.' }, { status: 404 })
  return NextResponse.json({ ok: true, feedback: data })
}
