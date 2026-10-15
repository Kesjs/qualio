import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/admin/auth'

export async function GET() {
  const user = await requireAdminApi()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = getSupabaseAdminClient() as any
  const [{ count: users }, { count: sites }, { count: feedback }, { count: newFeedback }, { count: emails }, { data: latestFeedback }] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('sites').select('id', { count: 'exact', head: true }),
    admin.from('product_feedback').select('id', { count: 'exact', head: true }),
    admin.from('product_feedback').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    admin.from('email_log').select('id', { count: 'exact', head: true }).in('event_type', ['welcome', 'activation_nudge', 'feedback_request']),
    admin.from('product_feedback').select('id, category, message, status, priority, allow_contact, allow_public_testimonial, created_at, user_id').order('created_at', { ascending: false }).limit(50),
  ])
  return NextResponse.json({ metrics: { users: users ?? 0, sites: sites ?? 0, feedback: feedback ?? 0, newFeedback: newFeedback ?? 0, emails: emails ?? 0 }, latestFeedback: latestFeedback ?? [] })
}
