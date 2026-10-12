'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowDownTrayIcon,
  ArrowRightOnRectangleIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  HashtagIcon,
  HomeIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useSites, type Site } from '@/lib/hooks/useSites'
import { AddSiteModal } from '@/components/dashboard/AddSiteModal'

interface SidebarProps {
  isCollapsed?: boolean
}

const navItems = [
  { label: 'Accueil', href: '/dashboard', icon: HomeIcon },
  { label: 'Thèmes', href: '/dashboard/themes', icon: HashtagIcon },
  { label: 'Actions', href: '/dashboard/actions', icon: BoltIcon },
  { label: 'Avis', href: '/dashboard/feedback', icon: ChatBubbleLeftRightIcon },
  { label: 'Collecte', href: '/dashboard/collection', icon: ArrowDownTrayIcon },
  { label: 'Réglages', href: '/dashboard/settings', icon: Cog6ToothIcon },
]

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const { data: sites, isLoading } = useSites()
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
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
    if (!sites?.length) {
      setSelectedSiteId(null)
      window.localStorage.removeItem('qualio:selected-site')
      return
    }
    const storedId = window.localStorage.getItem('qualio:selected-site')
    const nextId = storedId && sites.some((site) => site.id === storedId) ? storedId : sites[0].id
    setSelectedSiteId(nextId)
  }, [sites])

  useEffect(() => {
    const onProjectChanged = (event: Event) => {
      const siteId = (event as CustomEvent<{ siteId?: string }>).detail?.siteId
      if (siteId) setSelectedSiteId(siteId)
    }
    window.addEventListener('qualio:project-changed', onProjectChanged)
    return () => window.removeEventListener('qualio:project-changed', onProjectChanged)
  }, [])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const activeSite = sites?.find((site) => site.id === selectedSiteId) ?? sites?.[0]
  const initials = userName.slice(0, 2).toUpperCase()
  const selectSite = (site: Site) => {
    setSelectedSiteId(site.id)
    window.localStorage.setItem('qualio:selected-site', site.id)
    window.dispatchEvent(new CustomEvent('qualio:project-changed', { detail: { siteId: site.id } }))
    setIsProjectMenuOpen(false)
  }

  return (
    <aside className={`relative flex h-full shrink-0 flex-col justify-between overflow-visible rounded-2xl border border-gray-200/80 bg-[#F8F9FA] transition-all dark:border-white/[0.08] dark:bg-[#111216] ${isCollapsed ? 'w-20' : 'w-72'}`}>
      <div>
        <div className="flex h-16 items-center border-b border-gray-200/60 px-3 dark:border-white/[0.08]">
          <Link href="/dashboard" className="group flex w-full items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200/80 bg-gray-950 p-1.5 shadow-2xs dark:border-white/[0.1] dark:bg-black">
              <img src="/qualio-logo/export/mark/monogram-orange.svg" alt="Qualio" className="h-full w-full object-contain" />
            </div>
            {!isCollapsed && <div className="flex min-w-0 flex-col"><span className="truncate text-sm font-bold tracking-tight text-gray-900 dark:text-white">Qualio</span><span className="mt-1 truncate font-mono text-[10px] font-medium text-gray-400 dark:text-zinc-500">FEEDBACK WORKSPACE</span></div>}
          </Link>
        </div>

        {!isCollapsed && (
          <div className="relative border-b border-gray-200/60 px-3 py-3 dark:border-white/[0.08]">
            <button type="button" onClick={() => setIsProjectMenuOpen((open) => !open)} aria-expanded={isProjectMenuOpen} aria-label="Changer de projet" className="flex min-h-11 w-full items-center gap-2.5 rounded-md border border-gray-200/80 bg-white px-2.5 py-2 text-left hover:border-gray-300 dark:border-white/[0.08] dark:bg-[#16181E] dark:hover:border-white/20">
              <SiteFavicon site={activeSite} />
              <span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-zinc-500">Projet actif</span><span className="mt-0.5 block truncate text-xs font-semibold text-gray-900 dark:text-zinc-100">{activeSite ? activeSite.name || activeSite.url || 'Projet sans nom' : isLoading ? 'Chargement…' : 'Aucun projet'}</span></span>
              <ChevronDownIcon className={`h-4 w-4 shrink-0 text-gray-400 transition-transform dark:text-zinc-500 ${isProjectMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isProjectMenuOpen && <div className="absolute left-3 right-3 top-full z-40 mt-2 overflow-hidden rounded-md border border-gray-200 bg-white p-1 shadow-xl dark:border-white/[0.1] dark:bg-[#16181E]">
              <div className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-zinc-500">Vos projets</div>
              <div className="max-h-56 overflow-y-auto">{sites?.map((site) => <button key={site.id} type="button" onClick={() => selectSite(site)} className={`flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left ${activeSite?.id === site.id ? 'bg-gray-100 dark:bg-white/[0.07]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.05]'}`}><SiteFavicon site={site} size="sm" /><span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-700 dark:text-zinc-300">{site.name || site.url || 'Projet sans nom'}</span></button>)}</div>
              <div className="mt-1 border-t border-gray-100 pt-1 dark:border-white/[0.07]"><button type="button" onClick={() => { setIsProjectMenuOpen(false); setIsAddSiteOpen(true) }} className="flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold text-[#ee6018] hover:bg-orange-50 dark:hover:bg-[#ee6018]/10"><PlusIcon className="h-4 w-4" /> Ajouter un projet</button></div>
            </div>}
          </div>
        )}

        <nav aria-label="Navigation principale" className="space-y-1 p-3">
          {navItems.map((item) => {
            const active = item.href === '/dashboard' ? pathname === item.href : pathname?.startsWith(item.href)
            const Icon = item.icon
            return <Link key={item.href} href={item.href} className={`group relative flex min-h-11 items-center rounded-md transition-colors ${isCollapsed ? 'justify-center px-2.5' : 'gap-3.5 px-3'} ${active ? 'border border-gray-200/90 bg-white font-semibold text-gray-900 shadow-2xs dark:border-white/[0.12] dark:bg-[#1B1E26] dark:text-white' : 'border border-transparent font-medium text-gray-500 hover:bg-gray-200/50 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-white'}`} aria-current={active ? 'page' : undefined}><Icon className="h-5 w-5 shrink-0" />{!isCollapsed && <span className="truncate text-sm">{item.label}</span>}{active && <span className={`absolute right-2.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-[#ee6018] ${isCollapsed ? 'right-1.5' : ''}`} />}</Link>
          })}
        </nav>
      </div>

      <div className="relative border-t border-gray-200/60 p-3 dark:border-white/[0.08]" ref={profileRef}>
        {isProfileMenuOpen && <div className="absolute bottom-full left-3 right-3 z-50 mb-2 rounded-lg border border-gray-200/90 bg-white p-1.5 shadow-xl dark:border-white/[0.1] dark:bg-[#16181E]"><Link href="/dashboard/settings" onClick={() => setIsProfileMenuOpen(false)} className="flex min-h-11 items-center gap-2 rounded-md px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:text-zinc-300 dark:hover:bg-white/[0.06]"><Cog6ToothIcon className="h-4 w-4" /> Réglages</Link><button type="button" onClick={async () => { await getSupabaseBrowserClient().auth.signOut(); window.location.href = '/login' }} className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"><ArrowRightOnRectangleIcon className="h-4 w-4" /> Déconnexion</button></div>}
        <button type="button" onClick={() => setIsProfileMenuOpen((open) => !open)} aria-label="Ouvrir le menu du compte" className={`flex min-h-11 w-full items-center rounded-md border border-gray-200/80 bg-white p-1.5 text-left shadow-2xs hover:border-gray-300 dark:border-white/[0.08] dark:bg-[#16181E] dark:hover:border-white/20 ${isCollapsed ? 'justify-center' : 'justify-between'}`}><span className="flex min-w-0 items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#ee6018] text-xs font-bold text-white">{initials}</span>{!isCollapsed && <span className="flex min-w-0 flex-col"><span className="truncate text-xs font-bold text-gray-900 dark:text-white">{userName}</span><span className="truncate font-mono text-[10px] text-gray-400 dark:text-zinc-500">{userEmail}</span></span>}</span>{!isCollapsed && <ChevronUpDownIcon className="h-4 w-4 shrink-0 text-gray-400 dark:text-zinc-500" />}</button>
      </div>
      <AddSiteModal isOpen={isAddSiteOpen} onClose={() => setIsAddSiteOpen(false)} onSuccess={selectSite} />
    </aside>
  )
}

function SiteFavicon({ site, size = 'md' }: { site?: Site; size?: 'sm' | 'md' }) {
  const url = site?.url
  const favicon = url ? `${url.replace(/\/$/, '')}/favicon.ico` : null
  return <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50 dark:border-white/[0.08] dark:bg-white/[0.04] ${size === 'sm' ? 'h-6 w-6' : 'h-7 w-7'}`}>{favicon && <img src={favicon} alt="" className="h-4 w-4 object-contain grayscale opacity-80" onError={(event) => { event.currentTarget.style.display = 'none' }} />}<GlobeAltIcon className="h-4 w-4 text-gray-400" /></span>
}
