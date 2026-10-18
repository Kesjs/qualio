import type { PlanId } from '@/lib/billing/plans'
import { computeEffect, EFFECT_WINDOW_MS, lockedEffect, type Effect } from '@/lib/feedback/effect'

type DecidedRecommendation = { status: string; theme?: string | null; decided_at?: string | null }

/**
 * Ajoute l'effet (avis sur le thème 14 jours avant / 14 jours après la décision) aux recommandations acceptées ou faites.
 * Gratuit : on indique seulement que l'effet existe (« mesuré avec Pro »). Utilisé par l'API et par l'email du lundi.
 */
export async function attachEffects<T extends DecidedRecommendation>(client: any, input: { userId: string; siteId: string; plan: PlanId; recommendations: T[] }): Promise<Array<T & { effect?: Effect }>> {
  const { userId, siteId, plan } = input
  const countTheme = async (theme: string, from: string, to: string) => {
    const { count } = await client
      .from('feedback_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('site_id', siteId)
      .eq('theme', theme)
      .not('status', 'in', '(archived,locked)')
      .gte('created_at', from)
      .lt('created_at', to)
    return (count ?? 0) as number
  }
  return Promise.all(input.recommendations.map(async (recommendation) => {
    if (!['accepted', 'done'].includes(recommendation.status) || !recommendation.theme || !recommendation.decided_at) return recommendation
    if (plan === 'free') return { ...recommendation, effect: lockedEffect() }
    const decidedAt = recommendation.decided_at
    const decided = Date.parse(decidedAt)
    const beforeCount = await countTheme(recommendation.theme, new Date(decided - EFFECT_WINDOW_MS).toISOString(), decidedAt)
    const afterCount = await countTheme(recommendation.theme, decidedAt, new Date(Math.min(decided + EFFECT_WINDOW_MS, Date.now())).toISOString())
    return { ...recommendation, effect: computeEffect({ beforeCount, afterCount, decidedAt }) }
  }))
}
