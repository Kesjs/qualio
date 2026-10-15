import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'

function allowlist() {
  return new Set((process.env.ADMIN_EMAILS ?? '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean))
}

export function isAllowedAdmin(user: { email?: string | null; app_metadata?: Record<string, unknown> | null } | null) {
  return Boolean(user && (user.app_metadata?.role === 'admin' || (user.email && allowlist().has(user.email.toLowerCase()))))
}

export async function getAdminContext() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const allowed = isAllowedAdmin(user)
  if (!user) redirect('/login?redirectTo=/admin')
  if (!allowed) redirect('/login?error=not_admin&redirectTo=/admin')
  return { user, supabase }
}

export async function requireAdminApi() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const allowed = isAllowedAdmin(user)
  return allowed ? user : null
}
