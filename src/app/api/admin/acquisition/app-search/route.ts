import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { filterAppStoreBatch, searchAppStore } from '@/lib/admin/acquisition-reviews'

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const body = (await request.json().catch(() => ({}))) as {
    query?: string
    country?: string
    batch?: boolean
    limit?: number
    minRating?: number
    maxRating?: number
    minRatingCount?: number
  }
  const query = String(body.query ?? '').trim()
  if (query.length < 2) return NextResponse.json({ error: 'Indique le nom de l’app ou colle son lien App Store.' }, { status: 400 })
  try {
    const country = String(body.country ?? 'fr').toLowerCase()
    if (body.batch) {
      const rawApps = await searchAppStore(query, country, 200)
      const apps = filterAppStoreBatch(rawApps, {
        minRating: typeof body.minRating === 'number' ? body.minRating : 3.4,
        maxRating: typeof body.maxRating === 'number' ? body.maxRating : 4.4,
        minRatingCount: typeof body.minRatingCount === 'number' ? body.minRatingCount : 20,
        requirePublisherDomain: true,
        limit: typeof body.limit === 'number' ? body.limit : 20,
      })
      return NextResponse.json({ apps, scannedCount: rawApps.length })
    }
    const apps = await searchAppStore(query, country)
    return NextResponse.json({ apps })
  } catch (error) {
    console.error('[App Store search]', error)
    return NextResponse.json({ error: 'L’App Store ne répond pas pour le moment. Réessaie dans un instant.' }, { status: 502 })
  }
}

