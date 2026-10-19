import { BILLING_PLANS, type PlanId } from '@/lib/billing/plans'
import { getFeedbackCapacity } from '@/lib/billing/limits'
import { writableSiteIds } from '@/lib/billing/writable'
import { classifyAndSaveFeedback } from '@/lib/feedback/classify'

/**
 * Passage à un plan payant : les avis reçus en attente (statut « locked ») deviennent analysables,
 * du plus ancien au plus récent, dans la limite de la capacité du plan. Idempotent.
 */
export async function unlockPendingFeedback(admin: any, userId: string, plan: PlanId) {
  if (plan === 'free') return 0
  const { data: sites } = await admin.from('sites').select('id, created_at').eq('user_id', userId)
  const writable = writableSiteIds((sites ?? []) as Array<{ id: string; created_at: string }>, BILLING_PLANS[plan].projects)
  let unlocked = 0
  for (const siteId of writable) {
    const capacity = await getFeedbackCapacity(admin, siteId, plan)
    if (capacity.remaining < 1) continue
    const { data: locked } = await admin.from('feedback_items').select('id, content').eq('site_id', siteId).eq('status', 'locked').order('created_at', { ascending: true }).limit(capacity.remaining)
    if (!locked?.length) continue
    const { error } = await admin.from('feedback_items').update({ status: 'open' }).in('id', locked.map((item: { id: string }) => item.id))
    if (error) { console.error('[Unlock feedback] update failed', error.message); continue }
    unlocked += locked.length
    for (const item of locked as Array<{ id: string; content: string }>) {
      try { await classifyAndSaveFeedback(admin, item.id, siteId, item.content) } catch (classificationError) { console.error('[Unlock feedback] classification failed', classificationError) }
    }
  }
  return unlocked
}
