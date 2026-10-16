import { redirect } from 'next/navigation'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'

function allowlist() {
  return new Set((process.env.ADMIN_EMAILS ?? '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean))
}

export function isAllowedAdmin(user: { email?: string | null; app_metadata?: Record<string, unknown> | null } | null) {
  return Boolean(user && (user.app_metadata?.role === 'admin' || (user.email && allowlist().has(user.email.toLowerCase()))))
}

export async function getAuthoritativeAdminUser(user: { id: string; email?: string | null; app_metadata?: Record<string, unknown> | null }) {
  try {
    const { data } = await getSupabaseAdminClient().auth.admin.getUserById(user.id)
    const authoritativeUser = data.user ?? user
    // Keep the production email allowlist effective when the admin API response
    // does not expose the same app_metadata shape as the authenticated session.
    if (isAllowedAdmin(authoritativeUser)) return authoritativeUser
    if (user.email && allowlist().has(user.email.toLowerCase())) return user
    return authoritativeUser
  } catch {
    return user
  }
}

export async function getAdminContext() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/admin')

  // App metadata is embedded in the access token. After promoting an existing
  // user, that token may remain stale until it expires. Re-read the authoritative
  // user record server-side so admin access takes effect immediately.
  const authoritativeUser = await getAuthoritativeAdminUser(user)
  const allowed = isAllowedAdmin(authoritativeUser)
  if (!allowed) redirect('/login?error=not_admin&redirectTo=/admin')
  return { user: authoritativeUser, supabase }
}

export async function requireAdminApi() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // The layout and API must authorize the same authenticated session. This
  // also preserves an explicit production email allowlist while a refreshed
  // Supabase admin response is being reconciled.
  if (isAllowedAdmin(user)) return user
  const authoritativeUser = await getAuthoritativeAdminUser(user)
  return isAllowedAdmin(authoritativeUser) ? authoritativeUser : null
}
