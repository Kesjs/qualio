import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const categories = new Set(['improvement', 'bug', 'difficulty', 'positive', 'other'])

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Vous devez être connecté.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const category = String(body?.category ?? '')
  const message = String(body?.message ?? '').trim()
  const context = String(body?.context ?? '').trim().slice(0, 500) || null
  if (!categories.has(category) || message.length < 10 || message.length > 4000) {
    return NextResponse.json({ error: 'Décrivez votre retour en au moins 10 caractères.' }, { status: 400 })
  }

  const { error } = await supabase.from('product_feedback' as never).insert({
    user_id: user.id,
    category,
    message,
    context,
    allow_contact: Boolean(body?.allowContact),
    allow_public_testimonial: Boolean(body?.allowPublicTestimonial),
  } as never)
  if (error) {
    console.error('[product-feedback] insert failed', error.message)
    return NextResponse.json({ error: 'Votre retour n’a pas pu être enregistré.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Vous devez être connecté.' }, { status: 401 })
  const { data, error } = await supabase.from('product_feedback' as never).select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Impossible de charger les retours.' }, { status: 500 })
  return NextResponse.json({ feedback: data ?? [] })
}
