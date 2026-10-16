import { redirect } from 'next/navigation'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'

function allowlist() {
  return new Set((process.env.ADMIN_EMAILS ?? '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean))
}

export function isAllowedAdmin(user: { email?: string | null; app_metadata?: Record<string, unknown> | null } | null) {
  return Boolean(user && (user.app_metadata?.role === 'admin' || (user.email && allowlist().has(user.email.toLowerCase()))))
}

export async function getAdminContext() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/admin')

  // App metadata is embedded in the access token. After promoting an existing
  // user, that token may remain stale until it expires. Re-read the authoritative
  // user record server-side so admin access takes effect immediately.
  let authoritativeUser = user
  try {
    const { data } = await getSupabaseAdminClient().auth.admin.getUserById(user.id)
    if (data.user) authoritativeUser = data.user
  } catch {
    // Keep the normal token/allowlist path available if the service key is absent.
  }
  const allowed = isAllowedAdmin(authoritativeUser)
  if (!allowed) redirect('/login?error=not_admin&redirectTo=/admin')
  return { user: authoritativeUser, supabase }
}

export async function requireAdminApi() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  try {
    const { data } = await getSupabaseAdminClient().auth.admin.getUserById(user.id)
    if (data.user) return isAllowedAdmin(data.user) ? data.user : null
  } catch {}
  return isAllowedAdmin(user) ? user : null
}
