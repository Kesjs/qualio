import type { PlanId } from '@/lib/billing/plans'
import { appOrigin, resolveRecipient, sendQualioEmail } from '@/lib/email/send'
import { paymentFailedEmail, subscriptionEndedEmail, upgradeConfirmedEmail, limitReachedEmail } from '@/lib/email/templates'

const LABELS: Record<string, string> = { free: 'Gratuit', pro: 'Pro', agency: 'Agence' }
const planLabel = (plan: PlanId) => LABELS[plan] ?? plan

export async function sendUpgradeConfirmed(admin: any, userId: string, plan: PlanId, unlocked: number, eventKey: string) {
  const recipient = await resolveRecipient(admin, userId)
  if (!recipient) return
  const origin = appOrigin('https://qualio.app')
  const email = upgradeConfirmedEmail({ origin, planLabel: planLabel(plan), unlocked })
  await sendQualioEmail(admin, { userId, type: 'upgrade_confirmed', eventKey, recipient, ...email })
}

export async function sendPaymentFailed(admin: any, userId: string, plan: PlanId, eventKey: string) {
  const recipient = await resolveRecipient(admin, userId)
  if (!recipient) return
  const email = paymentFailedEmail({ origin: appOrigin('https://qualio.app'), planLabel: planLabel(plan) })
  await sendQualioEmail(admin, { userId, type: 'payment_failed', eventKey, recipient, ...email })
}

export async function sendSubscriptionEnded(admin: any, userId: string, eventKey: string) {
  const recipient = await resolveRecipient(admin, userId)
  if (!recipient) return
  const email = subscriptionEndedEmail({ origin: appOrigin('https://qualio.app') })
  await sendQualioEmail(admin, { userId, type: 'subscription_ended', eventKey, recipient, ...email })
}

/** Une fois par projet et par mois, au premier avis mis en attente. */
export async function sendLimitReached(admin: any, userId: string, siteId: string, projectName: string, limit: number) {
  const recipient = await resolveRecipient(admin, userId)
  if (!recipient) return
  const monthKey = new Date().toISOString().slice(0, 7)
  const email = limitReachedEmail({ origin: appOrigin('https://qualio.app'), projectName, limit })
  await sendQualioEmail(admin, { userId, type: 'limit_reached', eventKey: `${siteId}:${monthKey}`, recipient, ...email })
}
