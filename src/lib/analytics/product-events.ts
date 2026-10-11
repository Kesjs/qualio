import type { SupabaseClient } from '@supabase/supabase-js'

export async function recordProductEvent(admin: SupabaseClient, userId: string, eventType: string, eventKey: string, metadata: Record<string, unknown> = {}) {
  const { error } = await admin.from('product_events').insert({ user_id: userId, event_type: eventType, event_key: eventKey, metadata })
  if (error) console.error('[Product event] write failed', error.message)
}
