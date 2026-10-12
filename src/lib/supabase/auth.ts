import { getSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Authentification rapide : vérifie le JWT localement quand c'est possible
 * (getClaims) au lieu d'un aller-retour réseau vers Supabase à chaque appel.
 * Retombe sur getUser() si les claims ne sont pas disponibles.
 */
export async function getAuthedContext() {
  const supabase = await getSupabaseServerClient()
  try {
    const { data } = await supabase.auth.getClaims()
    const userId = data?.claims?.sub
    if (userId) return { supabase, userId }
  } catch {}
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, userId: user?.id ?? null }
}
