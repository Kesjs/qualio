'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRightIcon, Cog6ToothIcon, HomeIcon } from '@heroicons/react/24/outline'
import { AnimatedThemeToggle } from '@/components/ui/animated-theme-toggle'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface HeaderProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

function getBreadcrumb(pathname: string) {
  if (pathname === '/dashboard') return 'Vue d’ensemble'
  if (pathname === '/dashboard/feedback') return 'Avis'
  if (pathname === '/dashboard/analysis') return 'Thèmes'
  if (pathname === '/dashboard/syntheses') return 'Synthèses'
  if (pathname === '/dashboard/recommendations') return 'Recommandations'
  if (pathname === '/dashboard/collection') return 'Collecte'
  if (pathname === '/dashboard/settings') return 'Réglages'
  return 'Qualio'
}

export function Header({ isCollapsed = false, onToggleCollapse }: HeaderProps) {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getSupabaseBrowserClient().auth.getUser().then(({ data: { user } }) => setUserEmail(user?.email ?? null)).catch(() => undefined)
    const close = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const handleLogout = async () => {
    await getSupabaseBrowserClient().auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200/70 bg-white/95 px-5 backdrop-blur-md transition-colors dark:border-white/[0.08] dark:bg-black/90 md:px-7">
      <div className="flex items-center gap-3">
        {onToggleCollapse && <button type="button" onClick={onToggleCollapse} aria-label={isCollapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/90 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:border-white/[0.08] dark:bg-[#16181E] dark:text-zinc-400 dark:hover:text-white"><svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><rect x="3.5" y="4.5" width="17" height="15" rx="2.25" /><path strokeLinecap="round" d="M9 5v14" />{isCollapsed ? <path strokeLinecap="round" strokeLinejoin="round" d="m13 9 3 3-3 3" /> : <path strokeLinecap="round" strokeLinejoin="round" d="m16 9-3 3 3 3" />}</svg></button>}
        <div className="hidden h-4 w-px bg-gray-200 dark:bg-zinc-800 sm:block" />
        <nav aria-label="Fil d’Ariane" className="flex items-center gap-2 text-xs"><Link href="/dashboard" aria-label="Vue d’ensemble" className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-500 dark:hover:bg-white/[0.06] dark:hover:text-white"><HomeIcon className="h-4 w-4" /></Link><ChevronRightIcon className="h-3 w-3 text-gray-300 dark:text-zinc-600" /><span className="inline-flex items-center rounded-lg border border-gray-200/90 bg-gray-50 px-2.5 py-1 font-semibold text-gray-900 shadow-2xs dark:border-white/[0.08] dark:bg-[#16181E] dark:text-zinc-100">{getBreadcrumb(pathname)}</span></nav>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <AnimatedThemeToggle />
        <button type="button" onClick={() => { router.refresh(); window.dispatchEvent(new CustomEvent('app:refresh')) }} aria-label="Actualiser les données" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/90 bg-white text-gray-600 shadow-2xs hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:border-white/[0.08] dark:bg-[#16181E] dark:text-zinc-300 dark:hover:border-white/20 dark:hover:bg-[#1E212A] dark:hover:text-white"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0013.803-3.7l3.181 3.182m0-4.991v4.99" /></svg></button>
        <div className="relative" ref={dropdownRef}>
          <button type="button" onClick={() => setIsDropdownOpen((open) => !open)} aria-label="Ouvrir le menu du compte" className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-bold uppercase text-gray-600 shadow-2xs hover:border-[#ee6018] dark:border-white/[0.08] dark:bg-[#16181E] dark:text-zinc-300">{userEmail?.charAt(0) ?? 'U'}</button>
          {isDropdownOpen && <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-lg dark:border-white/[0.08] dark:bg-[#111216]"><div className="mb-1 border-b border-gray-100 px-3 py-2 dark:border-white/[0.06]"><p className="truncate text-xs font-medium text-gray-900 dark:text-white">{userEmail || 'Utilisateur'}</p></div><Link href="/dashboard/settings" onClick={() => setIsDropdownOpen(false)} className="flex min-h-11 items-center gap-2 rounded-md px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-300 dark:hover:bg-white/[0.04] dark:hover:text-white"><Cog6ToothIcon className="h-4 w-4" /> Réglages</Link><button type="button" onClick={handleLogout} className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10">Déconnexion</button></div>}
        </div>
      </div>
    </header>
  )
}
