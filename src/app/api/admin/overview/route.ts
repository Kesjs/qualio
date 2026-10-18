import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { requireAdminApi } from '@/lib/admin/auth'

export async function GET() {
  const user = await requireAdminApi()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const admin = getSupabaseAdminClient() as any
  const [{ count: users }, { count: sites }, { count: feedback }, { count: newFeedback }, { count: emails }, { data: latestFeedback }, { data: emailLog }, { data: recentSites }] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('sites').select('id', { count: 'exact', head: true }),
    admin.from('product_feedback').select('id', { count: 'exact', head: true }),
    admin.from('product_feedback').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    admin.from('email_log').select('id', { count: 'exact', head: true }).in('event_type', ['welcome', 'activation_nudge', 'feedback_request']),
    admin.from('product_feedback').select('id, category, message, status, priority, allow_contact, allow_public_testimonial, created_at, user_id').order('created_at', { ascending: false }).limit(50),
    admin.from('email_log').select('id, event_type, email, status, created_at').order('created_at', { ascending: false }).limit(12),
    admin.from('sites').select('id, name, url, environment, created_at, user_id').order('created_at', { ascending: false }).limit(12),
  ])
  const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 20 })
  const recentUsers = (authUsers?.users ?? []).sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 12).map((user: any) => ({ id: user.id, email: user.email, created_at: user.created_at, role: user.app_metadata?.role ?? 'utilisateur' }))
  return NextResponse.json({ metrics: { users: users ?? 0, sites: sites ?? 0, feedback: feedback ?? 0, newFeedback: newFeedback ?? 0, emails: emails ?? 0 }, latestFeedback: latestFeedback ?? [], recentUsers, emailLog: emailLog ?? [], recentSites: recentSites ?? [] })
}
