'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function AdminSignOut() {
  async function signOut() {
    await getSupabaseBrowserClient().auth.signOut({ scope: 'local' })
    await fetch('/api/auth/signout', { method: 'POST' }).catch(() => undefined)
    window.location.replace('/admin/login')
  }

  return <button type="button" onClick={() => void signOut()} className="min-h-11 rounded-lg border border-white/15 px-4 text-sm font-semibold text-zinc-200 hover:bg-white/[0.08]">Se déconnecter</button>
}
