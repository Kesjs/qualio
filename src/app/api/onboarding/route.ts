import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

const INTENTS = [
  'understand_feedback',
  'identify_themes',
  'track_satisfaction',
  'get_recommendations',
  'prepare_reports',
  'connect_sources',
] as const

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({ intent: user.user_metadata?.onboarding_intent ?? null, answers: user.user_metadata?.onboarding_answers ?? {} })
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as { intent?: unknown; answers?: unknown } | null
  if (typeof body?.intent !== 'string' || !(INTENTS as readonly string[]).includes(body.intent)) {
    return NextResponse.json({ error: 'Intention invalide.' }, { status: 400 })
  }

  const answers = body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers)
    ? Object.fromEntries(Object.entries(body.answers).filter(([key, value]) => typeof key === 'string' && typeof value === 'string').map(([key, value]) => [key.slice(0, 80), value.slice(0, 160)]))
    : {}
  const { error } = await supabase.auth.updateUser({ data: { onboarding_intent: body.intent, onboarding_answers: answers } })
  if (error) return NextResponse.json({ error: 'Impossible d’enregistrer votre intention.' }, { status: 500 })
  return NextResponse.json({ intent: body.intent, answers })
}
