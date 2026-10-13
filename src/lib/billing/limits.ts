import { BILLING_PLANS, nextSynthesisAt, resolvePlan, type PlanId } from '@/lib/billing/plans'
import { writableSiteIds, type SiteRow } from '@/lib/billing/writable'

/** Plan appliqué à un utilisateur (client admin ou client de session). */
export async function getUserPlan(client: any, userId: string): Promise<PlanId> {
  const { data } = await client.from('billing_subscriptions').select('plan, status, source, current_period_end').eq('user_id', userId).maybeSingle()
  return resolvePlan(data)
}

/** Avis conservés (non archivés) dans un projet, comparés à la limite du plan. */
export async function getFeedbackCapacity(client: any, siteId: string, plan: PlanId) {
  const limit = BILLING_PLANS[plan].feedbackPerProject
  const { count } = await client.from('feedback_items').select('id', { count: 'exact', head: true }).eq('site_id', siteId).neq('status', 'archived')
  const used = count ?? 0
  return { limit, used, remaining: Math.max(0, limit - used) }
}

/** Dernière synthèse manuelle d'un projet (les synthèses hebdomadaires automatiques ne comptent pas). */
export async function getLastManualSynthesisAt(client: any, siteId: string): Promise<string | null> {
  const { data } = await client.from('feedback_syntheses').select('created_at').eq('site_id', siteId).is('week_key', null).order('created_at', { ascending: false }).limit(1).maybeSingle()
  return data?.created_at ?? null
}

export async function getSynthesisAvailability(client: any, siteId: string, plan: PlanId) {
  const lastAt = await getLastManualSynthesisAt(client, siteId)
  return { lastAt, nextAvailableAt: nextSynthesisAt(plan, lastAt) }
}

export const READ_ONLY_MESSAGE = 'Ce projet est en lecture seule : votre plan Gratuit inclut 1 projet actif. Passez à Pro pour le réactiver.'

/** Identifiants des projets modifiables pour un plan (doc 2.3, lecture seule au-delà de la limite). */
export async function getWritableSiteIds(client: any, userId: string, plan: PlanId): Promise<string[]> {
  const { data } = await client.from('sites').select('id, created_at').eq('user_id', userId)
  return writableSiteIds((data ?? []) as SiteRow[], BILLING_PLANS[plan].projects)
}

export async function isSiteWritable(client: any, userId: string, siteId: string, plan: PlanId): Promise<boolean> {
  return (await getWritableSiteIds(client, userId, plan)).includes(siteId)
}
