import { getSupabaseAdminClient } from '@/lib/supabase/server'

export type AdminFeedback = { id: string; category: string; message: string; status: string; priority: string; allow_contact: boolean; created_at: string }
export type AdminUser = { id: string; email?: string; created_at: string; role: string }
export type AdminSite = { id: string; name?: string; url: string; created_at: string }
export type AdminEmail = { id: string; event_type: string; email: string; status: string; created_at: string }
export type AdminData = { metrics: { users: number; sites: number; feedback: number; newFeedback: number; emails: number }; latestFeedback: AdminFeedback[]; recentUsers: AdminUser[]; emailLog: AdminEmail[]; recentSites: AdminSite[] }

export async function getAdminData(): Promise<AdminData> {
  const admin = getSupabaseAdminClient() as any
  const [{ count: users }, { count: sites }, { count: feedback }, { count: newFeedback }, { count: emails }, { data: latestFeedback }, { data: emailLog }, { data: recentSites }] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('sites').select('id', { count: 'exact', head: true }),
    admin.from('product_feedback').select('id', { count: 'exact', head: true }),
    admin.from('product_feedback').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    admin.from('email_log').select('id', { count: 'exact', head: true }).in('event_type', ['welcome', 'activation_nudge', 'feedback_request']),
    admin.from('product_feedback').select('id, category, message, status, priority, allow_contact, created_at').order('created_at', { ascending: false }).limit(100),
    admin.from('email_log').select('id, event_type, email, status, created_at').order('created_at', { ascending: false }).limit(100),
    admin.from('sites').select('id, name, url, created_at').order('created_at', { ascending: false }).limit(100),
  ])
  const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 })
  const recentUsers = (authUsers?.users ?? []).sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at))).map((user: any) => ({ id: user.id, email: user.email, created_at: user.created_at, role: user.app_metadata?.role ?? 'utilisateur' }))
  return { metrics: { users: users ?? 0, sites: sites ?? 0, feedback: feedback ?? 0, newFeedback: newFeedback ?? 0, emails: emails ?? 0 }, latestFeedback: latestFeedback ?? [], recentUsers, emailLog: emailLog ?? [], recentSites: recentSites ?? [] }
}
