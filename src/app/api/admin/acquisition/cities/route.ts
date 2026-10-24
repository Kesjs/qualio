import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'

const UA = 'QualioResearchBot/1.0 (+https://tryqualio.pro)'

export type CitySuggestion = {
  label: string
  city: string
  country: string
  osm_type: string
  osm_id: number
  boundingbox?: string[]
}

export async function GET(request: Request) {
  if (!await requireAdminApi()) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = String(searchParams.get('q') ?? '').trim().slice(0, 100)

  if (q.length < 2) {
    return NextResponse.json({ cities: [] })
  }

  try {
    const params = new URLSearchParams({
      q,
      format: 'json',
      addressdetails: '1',
      limit: '7',
      // Priorise les villes, municipalités, agglomérations
      featuretype: 'settlement',
    })

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        'user-agent': UA,
        accept: 'application/json',
      },
      signal: AbortSignal.timeout(6_000),
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json({ cities: [] })
    }

    const data = (await response.json()) as Array<{
      display_name: string
      osm_type: string
      osm_id: number
      boundingbox?: string[]
      address?: {
        city?: string
        town?: string
        village?: string
        municipality?: string
        state?: string
        county?: string
        country?: string
      }
    }>

    const suggestions: CitySuggestion[] = []
    const seen = new Set<string>()

    for (const item of data) {
      const cityName =
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        item.address?.municipality ||
        item.display_name.split(',')[0].trim()

      const country = item.address?.country || ''
      const state = item.address?.state || item.address?.county || ''

      const labelParts = [cityName, state, country].filter(Boolean)
      const label = labelParts.join(', ')

      const key = `${cityName.toLowerCase()}-${country.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)

      suggestions.push({
        label: item.display_name.length < 90 ? item.display_name : label,
        city: cityName,
        country,
        osm_type: item.osm_type,
        osm_id: item.osm_id,
        boundingbox: item.boundingbox,
      })
    }

    return NextResponse.json({ cities: suggestions })
  } catch (error) {
    console.error('[Cities Autocomplete] Nominatim error', error)
    return NextResponse.json({ cities: [] })
  }
}
