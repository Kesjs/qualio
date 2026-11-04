import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'
import { BILLING_PLANS, resolvePlan } from '@/lib/billing/plans'
import { appStoreIdFrom, fetchAppStoreReviews } from '@/lib/admin/acquisition-reviews'
import type { ProspectReport } from '@/lib/admin/acquisition-report'
import { persistRecommendations } from '@/lib/feedback/persist-recommendations'

export const maxDuration = 60

const TOKEN_RE = /^[\w-]{12,80}$/

/** Aperçu léger d'un rapport public afin de proposer l'import en 1 clic dans /onboarding. */
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non connecté.' }, { status: 401 })

  const token = request.nextUrl.searchParams.get('token')?.trim() ?? ''
  if (!TOKEN_RE.test(token)) return NextResponse.json({ found: false })

  const admin = getSupabaseAdminClient() as any
  const { data } = await admin
    .from('acquisition_reports')
    .select('subject_name, source_label, review_count, report')
    .eq('token', token)
    .is('revoked_at', null)
    .maybeSingle()

  if (!data?.report) return NextResponse.json({ found: false })
  const report = data.report as ProspectReport
  return NextResponse.json({
    found: true,
    subjectName: data.subject_name,
    sourceLabel: data.source_label,
    reviewCount: data.review_count,
    problemCount: report.problems?.length ?? 0,
  })
}

/** Crée immédiatement un espace Qualio pré-rempli à partir d'un rapport /rapport/[token]. */
export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non connecté.' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { token?: unknown }
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!TOKEN_RE.test(token)) return NextResponse.json({ error: 'Rapport invalide.' }, { status: 400 })

  const admin = getSupabaseAdminClient() as any
  const { data: row } = await admin
    .from('acquisition_reports')
    .select('subject_name, source, source_label, source_url, report')
    .eq('token', token)
    .is('revoked_at', null)
    .maybeSingle()

  if (!row?.report) return NextResponse.json({ error: 'Ce rapport est introuvable ou expiré.' }, { status: 404 })
  const report = row.report as ProspectReport

  const [{ data: subscription }, { count: projectCount }] = await Promise.all([
    admin.from('billing_subscriptions').select('plan, status, source, current_period_end').eq('user_id', user.id).maybeSingle(),
    supabase.from('sites').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])
  const plan = resolvePlan(subscription)
  const limit = BILLING_PLANS[plan].projects
  if ((projectCount ?? 0) >= limit) {
    return NextResponse.json(
      { error: `Votre plan ${BILLING_PLANS[plan].label} autorise ${limit} projet${limit > 1 ? 's' : ''}.` },
      { status: 403 },
    )
  }

  const nowIso = new Date().toISOString()
  const { data: createdSite, error: siteError } = await admin
    .from('sites')
    .insert({
      user_id: user.id,
      name: String(row.subject_name).slice(0, 160),
      url: typeof row.source_url === 'string' && /^https?:\/\//i.test(row.source_url) ? row.source_url : null,
      onboarding_method: 'import',
      onboarding_completed_at: nowIso,
    })
    .select('id, user_id, url, name, onboarding_method, onboarding_completed_at, sector, created_at, updated_at')
    .single()

  if (siteError || !createdSite) {
    return NextResponse.json({ error: 'Impossible de créer votre projet.' }, { status: 500 })
  }

  const maxFeedback = BILLING_PLANS[plan].feedbackPerProject
  const itemsToInsert: Array<Record<string, unknown>> = []

  // 1. Insérer d'abord les verbatims cités dans les problèmes du rapport (pour lier chaque recommandation à ses vrais avis)
  const quoteIndexByProblem: number[][] = []
  for (const problem of report.problems ?? []) {
    const indices: number[] = []
    for (const quote of problem.quotes ?? []) {
      if (itemsToInsert.length >= maxFeedback) break
      indices.push(itemsToInsert.length)
      itemsToInsert.push({
        user_id: user.id,
        site_id: createdSite.id,
        source: 'csv',
        content: quote.text.slice(0, 2000),
        theme: problem.theme || null,
        sentiment: quote.rating == null ? 'negative' : quote.rating <= 2 ? 'negative' : quote.rating === 3 ? 'neutral' : 'positive',
        created_at: nowIso,
        metadata: { imported_source: row.source_label, from_report: token },
      })
    }
    quoteIndexByProblem.push(indices)
  }

  // 2. Si c'est une app iOS et qu'il reste de la capacité sur le plan, enrichir avec les avis récents du flux Apple
  const appId = row.source === 'app_store' && row.source_url ? appStoreIdFrom(row.source_url) : null
  if (appId && itemsToInsert.length < maxFeedback) {
    try {
      const liveReviews = await fetchAppStoreReviews(appId, 'fr', 1)
      const existingTexts = new Set(itemsToInsert.map((i) => String(i.content).slice(0, 80)))
      for (const rev of liveReviews) {
        if (itemsToInsert.length >= maxFeedback) break
        const text = (rev.title ? `${rev.title} — ${rev.content}` : rev.content).slice(0, 2000)
        if (existingTexts.has(text.slice(0, 80))) continue
        existingTexts.add(text.slice(0, 80))
        itemsToInsert.push({
          user_id: user.id,
          site_id: createdSite.id,
          source: 'csv',
          content: text,
          sentiment: rev.rating == null ? null : rev.rating <= 2 ? 'negative' : rev.rating === 3 ? 'neutral' : 'positive',
          created_at: rev.created_at,
          metadata: { imported_source: 'App Store', from_report: token },
        })
      }
    } catch {
      /* Non bloquant : les verbatims du rapport suffisent à peupler l'espace */
    }
  }

  let insertedIds: string[] = []
  if (itemsToInsert.length > 0) {
    const { data: insertedRows } = await admin
      .from('feedback_items')
      .insert(itemsToInsert)
      .select('id')
    insertedIds = ((insertedRows ?? []) as Array<{ id: string }>).map((r) => r.id)
  }

  // 3. Reconstituer la synthèse et les recommandations liées aux vrais IDs insérés
  const mappedRecommendations = (report.problems ?? []).map((problem, pIdx) => {
    const linkedIds = (quoteIndexByProblem[pIdx] ?? []).map((idx) => insertedIds[idx]).filter(Boolean)
    return {
      title: problem.title,
      action: problem.action,
      theme: problem.theme,
      rationale: problem.rationale,
      priority: problem.priority,
      confidence: problem.confidence,
      uncertainty: 'Échantillon issu des avis publics récents.',
      feedback_ids: linkedIds.length > 0 ? linkedIds : insertedIds.slice(0, 2),
    }
  })

  const mappedThemes = (report.themes ?? []).map((t) => ({
    name: t.name,
    count: t.mentions,
    insight: t.insight,
    feedback_ids: insertedIds.slice(0, Math.min(insertedIds.length, t.mentions)),
  }))

  const { data: savedSynthesis } = await admin
    .from('feedback_syntheses')
    .insert({
      user_id: user.id,
      site_id: createdSite.id,
      title: report.title,
      summary: report.summary,
      feedback_ids: insertedIds,
      themes: mappedThemes,
      recommendations: mappedRecommendations,
      model: report.model,
    })
    .select('id')
    .single()

  if (savedSynthesis?.id && mappedRecommendations.length > 0) {
    await persistRecommendations(
      admin,
      user.id,
      createdSite.id,
      savedSynthesis.id,
      { title: report.title, summary: report.summary, themes: mappedThemes, recommendations: mappedRecommendations },
      Math.max(insertedIds.length, report.reviewCount),
      { supersedeOthers: true },
    )
  }

  return NextResponse.json({ site: createdSite, imported: insertedIds.length })
}

