'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRightOnRectangleIcon, ChevronUpDownIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { NAV_ITEMS, isNavActive } from '@/components/dashboard/nav'
import { UpgradeButton, useFreePlanUpgrade } from '@/components/dashboard/PlanUsage'

interface SidebarProps {
  isCollapsed?: boolean
}

/** Barre latérale à 4 entrées (doc 3.2). Le sélecteur de projet est maintenant dans l'en-tête. */
export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [userName, setUserName] = useState('Utilisateur')
  const [userEmail, setUserEmail] = useState('')
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getSupabaseBrowserClient().auth.getUser().then(({ data: { user } }) => {
      if (!user?.email) return
      setUserEmail(user.email)
      const rawName = user.user_metadata?.full_name || user.email.split('@')[0]
      setUserName(String(rawName).charAt(0).toUpperCase() + String(rawName).slice(1))
    }).catch(() => undefined)
  }, [])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const initials = userName.slice(0, 2).toUpperCase()
  const upgrade = useFreePlanUpgrade()

  return (
    <aside className={`relative flex h-full shrink-0 flex-col justify-between overflow-visible rounded-2xl border border-gray-200/80 bg-[#F8F9FA] transition-all dark:border-white/[0.08] dark:bg-[#111216] ${isCollapsed ? 'w-20' : 'w-72'}`}>
      <div>
        <div className="flex h-16 items-center border-b border-gray-200/60 px-3 dark:border-white/[0.08]">
          <Link href="/dashboard" className="group flex w-full items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200/90 bg-white p-1.5 shadow-2xs transition-colors dark:border-white/[0.1] dark:bg-black">
              <img src="/qualio-logo/export/mark/monogram-orange.svg" alt="Qualio" className="h-full w-full object-contain" />
            </div>
            {!isCollapsed && <div className="flex min-w-0 flex-col"><span className="truncate text-sm font-bold tracking-tight text-gray-900 dark:text-white">Qualio</span></div>}
          </Link>
        </div>

        <nav aria-label="Navigation principale" className="space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(pathname, item)
            const Icon = item.icon
            const iconMotion = item.href === '/dashboard'
              ? 'sidebar-icon-calendar'
              : item.href === '/dashboard/feedback'
                ? 'sidebar-icon-chat'
                : item.href === '/dashboard/collection'
                  ? 'sidebar-icon-plus'
                  : item.href === '/dashboard/feedback-produit'
                    ? 'sidebar-icon-sparkles'
                    : 'sidebar-icon-settings'
            return (
              <Link key={item.href} href={item.href} prefetch aria-current={active ? 'page' : undefined} title={isCollapsed ? item.label : undefined} className={`group relative flex min-h-11 items-center rounded-md transition-colors ${isCollapsed ? 'justify-center px-2.5' : 'gap-3.5 px-3'} ${active ? 'border border-gray-200/90 bg-white font-semibold text-gray-900 shadow-2xs dark:border-white/[0.12] dark:bg-[#1B1E26] dark:text-white' : 'border border-transparent font-medium text-gray-500 hover:bg-gray-200/50 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-white'}`}>
                <Icon className={`h-5 w-5 shrink-0 ${iconMotion}`} />
                {!isCollapsed && <span className="truncate text-sm">{item.label}</span>}
                {isCollapsed && <span className="sr-only">{item.label}</span>}
                {active && <span className={`absolute right-2.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-[#ee6018] ${isCollapsed ? 'right-1.5' : ''}`} />}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="relative border-t border-gray-200/60 p-3 dark:border-white/[0.08]" ref={profileRef}>
        {upgrade.show && !isCollapsed && (
          <div className="mb-3 rounded-lg border border-gray-200/90 bg-white p-3 dark:border-white/[0.1] dark:bg-[#16181E]">
            <p className="text-xs font-semibold text-gray-900 dark:text-white">Plan Gratuit</p>
            <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-zinc-400">{upgrade.hint}</p>
            <UpgradeButton subtle={!upgrade.urgent} className="mt-3 w-full justify-center" />
          </div>
        )}
        {upgrade.show && isCollapsed && (
          <Link href="/pricing" title="Passer à Pro" aria-label="Passer à Pro" className={`mb-3 flex min-h-11 w-full items-center justify-center rounded-md border text-xs font-bold ${upgrade.urgent ? 'border-transparent bg-[#c2410c] text-white' : 'border-gray-200/90 bg-white text-gray-700 dark:border-white/[0.1] dark:bg-[#16181E] dark:text-zinc-300'}`}>Pro</Link>
        )}
        {isProfileMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 z-50 mb-2 rounded-lg border border-gray-200/90 bg-white p-1.5 shadow-xl dark:border-white/[0.1] dark:bg-[#16181E]">
            <Link href="/dashboard/settings" onClick={() => setIsProfileMenuOpen(false)} className="flex min-h-11 items-center gap-2 rounded-md px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-white/[0.06]"><Cog6ToothIcon className="h-4 w-4" /> Réglages</Link>
            <button type="button" onClick={async () => { await getSupabaseBrowserClient().auth.signOut(); window.location.href = '/login' }} className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"><ArrowRightOnRectangleIcon className="h-4 w-4" /> Déconnexion</button>
          </div>
        )}
        <button type="button" onClick={() => setIsProfileMenuOpen((open) => !open)} aria-expanded={isProfileMenuOpen} aria-label="Ouvrir le menu du compte" className={`flex min-h-11 w-full items-center rounded-md border border-gray-200/80 bg-white p-1.5 text-left shadow-2xs hover:border-gray-300 dark:border-white/[0.08] dark:bg-[#16181E] dark:hover:border-white/20 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#c2410c] text-xs font-bold text-white">{initials}</span>
            {!isCollapsed && <span className="flex min-w-0 flex-col"><span className="truncate text-xs font-bold text-gray-900 dark:text-white">{userName}</span><span className="truncate font-mono text-[10px] text-gray-500 dark:text-zinc-400">{userEmail}</span></span>}
          </span>
          {!isCollapsed && <ChevronUpDownIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-zinc-500" />}
        </button>
      </div>
    </aside>
  )
}
