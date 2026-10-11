import type { User } from '@supabase/supabase-js'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { PRO_TRIAL_DAYS } from '@/lib/billing/plans'
import { recordProductEvent } from '@/lib/analytics/product-events'

async function ensureTrialSubscription(userId: string) {
  const admin = getSupabaseAdminClient() as any
  const { data: existing, error: readError } = await admin
    .from('billing_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  if (readError) throw readError
  if (existing) return false

  const trialEndsAt = new Date(Date.now() + PRO_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await admin.from('billing_subscriptions').insert({
    user_id: userId,
    stripe_customer_id: `trial_${userId}`,
    plan: 'pro',
    status: 'trialing',
    source: 'trial',
    trial_ends_at: trialEndsAt,
  })
  if (error && error.code !== '23505') throw error
  if (!error) void recordProductEvent(admin, userId, 'trial_started', `trial:${userId}`, { source: 'signup', trial_days: PRO_TRIAL_DAYS })
  return !error
}

export async function syncWeeklyDigestPreference(user: User) {
  const metadataValue = user.user_metadata?.weekly_digest_consent
  const admin = getSupabaseAdminClient() as any
  await ensureTrialSubscription(user.id)
  const { data: existing, error: readError } = await admin
    .from('notification_preferences')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (readError) throw readError

  if (typeof metadataValue !== 'boolean') {
    if (!existing) {
      const { error } = await admin.from('notification_preferences').insert({ user_id: user.id, weekly_digest: false })
      if (error) throw error
    }
    return
  }

  const { error } = await admin.from('notification_preferences').upsert({
    user_id: user.id,
    weekly_digest: metadataValue,
    consented_at: metadataValue ? new Date().toISOString() : null,
    consent_source: metadataValue ? 'signup' : null,
    unsubscribed_at: metadataValue ? null : undefined,
  }, { onConflict: 'user_id' })
  if (error) throw error
}
