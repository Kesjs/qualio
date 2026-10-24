'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { BTN_SECONDARY } from '@/components/admin/ui'

export function AdminSignOut({ compact = false }: { compact?: boolean }) {
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    await getSupabaseBrowserClient().auth.signOut({ scope: 'local' })
    await fetch('/api/auth/signout', { method: 'POST' }).catch(() => undefined)
    window.location.replace('/admin/login')
  }

  return <button type="button" disabled={busy} aria-busy={busy} aria-label={compact ? 'Se déconnecter' : undefined} title={compact ? 'Se déconnecter' : undefined} onClick={() => void signOut()} className={`${BTN_SECONDARY} ${compact ? 'w-10 justify-center px-0' : 'w-full'}`}>{compact ? <LogOut size={17} aria-hidden="true" /> : busy ? 'Déconnexion…' : 'Se déconnecter'}</button>
}
