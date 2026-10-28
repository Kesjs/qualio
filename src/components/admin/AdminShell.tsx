'use client'

import { useEffect, useState } from 'react'
import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { AdminSignOut } from '@/components/admin/AdminSessionActions'
import { AdminNav } from '@/components/admin/AdminNav'
import { FOCUS } from '@/components/admin/ui'
import { AnimatedThemeToggle } from '@/components/ui/animated-theme-toggle'

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className={`${compact ? 'h-9 w-9' : 'h-9 w-9'} flex shrink-0 items-center justify-center rounded-lg border border-gray-200/90 bg-white p-1.5 shadow-2xs dark:border-white/[0.1] dark:bg-black`}>
        <img src="/qualio-logo/export/mark/monogram-orange.svg" alt="" width={36} height={36} className="h-full w-full" />
      </span>
      {!compact && <span className="text-sm font-bold tracking-tight">Qualio <span className="text-[#c2410c] dark:text-[#ff9a66]">Admin</span></span>}
    </span>
  )
}

export function AdminShell({ children, email }: { children: React.ReactNode; email: string | null }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setCollapsed(window.localStorage.getItem('qualio-admin-sidebar') === 'collapsed')
  }, [])

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value
      window.localStorage.setItem('qualio-admin-sidebar', next ? 'collapsed' : 'open')
      return next
    })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1600px] lg:gap-3 lg:p-3">
      <aside className={`sticky top-3 hidden h-[calc(100dvh-1.5rem)] shrink-0 flex-col overflow-y-auto rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#111216] p-3 transition-[width] duration-200 lg:flex ${collapsed ? 'w-[76px]' : 'w-72'}`}>
        <div className={`flex items-center border-b border-gray-200/80 dark:border-white/[0.08] pb-5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <a href="/admin" aria-label="Qualio Admin" className={`rounded-lg ${FOCUS}`}><Brand compact={collapsed} /></a>
          <button type="button" onClick={toggleCollapsed} aria-label={collapsed ? 'Agrandir la sidebar' : 'Réduire la sidebar'} title={collapsed ? 'Agrandir la sidebar' : 'Réduire la sidebar'} className={`rounded-lg p-2 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white ${FOCUS}`}>
            {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
          </button>
        </div>
        <AdminNav variant="sidebar" collapsed={collapsed} />
        <div className={`mt-auto space-y-3 border-t border-gray-200/80 dark:border-white/[0.08] pt-5 text-sm ${collapsed ? 'text-center' : ''}`}>
          {!collapsed && <div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-zinc-400">Session admin</p><p className="mt-1 truncate text-gray-800 dark:text-zinc-200" title={email ?? undefined}>{email}</p></div>}
          <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : ''}`}><AnimatedThemeToggle className="h-10 w-10 shrink-0" /><div className={collapsed ? '' : 'min-w-0 flex-1'}><AdminSignOut compact={collapsed} /></div></div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-gray-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-black/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <a href="/admin" aria-label="Qualio Admin" className={`rounded-lg ${FOCUS}`}><Brand /></a>
            <div className="flex items-center gap-1.5"><AnimatedThemeToggle className="h-9 w-9" />
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu admin" className={`rounded-lg p-2 text-gray-800 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-white/[0.08] ${FOCUS}`}><Menu size={22} aria-hidden="true" /></button></div>
          </div>
        </header>
        {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,330px)] flex-col bg-[#F8F9FA] dark:bg-[#111216] p-5 shadow-2xl transition-transform duration-200 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-gray-200/80 dark:border-white/[0.08] pb-5"><a href="/admin" className={`rounded-lg ${FOCUS}`}><Brand /></a><button type="button" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu admin" className={`rounded-lg p-2 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/[0.08] ${FOCUS}`}><X size={21} aria-hidden="true" /></button></div>
          <AdminNav variant="sidebar" onNavigate={() => setMobileOpen(false)} />
          <div className="mt-auto space-y-3 border-t border-gray-200/80 dark:border-white/[0.08] pt-5 text-sm"><div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-zinc-400">Session admin</p><p className="mt-1 truncate text-gray-800 dark:text-zinc-200" title={email ?? undefined}>{email}</p></div><AdminSignOut /></div>
        </aside>
        <main id="admin-contenu" tabIndex={-1} className="min-w-0 flex-1 p-5 outline-none sm:p-8 lg:px-8 lg:py-6">{children}</main>
      </div>
    </div>
  )
}
