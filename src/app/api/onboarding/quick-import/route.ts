import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'
import { ONBOARDING_IMPORT_LIMIT } from '@/lib/billing/plans'
import { getFeedbackCapacity, getUserPlan, isSiteWritable, READ_ONLY_MESSAGE } from '@/lib/billing/limits'
import { fetchAppStoreReviews, parsePastedReviews, type PublicReview } from '@/lib/admin/acquisition-reviews'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non connecté.' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as {
    siteId?: unknown
    source?: unknown
    appId?: unknown
    country?: unknown
    text?: unknown
  }
  const siteId = typeof body.siteId === 'string' ? body.siteId.trim() : ''
  if (!siteId) return NextResponse.json({ error: 'Projet manquant.' }, { status: 400 })

  const { data: site } = await supabase.from('sites').select('id').eq('id', siteId).eq('user_id', user.id).maybeSingle()
  if (!site) return NextResponse.json({ error: 'Projet introuvable.' }, { status: 404 })

  const plan = await getUserPlan(supabase, user.id)
  if (!(await isSiteWritable(supabase, user.id, siteId, plan))) {
    return NextResponse.json({ error: READ_ONLY_MESSAGE, quota: 'read_only', plan }, { status: 403 })
  }
  const capacity = await getFeedbackCapacity(supabase, siteId, plan)
  if (capacity.remaining <= 0) {
    return NextResponse.json(
      { error: `Vous avez atteint la limite de ${capacity.limit.toLocaleString('fr-FR')} avis pour ce projet.`, imported: 0, limitReached: true },
      { status: 422 },
    )
  }

  const importLimit = Math.min(capacity.remaining, ONBOARDING_IMPORT_LIMIT)

  let reviews: PublicReview[] = []
  let importedSource = 'manual_paste'

  if (body.source === 'app_store') {
    const appId = typeof body.appId === 'string' ? body.appId.trim() : ''
    const country = typeof body.country === 'string' ? body.country.trim().toLowerCase() : 'fr'
    if (!/^\d{6,12}$/.test(appId)) {
      return NextResponse.json({ error: 'Sélectionnez une application valide.' }, { status: 400 })
    }
    importedSource = 'app_store'
    const maxPages = Math.min(2, Math.max(1, Math.ceil(importLimit / 50)))
    try {
      reviews = await fetchAppStoreReviews(appId, country, maxPages)
    } catch {
      return NextResponse.json({ error: 'Impossible de récupérer les avis App Store pour le moment.' }, { status: 502 })
    }
  } else if (body.source === 'pasted') {
    const text = typeof body.text === 'string' ? body.text.slice(0, 150_000) : ''
    reviews = parsePastedReviews(text)
  } else {
    return NextResponse.json({ error: 'Méthode d’import non reconnue.' }, { status: 400 })
  }

  if (reviews.length < 3) {
    return NextResponse.json(
      { error: `Il faut au moins 3 avis écrits pour générer une synthèse (${reviews.length} trouvé${reviews.length > 1 ? 's' : ''}).` },
      { status: 422 },
    )
  }

  const admin = getSupabaseAdminClient() as any
  await admin.from('sites').update({ onboarding_method: 'import' }).eq('id', siteId).eq('user_id', user.id)

  const selected = reviews.slice(0, importLimit)
  const overflowCount = Math.max(0, reviews.length - selected.length)

  const rowsToInsert = selected.map((rev) => ({
    user_id: user.id,
    site_id: siteId,
    source: 'csv',
    content: (rev.title ? `${rev.title} — ${rev.content}` : rev.content).slice(0, 2000),
    sentiment: rev.rating == null ? null : rev.rating <= 2 ? 'negative' : rev.rating === 3 ? 'neutral' : 'positive',
    created_at: rev.created_at,
    metadata: { imported_source: importedSource, rating: rev.rating, classification_status: 'pending' },
  }))

  const { data: inserted, error } = await (supabase as any)
    .from('feedback_items')
    .insert(rowsToInsert)
    .select('id, site_id, content')

  if (error) {
    return NextResponse.json({ error: 'Impossible d’enregistrer ces avis dans votre projet.' }, { status: 500 })
  }

  return NextResponse.json({
    imported: rowsToInsert.length,
    overflow: overflowCount,
    limit: capacity.limit,
    onboardingLimit: ONBOARDING_IMPORT_LIMIT,
    plan,
    onboardingMethod: 'import',
  })
}

