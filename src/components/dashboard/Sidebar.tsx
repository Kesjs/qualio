'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  GlobeAltIcon,
  ClockIcon,
  BugAntIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  UserCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

interface SidebarProps {
  isCollapsed?: boolean
  onSearchClick?: () => void
}

const navSections = [
  {
    title: 'Navigation',
    items: [
      { label: 'Overview', href: '/dashboard', icon: HomeIcon },
      { label: 'Sites', href: '/dashboard/sites', icon: GlobeAltIcon },
      { label: 'Scans', href: '/dashboard/scans', icon: ClockIcon },
      { label: 'Bugs', href: '/dashboard/bugs', icon: BugAntIcon, badge: '3' },
    ],
  },
  {
    title: 'Système',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
    ],
  },
]

export function Sidebar({ isCollapsed = false, onSearchClick }: SidebarProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [userName, setUserName] = useState('Qualio Studio')
  const [userEmail, setUserEmail] = useState('admin@qualio.dev')

  const profileRef = useRef<HTMLDivElement>(null)

  // Fetch real user
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
      } catch (e) {
        // Fallback already set
      }
    }
    loadUser()
  }, [])

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = userName.slice(0, 2).toUpperCase()

  return (
    <aside
      className={`relative flex flex-col justify-between bg-[#F8F9FA] border-r border-gray-200/80 md:border-r-0 dark:bg-[#111216] dark:border-white/[0.08] dark:md:border-r-0 transition-all duration-300 ease-in-out shrink-0 h-full ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header with Real Qualio Monogram Logo */}
        <div className="flex h-16 items-center px-4 border-b border-gray-200/60 dark:border-white/[0.08]">
          <Link href="/dashboard" className="flex items-center gap-2.5 group w-full">
            {/* Real Qualio Monogram Mark */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-950 dark:bg-black border border-gray-200/80 dark:border-white/[0.1] p-1.5 shadow-2xs group-hover:scale-105 transition-transform">
              <img
                src="/qualio-logo/export/mark/monogram-orange.svg"
                alt="Qualio Monogram"
                className="h-full w-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-white leading-none truncate font-sans">
                  Qualio
                </span>
                <span className="text-[10px] font-mono font-medium text-gray-400 dark:text-zinc-500 mt-1 truncate">
                  QA WORKSPACE
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* ─── Search Bar IN Sidebar (Crisp Borders) ────────────────────────── */}
        <div className="px-3 pt-3.5 pb-1">
          {isCollapsed ? (
            <button
              type="button"
              onClick={onSearchClick}
              title="Rechercher (⌘K)"
              className="flex h-9 w-full items-center justify-center rounded-lg bg-white border border-gray-200/90 text-gray-400 hover:text-gray-900 hover:border-gray-300 shadow-2xs transition-all dark:bg-[#16181E] dark:border-white/[0.08] dark:text-zinc-400 dark:hover:text-white dark:hover:border-white/20"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
            </button>
          ) : (
            <div className="relative w-full">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Recherche..."
                className="w-full pl-8 pr-12 py-1.5 text-xs bg-white border border-gray-200/90 rounded-lg text-gray-900 placeholder:text-gray-400 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#ee6018] focus:border-[#ee6018] dark:bg-[#16181E] dark:border-white/[0.08] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-[#ee6018] transition-all font-sans"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200 text-[9px] font-semibold font-mono text-gray-400 dark:bg-[#111216] dark:border-white/[0.08] dark:text-zinc-500">
                <span>⌘K</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── Navigation Sections ─────────────────────────────────────────── */}
        <nav className="p-3 space-y-5">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[11px] font-medium text-gray-400 dark:text-zinc-500">
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname?.startsWith(item.href)
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      prefetch={true}
                      title={isCollapsed ? item.label : undefined}
                      className={`group relative flex items-center rounded-xl transition-all duration-150 ${
                        isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2 text-xs'
                      } ${
                        isActive
                          ? 'bg-white text-gray-900 font-semibold border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_1px_rgba(0,0,0,0.02)] dark:bg-[#16181E] dark:text-white dark:border-white/[0.1] dark:shadow-none'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 border border-transparent font-medium dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-gray-900 dark:text-white stroke-[2.2]'
                            : 'text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}

                      {!isCollapsed && item.badge && !isActive && (
                        <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-red-50 text-red-600 border border-red-200/60 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 mr-1.5">
                          {item.badge}
                        </span>
                      )}

                      {/* Signature Active State: Right vertical accent indicator (NO pill border) */}
                      {isActive && (
                        <span
                          className={`rounded-sm bg-[#ee6018] shrink-0 ${
                            isCollapsed
                              ? 'absolute right-1 top-1/2 -translate-y-1/2 w-1 h-3.5'
                              : 'absolute right-2 top-1/2 -translate-y-1/2 w-1 h-4'
                          }`}
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* ─── BOTTOM: User Profile Module with Dropdown (Nuxt-style) ────────── */}
      <div className="p-3 border-t border-gray-200/60 dark:border-white/[0.08] relative" ref={profileRef}>
        {/* Floating Dropdown Menu (Opens Above Profile) */}
        {isProfileMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-lg border border-gray-200/90 bg-white p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 dark:bg-[#16181E] dark:border-white/[0.1] dark:shadow-2xl">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-white/[0.06]">
              <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">{userName}</span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono block truncate">{userEmail}</span>
            </div>

            <div className="py-1 space-y-0.5">
              <Link
                href="/dashboard/settings"
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors"
              >
                <Cog6ToothIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                <span>Paramètres</span>
              </Link>
              <a
                href="/docs"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-white/[0.06] dark:hover:text-white transition-colors"
              >
                <DocumentTextIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                <span>Documentation</span>
                <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-auto text-gray-400 dark:text-zinc-500" />
              </a>
            </div>

            <div className="pt-1 border-t border-gray-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={async () => {
                  const supabase = getSupabaseBrowserClient()
                  await supabase.auth.signOut()
                  window.location.href = '/login'
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        )}

        {/* Profile Trigger Button */}
        <button
          type="button"
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className={`flex w-full items-center rounded-lg bg-white border border-gray-200/80 p-1.5 text-left hover:border-gray-300 shadow-2xs transition-all cursor-pointer dark:bg-[#16181E] dark:border-white/[0.08] dark:hover:border-white/20 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar Squircle */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-tr from-[#ee6018] to-orange-400 text-white font-bold text-xs shadow-2xs">
              {initials}
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight truncate">
                  {userName}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono leading-tight truncate">
                  {userEmail}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <ChevronUpDownIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500 shrink-0 ml-1" />
          )}
        </button>
      </div>
    </aside>
  )
}
