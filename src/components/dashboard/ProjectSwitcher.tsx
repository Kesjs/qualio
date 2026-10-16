'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDownIcon, Cog6ToothIcon, GlobeAltIcon, LockClosedIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useActiveSite } from '@/lib/hooks/useActiveSite'
import type { Site } from '@/lib/hooks/useSites'
import { AddSiteModal } from '@/components/dashboard/AddSiteModal'
import { useBillingStatus } from './useBillingStatus'

function SiteFavicon({ site }: { site?: Site }) {
  const url = site?.url
  const hostname = (() => {
    if (!url) return null
    try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname } catch { return null }
  })()
  const direct = hostname ? `https://${hostname}/favicon.ico` : null
  const fallback = hostname ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64` : null
  const [favicon, setFavicon] = useState(direct)
  useEffect(() => { setFavicon(direct) }, [direct])
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#1B1E26]">
      {favicon ? <img src={favicon} alt="" className="h-4 w-4 object-contain" onError={() => { if (favicon !== fallback && fallback) setFavicon(fallback); else setFavicon(null) }} /> : <GlobeAltIcon className="h-4 w-4 text-gray-400" />}
    </span>
  )
}

/** Sélecteur de projet de l'en-tête (doc 3.2). « Nouveau projet » est grisé avec un cadenas quand la limite du plan est atteinte. */
export function ProjectSwitcher({ compact = false }: { compact?: boolean }) {
  const { sites, activeSite, isLoading } = useActiveSite()
  const { data: billing } = useBillingStatus(activeSite?.id)
  const [open, setOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false) }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKey) }
  }, [])

  const select = (site: Site) => {
    try { window.localStorage.setItem('qualio:selected-site', site.id) } catch { /* stockage indisponible */ }
    window.dispatchEvent(new CustomEvent('qualio:project-changed', { detail: { siteId: site.id } }))
    setOpen(false)
  }

  const limitReached = billing ? billing.usage.projects >= billing.limits.projects : false
  const isFree = billing?.plan === 'free'
  const label = activeSite ? (activeSite.name || activeSite.url || 'Projet sans nom') : isLoading ? 'Chargement…' : 'Aucun projet'

  return (
    <div className="relative min-w-0" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={`Projet actif : ${label}. Changer de projet`} className={`flex min-h-10 items-center gap-2.5 rounded-lg border border-gray-200/90 bg-white px-2.5 text-left shadow-2xs hover:border-gray-300 dark:border-white/[0.08] dark:bg-[#16181E] dark:hover:border-white/20 ${compact ? 'max-w-[11rem]' : 'max-w-[16rem]'}`}>
        <SiteFavicon site={activeSite} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">{label}</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-gray-400 transition-transform dark:text-zinc-500 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-xl dark:border-white/[0.1] dark:bg-[#16181E]">
          <div className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-zinc-400">Vos projets</div>
          <div className="max-h-56 overflow-y-auto">
            {sites?.map((site) => (
              <button key={site.id} type="button" onClick={() => select(site)} aria-current={activeSite?.id === site.id ? 'true' : undefined} className={`flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm ${activeSite?.id === site.id ? 'bg-gray-100 font-semibold dark:bg-white/[0.07]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'}`}>
                <SiteFavicon site={site} />
                <span className="min-w-0 flex-1 truncate text-gray-900 dark:text-zinc-100">{site.name || site.url || 'Projet sans nom'}</span>
                {billing?.writableSiteIds && !billing.writableSiteIds.includes(site.id) && <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-white/10 dark:text-zinc-300">Lecture seule</span>}
              </button>
            ))}
          </div>
          <div className="mt-1 border-t border-gray-100 pt-1 dark:border-white/[0.07]">
            <Link href="/dashboard/projects" onClick={() => setOpen(false)} className="flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:text-zinc-200 dark:hover:bg-white/[0.04]"><Cog6ToothIcon className="h-4 w-4" /> Gérer les projets</Link>
            {limitReached ? (
              <div className="px-2.5 py-2">
                <button type="button" disabled className="flex min-h-11 w-full cursor-not-allowed items-center gap-2 rounded-md text-left text-xs font-semibold text-gray-400 dark:text-zinc-500"><LockClosedIcon className="h-4 w-4" /> Nouveau projet</button>
                <p className="mt-1 text-xs text-gray-600 dark:text-zinc-400">
                  {isFree ? `Le plan Gratuit est limité à ${billing?.limits.projects ?? 1} projet. ` : `Votre plan est limité à ${billing?.limits.projects} projets. `}
                  {isFree ? (
                    <Link href="/pricing" className="font-semibold text-[#c2410c] underline dark:text-orange-400">Passer à Pro</Link>
                  ) : billing?.plan === 'pro' ? (
                    <Link href="/pricing" className="font-semibold text-[#c2410c] underline dark:text-orange-400">Passer à Agence</Link>
                  ) : null}
                </p>
              </div>
            ) : (
              <button type="button" onClick={() => { setOpen(false); setAddOpen(true) }} className="flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-semibold text-[#c2410c] hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-500/10"><PlusIcon className="h-4 w-4" /> Nouveau projet</button>
            )}
          </div>
        </div>
      )}
      <AddSiteModal isOpen={addOpen} onClose={() => setAddOpen(false)} onSuccess={select} />
    </div>
  )
}
