'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { focusRing, pressable, secondaryButton } from '@/components/dashboard/ui'

/** Modal de confirmation de déconnexion, partagé par les accès dashboard. */
export function LogoutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false)
  const [mounted, setMounted] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onClose])

  async function confirm() {
    setBusy(true)
    try { await getSupabaseBrowserClient().auth.signOut() } finally { window.location.href = '/login' }
  }

  if (!open || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 motion-safe:animate-[qualio-fade_150ms_ease-out]" onClick={() => { if (!busy) onClose() }} aria-hidden />
      <div role="alertdialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-description" className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl motion-safe:animate-[qualio-fade_150ms_ease-out] dark:border-white/[0.08] dark:bg-[#111216]">
        <h2 id="logout-title" className="text-base font-semibold text-gray-950 dark:text-white">Se déconnecter ?</h2>
        <p id="logout-description" className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-400">Vous devrez vous reconnecter pour accéder de nouveau à votre espace. Vos projets et vos avis sont conservés.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button ref={cancelRef} type="button" onClick={onClose} disabled={busy} className={secondaryButton}>Annuler</button>
          <button type="button" onClick={() => void confirm()} disabled={busy} className={`inline-flex min-h-11 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 ${pressable} ${focusRing}`}>{busy ? 'Déconnexion…' : 'Se déconnecter'}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
