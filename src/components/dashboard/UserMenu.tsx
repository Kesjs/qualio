'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  UserCircleIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  CommandLineIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function UserMenu() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [userName, setUserName] = useState('Utilisateur')
  const [userEmail, setUserEmail] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch real authenticated user
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          setUserEmail(user.email)
          const namePart = user.user_metadata?.full_name || user.email.split('@')[0]
          setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1))
        }
      } catch {
        // Fallback already set
      }
    }
    loadUser()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
    } finally {
      router.push('/login')
    }
  }

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      {/* ─── Avatar Button ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu du profil utilisateur"
        className="flex items-center gap-2 p-1 rounded-lg border border-gray-200/90 bg-white hover:bg-gray-50 hover:border-gray-300 dark:bg-[#16181E] dark:border-white/[0.08] dark:hover:bg-[#1E212A] dark:hover:border-white/20 transition-all cursor-pointer shadow-2xs group"
      >
        {/* Crisp Squircle Avatar (No round pill) */}
        <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-[#ee6018] text-white text-xs font-bold tracking-wider shadow-2xs font-mono">
          <span>{initials}</span>
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-sm bg-emerald-500 ring-2 ring-white dark:ring-[#16181E]" />
        </div>

        {/* User name & chevron (hidden on mobile) */}
        <div className="hidden lg:flex flex-col text-left pr-1 min-w-0">
          <span className="text-xs font-semibold text-gray-900 dark:text-white leading-tight truncate max-w-[100px]">
            {userName}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-zinc-400 font-mono leading-none">
            Compte
          </span>
        </div>

        <ChevronDownIcon
          className={`h-3 w-3 text-gray-400 dark:text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-gray-700 dark:text-white' : ''
          }`}
        />
      </button>

      {/* ─── Dropdown Menu ──────────────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#16181E] p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Profile Card */}
          <div className="p-2.5 border-b border-gray-100 dark:border-white/[0.06] mb-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#ee6018] text-white text-xs font-bold font-mono">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {userName}
                  </p>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-zinc-400 truncate font-mono">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-0.5">
            <Link
              href="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-md transition-colors"
            >
              <Cog6ToothIcon className="h-4 w-4 text-gray-400 dark:text-zinc-400" />
              <span>Paramètres du compte</span>
            </Link>

            <Link
              href="/dashboard/sites"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-md transition-colors"
            >
              <GlobeAltIcon className="h-4 w-4 text-gray-400 dark:text-zinc-400" />
              <span>Gérer les sites web</span>
            </Link>

            <Link
              href="/dashboard/scans"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-md transition-colors"
            >
              <ClockIcon className="h-4 w-4 text-gray-400 dark:text-zinc-400" />
              <span>Historique des scans</span>
            </Link>
          </div>

          {/* Quick Info & Shortcut */}
          <div className="my-1 border-t border-gray-100 dark:border-white/[0.06] pt-1 space-y-0.5">
            <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] text-gray-400 dark:text-zinc-400 font-mono">
              <span className="flex items-center gap-1.5">
                <CommandLineIcon className="h-3.5 w-3.5" />
                <span>Recherche globale</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-[10px]">
                ⌘K
              </kbd>
            </div>

            <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] text-gray-400 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                <span>Playwright Engine</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                v1.63 Actif
              </span>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="border-t border-gray-100 dark:border-white/[0.06] pt-1 mt-1">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors cursor-pointer"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
