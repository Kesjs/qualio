'use client'

import { useEffect, useState } from 'react'
import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { AdminSignOut } from '@/components/admin/AdminSessionActions'
import { AdminNav } from '@/components/admin/AdminNav'
import { FOCUS } from '@/components/admin/ui'

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className={`${compact ? 'h-9 w-9' : 'h-9 w-9'} flex shrink-0 items-center justify-center rounded-lg bg-black p-1.5`}>
        <img src="/qualio-logo/export/mark/monogram-orange.svg" alt="" width={36} height={36} className="h-full w-full" />
      </span>
      {!compact && <span className="font-bold">Qualio <span className="text-[#ff9a66]">Admin</span></span>}
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
    <div className="mx-auto flex min-h-dvh max-w-[1600px]">
      <aside className={`sticky top-0 hidden h-dvh shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#161413] p-4 transition-[width] duration-200 lg:flex ${collapsed ? 'w-[76px]' : 'w-72'}`}>
        <div className={`flex items-center border-b border-white/10 pb-5 ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <a href="/admin" aria-label="Qualio Admin" className={`rounded-lg ${FOCUS}`}><Brand compact={collapsed} /></a>
          <button type="button" onClick={toggleCollapsed} aria-label={collapsed ? 'Agrandir la sidebar' : 'Réduire la sidebar'} title={collapsed ? 'Agrandir la sidebar' : 'Réduire la sidebar'} className={`rounded-lg p-2 text-stone-400 hover:bg-white/[0.08] hover:text-white ${FOCUS}`}>
            {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}
          </button>
        </div>
        <AdminNav variant="sidebar" collapsed={collapsed} />
        <div className={`mt-auto space-y-3 border-t border-white/10 pt-5 text-sm ${collapsed ? 'text-center' : ''}`}>
          {!collapsed && <div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">Session admin</p><p className="mt-1 truncate text-stone-200" title={email ?? undefined}>{email}</p></div>}
          <AdminSignOut compact={collapsed} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#161413]/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <a href="/admin" aria-label="Qualio Admin" className={`rounded-lg ${FOCUS}`}><Brand /></a>
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu admin" className={`rounded-lg p-2 text-stone-200 hover:bg-white/[0.08] ${FOCUS}`}><Menu size={22} aria-hidden="true" /></button>
          </div>
        </header>
        {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,330px)] flex-col bg-[#161413] p-5 shadow-2xl transition-transform duration-200 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-5"><a href="/admin" className={`rounded-lg ${FOCUS}`}><Brand /></a><button type="button" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu admin" className={`rounded-lg p-2 text-stone-300 hover:bg-white/[0.08] ${FOCUS}`}><X size={21} aria-hidden="true" /></button></div>
          <AdminNav variant="sidebar" onNavigate={() => setMobileOpen(false)} />
          <div className="mt-auto space-y-3 border-t border-white/10 pt-5 text-sm"><div><p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">Session admin</p><p className="mt-1 truncate text-stone-200" title={email ?? undefined}>{email}</p></div><AdminSignOut /></div>
        </aside>
        <main id="admin-contenu" tabIndex={-1} className="min-w-0 flex-1 p-5 outline-none sm:p-8 lg:p-12">{children}</main>
      </div>
    </div>
  )
}
