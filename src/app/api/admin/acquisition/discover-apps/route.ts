import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { cleanDomain, isDomainAlive } from '@/lib/admin/acquisition-ai'
import { searchAppStore, type AppStoreApp } from '@/lib/admin/acquisition-reviews'
import { REPORT_MIN_REVIEWS } from '@/lib/admin/acquisition-report'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export const maxDuration = 60

const GIANT_PUBLISHERS = /google|apple|microsoft|meta platforms|amazon|netflix|spotify|uber|tiktok|bytedance|snap inc|adobe|salesforce|oracle|sap se|booking\.com|airbnb|paypal|revolut|sncf|la poste|orange sa|bouygues|societe generale|bnp paribas|credit agricole/i

function cleanCompanyNameFromApp(app: AppStoreApp): string {
  const shortAppName = app.name.split(/\s[-–:|•]\s/)[0].trim()
  if (shortAppName.length >= 2 && shortAppName.length <= 48) return shortAppName
  const cleanSeller = app.seller
    .replace(/\b(SASU?|SARL|SA|Inc\.?|Ltd\.?|GmbH|BV|Corp\.?|LLC)\b/gi, '')
    .replace(/[,.]+$/, '')
    .trim()
  return (cleanSeller || shortAppName || app.name).slice(0, 120)
}

export async function POST(request: Request) {
  if (!(await requireAdminApi())) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    query?: string
    country?: string
    limit?: number
    minReviews?: number
    maxRating?: number
  }

  const rawQuery = String(body.query ?? '').trim().slice(0, 160)
  const country = String(body.country ?? 'fr').trim().toLowerCase()
  const limit = Math.min(Math.max(Math.floor(Number(body.limit) || 20), 5), 40)
  const minReviews = Math.max(REPORT_MIN_REVIEWS, Math.min(Math.floor(Number(body.minReviews) || 10), 500))
  const maxRating = Number.isFinite(Number(body.maxRating)) && Number(body.maxRating) > 0 ? Number(body.maxRating) : 5

  if (rawQuery.length < 2) {
    return NextResponse.json(
      { error: 'Indique un mot-clé métier ou secteur (ex. « facturation », « immobilier », « RH »).' },
      { status: 400 },
    )
  }

  const admin = getSupabaseAdminClient() as any

  const { data: existingRows } = await admin
    .from('acquisition_companies')
    .select('domain')
    .order('created_at', { ascending: false })
    .limit(1000)

  const known = new Set<string>(
    (existingRows ?? [])
      .map((r: { domain?: string }) => cleanDomain(r.domain))
      .filter((d: string | null): d is string => Boolean(d)),
  )

  // Permet de combiner plusieurs mots-clés séparés par virgule pour élargir le vivier
  const terms = rawQuery
    .split(/[,;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 3)

  const rawApps: AppStoreApp[] = []
  try {
    const batches = await Promise.all(terms.map((term) => searchAppStore(term, country, 120)))
    for (const batch of batches) rawApps.push(...batch)
  } catch (err) {
    console.error('[Discover Apps] App Store search error', err)
    return NextResponse.json(
      { error: 'L’App Store ne répond pas pour le moment. Réessaie dans quelques secondes.' },
      { status: 502 },
    )
  }

  // Filtrage PME / Scale-up : site éditeur officiel réel, assez d'avis pour /rapport/[token], hors géants mondiaux
  const byDomain = new Map<string, { app: AppStoreApp; domain: string }>()
  let skippedKnown = 0

  for (const app of rawApps) {
    const count = app.ratingCount ?? 0
    if (count < minReviews || count > 25_000) continue
    if (app.rating != null && app.rating > maxRating) continue
    if (GIANT_PUBLISHERS.test(app.seller)) continue

    const domain = cleanDomain(app.sellerUrl)
    if (!domain) continue

    if (known.has(domain)) {
      skippedKnown += 1
      continue
    }

    const prev = byDomain.get(domain)
    if (!prev || (app.ratingCount ?? 0) > (prev.app.ratingCount ?? 0)) {
      byDomain.set(domain, { app, domain })
    }
  }

  const candidates = [...byDomain.values()].slice(0, Math.min(limit * 2, 45))

  if (!candidates.length) {
    return NextResponse.json({
      found: rawApps.length,
      added: 0,
      duplicates: skippedKnown,
      insertedCompanies: [],
      message: skippedKnown
        ? 'Toutes les applications correspondantes sont déjà dans ta liste. Essaie un autre mot-clé métier.'
        : 'Aucune application PME avec site éditeur et suffisamment d’avis n’a été trouvée pour ce mot-clé.',
    })
  }

  // Vérification parallèle que le site éditeur répond bien en direct
  const aliveChecks = await Promise.allSettled(
    candidates.map(async (item) => ({
      ...item,
      alive: await isDomainAlive(item.domain),
    })),
  )

  const verified = aliveChecks
    .filter((r): r is PromiseFulfilledResult<{ app: AppStoreApp; domain: string; alive: boolean }> => r.status === 'fulfilled' && r.value.alive)
    .map((r) => r.value)
    .slice(0, limit)

  if (!verified.length) {
    return NextResponse.json({
      found: candidates.length,
      added: 0,
      duplicates: skippedKnown,
      insertedCompanies: [],
      message: 'Les sites éditeurs trouvés ne répondent pas en direct. Essaie un autre secteur.',
    })
  }

  const insertedCompanies: Array<{ id: string; name: string; domain: string }> = []
  const countryLabel = country === 'be' ? 'Belgique' : country === 'ch' ? 'Suisse' : country === 'ca' ? 'Canada' : 'France'

  for (const { app, domain } of verified) {
    const ratingText = app.rating != null ? `${app.rating}★` : 'notée'
    const companyRecord = {
      name: cleanCompanyNameFromApp(app),
      domain,
      website_url: `https://${domain}`,
      country: countryLabel,
      company_size: (app.ratingCount ?? 0) >= 500 ? 'PME' : 'TPE',
      relevance_score: 45,
      status: 'discovered',
      source_url: app.url,
      source_notes: `App Store · ${app.name} (${ratingText} · ${app.ratingCount ?? 0} avis publics)`,
    }

    const { data: created } = await admin
      .from('acquisition_companies')
      .insert(companyRecord)
      .select('id, name, domain')
      .maybeSingle()

    if (!created?.id) continue

    const companyId = String(created.id)
    insertedCompanies.push({
      id: companyId,
      name: String(created.name),
      domain: String(created.domain).toLowerCase(),
    })

    // Pré-attache immédiatement la fiche App Store pour permettre la génération du rapport /rapport/[token] en 1 clic
    await admin.from('acquisition_signals').insert({
      company_id: companyId,
      signal_type: 'app_store',
      label: 'Avis publics sur App Store',
      source_url: app.url,
      evidence: `${app.name} — ${ratingText} (${app.ratingCount ?? 0} avis)`,
      confidence: 98,
    })
  }

  return NextResponse.json({
    found: verified.length,
    added: insertedCompanies.length,
    duplicates: skippedKnown,
    insertedCompanies,
  })
}
