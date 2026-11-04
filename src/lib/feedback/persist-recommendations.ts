import type { FeedbackSynthesis } from '@/lib/feedback/ai'

function fingerprint(title: string, action: string) {
  return `${title} ${action}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 18)
    .join('-')
}

/**
 * `supersedeOthers` : une synthèse complète (tous les avis récents) remplace les recommandations encore « à décider » qu'elle ne
 * reproduit plus. À ne PAS activer pour la synthèse hebdomadaire, qui n'analyse que les nouveaux avis.
 */
export async function persistRecommendations(
  supabase: any,
  userId: string,
  siteId: string,
  synthesisId: string,
  synthesis: FeedbackSynthesis | null,
  totalFeedback: number,
  options: { supersedeOthers?: boolean } = {},
) {
  if (!synthesis?.recommendations.length) return
  const denominator = Math.max(1, totalFeedback)
  const keptKeys: string[] = []
  for (const recommendation of synthesis.recommendations) {
    const key = fingerprint(recommendation.title, recommendation.action)
    keptKeys.push(key)
    const rationale = `${recommendation.rationale || 'Signal relevé dans les avis.'} Signal observé dans ${recommendation.feedback_ids.length} avis sur ${denominator} (${Math.round((recommendation.feedback_ids.length / denominator) * 100)} %).`
    const { data: existing } = await supabase
      .from('feedback_recommendations')
      .select('id, status, baseline_count')
      .eq('user_id', userId)
      .eq('site_id', siteId)
      .eq('fingerprint', key)
      .maybeSingle()
    if (existing?.status === 'dismissed' && (existing.baseline_count ?? 0) * 2 > recommendation.feedback_ids.length) continue
    const { count: themeCount } = await supabase
      .from('feedback_items')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', siteId)
      .eq('theme', recommendation.theme)
    const shouldReopen =
      existing?.status === 'superseded' ||
      (existing?.status === 'dismissed' && (existing.baseline_count ?? 0) * 2 <= (themeCount ?? recommendation.feedback_ids.length))
    const payload = {
      user_id: userId,
      site_id: siteId,
      synthesis_id: synthesisId,
      title: recommendation.title,
      action: recommendation.action,
      theme: recommendation.theme,
      description: `${recommendation.action}\n\nPourquoi : ${rationale}`,
      rationale,
      priority: recommendation.priority,
      confidence: recommendation.confidence,
      uncertainty: recommendation.uncertainty,
      feedback_ids: recommendation.feedback_ids,
      fingerprint: key,
      baseline_count: existing?.baseline_count ?? themeCount ?? recommendation.feedback_ids.length,
      ...(shouldReopen ? { status: 'open', decided_at: null, done_at: null, resolved_at: null } : {}),
    }
    if (existing?.id) {
      const { error } = await supabase.from('feedback_recommendations').update(payload).eq('id', existing.id).eq('user_id', userId)
      if (error) throw error
    } else {
      const { error } = await supabase.from('feedback_recommendations').insert(payload)
      if (error) throw error
    }
  }
  const safeKeys = keptKeys.filter((key) => /^[a-z0-9-]+$/.test(key))
  if (options.supersedeOthers && safeKeys.length > 0) {
    // Non bloquant : si la migration du statut « superseded » n'est pas appliquée, la synthèse reste valide.
    const { error } = await supabase
      .from('feedback_recommendations')
      .update({ status: 'superseded' })
      .eq('user_id', userId)
      .eq('site_id', siteId)
      .eq('status', 'open')
      .not('fingerprint', 'in', `(${safeKeys.join(',')})`)
    if (error) console.error('[Feedback synthesis] superseding old recommendations failed', error.message)
  }
}

