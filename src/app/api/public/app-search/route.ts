import { NextRequest, NextResponse } from 'next/server'
import { searchAppStore } from '@/lib/admin/acquisition-reviews'
import { consumeAppSearchQuota, getTrustedClientIp } from '@/lib/public/mini-audit-guard'

export async function POST(request: NextRequest) {
  const ip = getTrustedClientIp(request)
  const quota = consumeAppSearchQuota(ip)
  if (!quota.allowed) {
    return NextResponse.json(
      { error: 'Trop de recherches rapprochées. Réessayez dans quelques minutes.' },
      { status: 429, headers: { 'Retry-After': String(quota.retryAfterSec) } },
    )
  }

  const body = (await request.json().catch(() => ({}))) as { query?: unknown; country?: unknown }
  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 120) : ''
  const country = typeof body.country === 'string' ? body.country.trim().toLowerCase() : 'fr'
  if (query.length < 2) {
    return NextResponse.json({ error: 'Indiquez le nom d’une application iOS ou son lien App Store.' }, { status: 400 })
  }

  try {
    const apps = await searchAppStore(query, country)
    return NextResponse.json({ apps: apps.slice(0, 5) })
  } catch {
    return NextResponse.json({ error: 'L’App Store ne répond pas pour l’instant. Réessayez dans un instant.' }, { status: 502 })
  }
}
