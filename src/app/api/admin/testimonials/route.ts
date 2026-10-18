import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

const UUID = /^[0-9a-f-]{36}$/i

/** Publie (ou met à jour) un témoignage à partir d'un retour dont l'auteur a donné son accord. */
export async function POST(request: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { feedbackId?: unknown; quote?: unknown; name?: unknown; role?: unknown } | null
  const feedbackId = typeof body?.feedbackId === 'string' ? body.feedbackId : ''
  const quote = typeof body?.quote === 'string' ? body.quote.trim() : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const role = typeof body?.role === 'string' ? body.role.trim() : ''
  if (!UUID.test(feedbackId)) return NextResponse.json({ error: 'Retour invalide.' }, { status: 400 })
  if (quote.length < 10 || quote.length > 600) return NextResponse.json({ error: 'La citation doit faire entre 10 et 600 caractères.' }, { status: 400 })
  if (!name || name.length > 80) return NextResponse.json({ error: 'Indiquez le nom à afficher (80 caractères au plus).' }, { status: 400 })
  if (role.length > 120) return NextResponse.json({ error: 'Le rôle est trop long (120 caractères au plus).' }, { status: 400 })
  const admin = getSupabaseAdminClient() as any
  const { data: feedback } = await admin.from('product_feedback').select('id, allow_public_testimonial').eq('id', feedbackId).maybeSingle()
  if (!feedback) return NextResponse.json({ error: 'Retour introuvable.' }, { status: 404 })
  if (!feedback.allow_public_testimonial) return NextResponse.json({ error: 'Cette personne n’a pas autorisé de témoignage public.' }, { status: 403 })
  const { error } = await admin.from('public_testimonials').upsert({ feedback_id: feedbackId, quote, name, role, published_at: new Date().toISOString() }, { onConflict: 'feedback_id' })
  if (error) return NextResponse.json({ error: 'Impossible de publier le témoignage.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** Retire un témoignage de la landing. */
export async function DELETE(request: NextRequest) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const feedbackId = request.nextUrl.searchParams.get('feedbackId') ?? ''
  if (!UUID.test(feedbackId)) return NextResponse.json({ error: 'Retour invalide.' }, { status: 400 })
  const admin = getSupabaseAdminClient() as any
  const { error } = await admin.from('public_testimonials').delete().eq('feedback_id', feedbackId)
  if (error) return NextResponse.json({ error: 'Impossible de retirer le témoignage.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
