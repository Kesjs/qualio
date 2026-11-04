import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { searchAppStore } from '@/lib/admin/acquisition-reviews'

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as { query?: string; country?: string }
  const query = String(body.query ?? '').trim()
  if (query.length < 2) return NextResponse.json({ error: 'Indique le nom de l’app ou colle son lien App Store.' }, { status: 400 })
  try {
    const apps = await searchAppStore(query, String(body.country ?? 'fr').toLowerCase())
    return NextResponse.json({ apps })
  } catch (error) {
    console.error('[App Store search]', error)
    return NextResponse.json({ error: 'L’App Store ne répond pas pour le moment. Réessaie dans un instant.' }, { status: 502 })
  }
}

