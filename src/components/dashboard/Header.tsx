'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useQueryClient } from '@tanstack/react-query'
import { AnimatedThemeToggle } from '@/components/ui/animated-theme-toggle'
import { AccountMenu } from '@/components/dashboard/AccountMenu'
import { PlanUsage } from '@/components/dashboard/PlanUsage'
import { ProjectSwitcher } from '@/components/dashboard/ProjectSwitcher'
import { Tooltip } from '@/components/dashboard/Tooltip'
import { NotificationBell } from '@/components/dashboard/NotificationBell'

interface HeaderProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

/** En-tête de tous les écrans (doc 3.2) : projet à gauche ; usage, plan et « Passer à Pro » à droite. */
export function Header({ isCollapsed = false, onToggleCollapse }: HeaderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  async function refreshDashboard() {
    if (refreshing) return
    setRefreshing(true)
    window.dispatchEvent(new CustomEvent('app:refresh'))
    await queryClient.invalidateQueries()
    router.refresh()
    window.setTimeout(() => setRefreshing(false), 350)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-4 border-b border-gray-200/70 bg-white/95 px-5 backdrop-blur-md transition-colors dark:border-white/[0.08] dark:bg-black/90 md:px-7">
      <div className="flex min-w-0 items-center gap-3">
        {onToggleCollapse && <button type="button" onClick={onToggleCollapse} aria-label={isCollapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'} title={isCollapsed ? 'Déplier le menu' : 'Réduire le menu'} className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/90 bg-gray-50 text-gray-500 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:border-white/[0.08] dark:!bg-[#16181E] dark:!text-zinc-300 dark:hover:border-white/20 dark:hover:!bg-[#1E212A] dark:hover:!text-white"><svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><rect x="3.5" y="4.5" width="17" height="15" rx="2.25" /><path strokeLinecap="round" d="M9 5v14" />{isCollapsed ? <path strokeLinecap="round" strokeLinejoin="round" d="m13 9 3 3-3 3" /> : <path strokeLinecap="round" strokeLinejoin="round" d="m16 9-3 3 3 3" />}</svg></button>}
        <div className="hidden h-4 w-px bg-gray-200 dark:bg-zinc-800 sm:block" />
        <ProjectSwitcher />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <PlanUsage />
        <AnimatedThemeToggle />
        <NotificationBell />
        <Tooltip label="Actualiser les données"><button type="button" onClick={() => void refreshDashboard()} disabled={refreshing} aria-label="Actualiser les données" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200/90 bg-white text-gray-600 shadow-2xs transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-wait disabled:opacity-70 dark:border-white/[0.08] dark:bg-[#16181E] dark:text-zinc-300 dark:hover:border-white/20 dark:hover:bg-[#1E212A] dark:hover:text-white"><ArrowPathIcon aria-hidden="true" className={`h-[18px] w-[18px] ${refreshing ? 'animate-spin' : ''}`} /></button></Tooltip>
        <AccountMenu />
      </div>
    </header>
  )
}
