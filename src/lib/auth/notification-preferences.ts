import type { User } from '@supabase/supabase-js'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export async function syncWeeklyDigestPreference(user: User) {
  const metadataValue = user.user_metadata?.weekly_digest_consent
  const admin = getSupabaseAdminClient() as any
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
