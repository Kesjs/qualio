'use client'

import { useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { BTN_SECONDARY } from '@/components/admin/ui'

export function AdminSignOut() {
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    await getSupabaseBrowserClient().auth.signOut({ scope: 'local' })
    await fetch('/api/auth/signout', { method: 'POST' }).catch(() => undefined)
    window.location.replace('/admin/login')
  }

  return <button type="button" disabled={busy} aria-busy={busy} onClick={() => void signOut()} className={BTN_SECONDARY}>{busy ? 'Déconnexion…' : 'Se déconnecter'}</button>
}
