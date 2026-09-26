'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  HomeIcon,
  ChevronRightIcon,
  BellIcon,
  Bars3Icon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog8ToothIcon,
} from '@heroicons/react/24/outline'
import { AnimatedThemeToggle } from '@/components/ui/animated-theme-toggle'
import { getSupabaseBrowserClient as createClient } from '@/lib/supabase/client'

interface HeaderProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onOpenNotifications?: () => void
  unreadNotificationsCount?: number
}

function getBreadcrumb(pathname: string) {
  if (pathname === '/dashboard') return { title: 'Overview', parent: null }
  if (pathname === '/dashboard/sites') return { title: 'Sites', parent: null }
  if (pathname.startsWith('/dashboard/sites/')) return { title: 'Workspace Site', parent: { label: 'Sites', href: '/dashboard/sites' } }
  if (pathname === '/dashboard/scans') return { title: 'Scans', parent: null }
  if (pathname === '/dashboard/bugs') return { title: 'Bugs', parent: null }
  if (pathname === '/dashboard/settings') return { title: 'Settings', parent: null }
  return { title: 'Dashboard', parent: null }
}

export function Header({
  isCollapsed = false,
  onToggleCollapse,
  onOpenNotifications,
  unreadNotificationsCount = 2,
}: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const breadcrumb = getBreadcrumb(pathname || '')
  
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data && data.user) {
        setUserEmail(data.user.email ?? null)
      }
    })

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200/70 bg-white/95 px-5 md:px-7 backdrop-blur-md dark:border-white/[0.08] dark:bg-black/90 transition-colors">
      {/* ─── LEFT: Collapse Toggle + Breadcrumb (House > [Page Encadrée]) ─── */}
      <div className="flex items-center gap-3">
        {/* Sidebar Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 border border-gray-200/90 text-gray-500 hover:text-gray-900 hover:bg-gray-100 hover:border-gray-300 shadow-2xs transition-all cursor-pointer dark:bg-[#16181E] dark:border-white/[0.08] dark:text-zinc-400 dark:hover:text-white dark:hover:bg-[#1E212A] dark:hover:border-white/20"
          >
            <Bars3Icon className="h-4 w-4" />
          </button>
        )}

        {/* Separator / Spacer */}
        <div className="h-4 w-px bg-gray-200 dark:bg-zinc-800 hidden sm:block" />

        {/* Breadcrumb with House Icon & Encadrement */}
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs">
          <Link
            href="/dashboard"
            title="Accueil / Overview"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors dark:text-zinc-500 dark:hover:text-white dark:hover:bg-white/[0.06]"
          >
            <HomeIcon className="h-4 w-4" />
          </Link>

          <ChevronRightIcon className="h-3 w-3 text-gray-300 dark:text-zinc-600 stroke-[2]" />

          {breadcrumb.parent && (
            <>
              <Link
                href={breadcrumb.parent.href}
                className="text-gray-500 hover:text-gray-900 font-medium transition-colors dark:text-zinc-400 dark:hover:text-white"
              >
                {breadcrumb.parent.label}
              </Link>
              <ChevronRightIcon className="h-3 w-3 text-gray-300 dark:text-zinc-600 stroke-[2]" />
            </>
          )}

          {/* Slightly framed / légèrement encadré current page */}
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200/90 text-xs font-semibold text-gray-900 shadow-2xs dark:bg-[#16181E] dark:border-white/[0.08] dark:text-zinc-100">
            {breadcrumb.title}
          </span>
        </nav>
      </div>

      {/* ─── RIGHT: Theme Toggle + Notifications + User Avatar Dropdown ─────── */}
      <div className="flex items-center gap-3">
        {/* 21st.dev Animated Theme Switcher */}
        <AnimatedThemeToggle />

        {/* Refresh Button */}
        <button
          type="button"
          onClick={() => {
            router.refresh()
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('app:refresh'))
            }
          }}
          aria-label="Actualiser les données"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-gray-200/90 text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 shadow-2xs transition-all cursor-pointer dark:bg-[#16181E] dark:border-white/[0.08] dark:text-zinc-300 dark:hover:text-white dark:hover:border-white/20 dark:hover:bg-[#1E212A]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="Ouvrir le panneau de notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-gray-200/90 text-gray-600 hover:text-gray-900 hover:border-gray-300 shadow-2xs transition-all cursor-pointer dark:bg-[#16181E] dark:border-white/[0.08] dark:text-zinc-300 dark:hover:text-white dark:hover:border-white/20"
        >
          <BellIcon className="h-4 w-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-sm bg-[#ee6018]" />
          )}
        </button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 border border-gray-200 hover:border-[#ee6018] shadow-2xs transition-all cursor-pointer dark:bg-[#16181E] dark:border-white/[0.08] dark:hover:border-[#ee6018]"
          >
            {userEmail ? (
              <span className="text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase">
                {userEmail.charAt(0)}
              </span>
            ) : (
              <UserCircleIcon className="h-5 w-5 text-gray-500 dark:text-zinc-400" />
            )}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-lg dark:bg-[#111216] dark:border-white/[0.08]">
              <div className="px-3 py-2 border-b border-gray-100 dark:border-white/[0.06] mb-1">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {userEmail || 'Utilisateur'}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-zinc-400">Qualio Pro</p>
              </div>
              
              <Link
                href="/dashboard/settings"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/[0.04] transition-colors"
              >
                <Cog8ToothIcon className="h-3.5 w-3.5" />
                Paramètres
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
