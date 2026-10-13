'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRightOnRectangleIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

/** Menu du compte (initiale de l'adresse) : Réglages et Déconnexion. Partagé par l'en-tête bureau et la barre mobile. */
export function AccountMenu() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getSupabaseBrowserClient().auth.getUser().then(({ data: { user } }) => setEmail(user?.email ?? null)).catch(() => undefined)
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const logout = async () => {
    await getSupabaseBrowserClient().auth.signOut()
    router.push('/login')
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Ouvrir le menu du compte" className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-bold uppercase text-gray-600 shadow-2xs hover:border-[#ee6018] dark:border-white/[0.08] dark:bg-[#16181E] dark:text-zinc-300">{email?.charAt(0) ?? 'U'}</button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-lg dark:border-white/[0.08] dark:bg-[#111216]">
          <div className="mb-1 border-b border-gray-100 px-3 py-2 dark:border-white/[0.06]"><p className="truncate text-xs font-medium text-gray-900 dark:text-white">{email || 'Utilisateur'}</p></div>
          <Link href="/dashboard/settings" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 rounded-md px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-white"><Cog6ToothIcon className="h-4 w-4" /> Réglages</Link>
          <button type="button" onClick={logout} className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"><ArrowRightOnRectangleIcon className="h-4 w-4" /> Déconnexion</button>
        </div>
      )}
    </div>
  )
}
