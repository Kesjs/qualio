import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { searchAppStore } from '@/lib/admin/acquisition-reviews'

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non connecté.' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { query?: unknown; country?: unknown }
  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 120) : ''
  const country = typeof body.country === 'string' ? body.country.trim().toLowerCase() : 'fr'
  if (query.length < 2) {
    return NextResponse.json({ error: 'Tapez le nom de votre application ou collez son lien App Store.' }, { status: 400 })
  }

  try {
    const apps = await searchAppStore(query, country)
    return NextResponse.json({ apps })
  } catch {
    return NextResponse.json({ error: 'L’App Store est momentanément indisponible. Réessayez dans un instant.' }, { status: 502 })
  }
}
