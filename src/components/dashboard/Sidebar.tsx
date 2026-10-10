'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  HomeIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  ChevronUpDownIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useSites, SiteWithLastScan } from '@/lib/hooks/useSites'
import { AddSiteModal } from '@/components/dashboard/AddSiteModal'

interface SidebarProps {
  isCollapsed?: boolean
  onSearchClick?: () => void
}

const navSections = [
  {
    title: 'Navigation',
    items: [
      { label: 'Vue d’ensemble', href: '/dashboard', icon: HomeIcon },
      { label: 'Avis', href: '/dashboard/feedback', icon: DocumentTextIcon },
      { label: 'Synthèses', href: '/dashboard/analysis', icon: SparklesIcon },
      { label: 'Recommandations', href: '/dashboard/recommendations', icon: ArrowTopRightOnSquareIcon },
      { label: 'Collecte', href: '/dashboard/collection', icon: ArrowDownTrayIcon },
    ],
  },
  {
    title: 'Système',
    items: [
      { label: 'Paramètres', href: '/dashboard/settings', icon: Cog6ToothIcon },
    ],
  },
]

export function Sidebar({ isCollapsed = false, onSearchClick }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: sites } = useSites()
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isSiteMenuOpen, setIsSiteMenuOpen] = useState(false)
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
  const [userName, setUserName] = useState('Utilisateur')
  const [userEmail, setUserEmail] = useState('')

  const profileRef = useRef<HTMLDivElement>(null)

  const showTooltip = (label: string) => (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-[60] ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-950 px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-white dark:text-gray-950"
    >
      {label}
    </span>
  )

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

  useEffect(() => {
    if (!sites?.length) {
      setSelectedSiteId(null)
      window.localStorage.removeItem('qualio:selected-site')
      return
    }
    const storedId = window.localStorage.getItem('qualio:selected-site')
    const nextId = storedId && sites.some((site) => site.id === storedId) ? storedId : sites[0].id
    setSelectedSiteId(nextId)
  }, [sites])

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
  const selectedSite = sites?.find((site) => site.id === selectedSiteId) ?? sites?.[0]
  const selectedSiteHost = selectedSite ? getSiteHostname(selectedSite.url) : null

  return (
    <aside
      className={`relative flex flex-col justify-between overflow-visible rounded-2xl bg-[#F8F9FA] border border-gray-200/80 dark:bg-[#111216] dark:border-white/[0.08] transition-all duration-300 ease-in-out shrink-0 h-full ${
      isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      <div>
        {/* Brand Header with Real Qualio Monogram Logo */}
        <div className="flex h-16 items-center px-3 border-b border-gray-200/60 dark:border-white/[0.08]">
          <Link href="/dashboard" className="flex items-center gap-2.5 group w-full">
            {/* Real Qualio Monogram Mark */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-950 dark:bg-black border border-gray-200/80 dark:border-white/[0.1] p-1.5 shadow-2xs group-hover:scale-105 transition-transform duration-200 ease-out">
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
                  FEEDBACK WORKSPACE
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Current site context switcher */}
        {!isCollapsed && (
          <div className="relative border-b border-gray-200/60 px-3 py-3 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => setIsSiteMenuOpen((open) => !open)}
              className="flex w-full items-center gap-2.5 rounded-md border border-gray-200/80 bg-white px-2.5 py-2 text-left transition-colors hover:border-gray-300 dark:border-white/[0.08] dark:bg-[#16181E] dark:hover:border-white/20"
              aria-expanded={isSiteMenuOpen}
              aria-label="Changer de projet"
            >
              <SiteFavicon site={selectedSite} />
              <span className="min-w-0 flex-1">
                <span className="block text-[9px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-zinc-500">Projet actif</span>
                <span className="mt-0.5 block truncate text-xs font-semibold text-gray-900 dark:text-zinc-100">{selectedSite?.name || selectedSiteHost || 'Aucun projet'}</span>
              </span>
              <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform dark:text-zinc-500 ${isSiteMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSiteMenuOpen && (
              <div className="absolute left-3 right-3 top-full z-40 mt-2 overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-xl dark:border-white/[0.1] dark:bg-[#16181E]">
                <div className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-zinc-500">Vos projets</div>
                <div className="max-h-56 overflow-y-auto">
                  {sites?.map((site) => (
                    <button
                      key={site.id}
                      type="button"
                      onClick={() => {
                        setSelectedSiteId(site.id)
                        window.localStorage.setItem('qualio:selected-site', site.id)
                        setIsSiteMenuOpen(false)
                        router.push(`/dashboard/sites/${site.id}`)
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors ${selectedSite?.id === site.id ? 'bg-gray-100 dark:bg-white/[0.07]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.05]'}`}
                    >
                      <SiteFavicon site={site} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700 dark:text-zinc-300">{site.name || getSiteHostname(site.url)}</span>
                      <span className="text-[9px] uppercase text-gray-400 dark:text-zinc-500">{site.environment || 'prod'}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-1 border-t border-gray-100 pt-1 dark:border-white/[0.07]">
                    <Link href="/dashboard/projects" onClick={() => setIsSiteMenuOpen(false)} className="flex items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-white/[0.05]">
                    <GlobeAltIcon className="h-3.5 w-3.5 text-gray-400" /> Gérer les projets
                  </Link>
                  <button type="button" onClick={() => { setIsSiteMenuOpen(false); setIsAddSiteOpen(true) }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold text-[#ee6018] hover:bg-orange-50 dark:hover:bg-[#ee6018]/10">
                    <PlusIcon className="h-3.5 w-3.5" /> Ajouter un projet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
                      className={`group relative flex items-center rounded-md transition-all duration-150 ${
                        isCollapsed ? 'justify-center p-2.5' : 'gap-3.5 px-3 py-3 text-sm'
                      } ${
                        isActive
                          ? 'bg-white text-gray-900 font-semibold border border-gray-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_1px_rgba(0,0,0,0.02)] dark:bg-[#1B1E26] dark:text-white dark:border-white/[0.12] dark:shadow-[0_4px_14px_rgba(0,0,0,0.18)]'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 border border-transparent font-medium dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon
                          className={`h-5 w-5 shrink-0 transition-colors ${
                          isActive
                            ? 'text-gray-900 dark:text-white stroke-[2.2]'
                            : 'text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="flex-1 truncate">{item.label}</span>
                      )}

                      {/* Signature active state: a rounded orange notch confirms the selected item. */}
                      {isActive && (
                        <span
                          className={`rounded-full bg-[#ee6018] shrink-0 shadow-[0_0_0_3px_rgba(238,96,24,0.12)] ${
                            isCollapsed
                              ? 'absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-4'
                              : 'absolute right-2.5 top-1/2 -translate-y-1/2 w-1 h-5'
                          }`}
                        />
                      )}

                      {isCollapsed && showTooltip(item.label)}
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
          className={`flex w-full items-center rounded-md bg-white border border-gray-200/80 p-1.5 text-left hover:border-gray-300 shadow-2xs transition-all cursor-pointer dark:bg-[#16181E] dark:border-white/[0.08] dark:hover:border-white/20 ${
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
      <AddSiteModal isOpen={isAddSiteOpen} onClose={() => setIsAddSiteOpen(false)} onSuccess={(site) => { setSelectedSiteId(site.id); window.localStorage.setItem('qualio:selected-site', site.id); setIsAddSiteOpen(false) }} />
    </aside>
  )
}

function getSiteHostname(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

function SiteFavicon({ site, size = 'md' }: { site?: SiteWithLastScan; size?: 'sm' | 'md' }) {
  const favicon = site ? `${site.url.replace(/\/$/, '')}/favicon.ico` : null
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04] ${size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'}`}>
      {favicon ? <img src={favicon} alt="" className="h-4 w-4 object-contain grayscale opacity-80" onError={(event) => { event.currentTarget.style.display = 'none'; event.currentTarget.nextElementSibling?.removeAttribute('hidden') }} /> : null}
      <GlobeAltIcon className={`h-4 w-4 text-gray-400 ${favicon ? 'hidden' : ''}`} />
    </span>
  )
}
