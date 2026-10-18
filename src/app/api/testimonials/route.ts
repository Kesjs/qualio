import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export const revalidate = 300

/** Témoignages publiés sur la landing : validés par l'admin, avec consentement de l'auteur vérifié à chaque lecture. */
export async function GET() {
  const admin = getSupabaseAdminClient() as any
  const { data: rows } = await admin.from('public_testimonials').select('feedback_id, quote, name, role').order('published_at', { ascending: false }).limit(6)
  const ids = ((rows ?? []) as Array<{ feedback_id: string }>).map((row) => row.feedback_id)
  if (!ids.length) return NextResponse.json({ testimonials: [] })
  const { data: consented } = await admin.from('product_feedback').select('id').in('id', ids).eq('allow_public_testimonial', true)
  const allowed = new Set(((consented ?? []) as Array<{ id: string }>).map((row) => row.id))
  const testimonials = (rows as Array<{ feedback_id: string; quote: string; name: string; role: string }>)
    .filter((row) => allowed.has(row.feedback_id))
    .map(({ quote, name, role }) => ({ quote, name, role }))
  return NextResponse.json({ testimonials }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } })
}
