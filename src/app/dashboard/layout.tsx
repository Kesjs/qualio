'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { MobileTabBar } from '@/components/dashboard/MobileTabBar'
import { ProjectSwitcher } from '@/components/dashboard/ProjectSwitcher'
import { AccountMenu } from '@/components/dashboard/AccountMenu'
import { NotificationBell } from '@/components/dashboard/NotificationBell'
import { PlanUsage } from '@/components/dashboard/PlanUsage'
import { AnimatedThemeToggle } from '@/components/ui/animated-theme-toggle'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] w-full bg-white text-gray-900 font-sans overflow-hidden antialiased dark:bg-[#0B0C0E] dark:text-zinc-100 transition-colors">
      {/* Barre latérale (bureau) : 4 entrées */}
      <div className="hidden md:flex h-full shrink-0 bg-white dark:bg-[#0B0C0E]">
        <Sidebar isCollapsed={isCollapsed} />
      </div>

      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#0B0C0E] transition-all">
        {/* En-tête mobile : logo, projet, plan, thème, compte. Le menu est dans la barre du bas. */}
        <div className="flex md:hidden h-14 w-full shrink-0 items-center gap-2 border-b border-gray-200/80 bg-white px-3 dark:border-white/[0.08] dark:bg-[#0B0C0E]">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link href="/dashboard" aria-label="Qualio, Cette semaine" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200/90 bg-white p-1 shadow-2xs transition-colors dark:border-white/[0.1] dark:bg-black">
              <img src="/qualio-logo/export/mark/monogram-orange.svg" alt="" className="h-full w-full object-contain" />
            </Link>
            <ProjectSwitcher compact />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <PlanUsage compact />
            <AnimatedThemeToggle className="h-8 w-8" />
            <NotificationBell />
            <AccountMenu />
          </div>
        </div>

        {/* En-tête bureau */}
        <div className="hidden md:block shrink-0">
          <Header isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
        </div>

        <main className="flex-1 overflow-y-auto p-5 pb-24 md:p-8 md:pb-8 bg-white dark:bg-black transition-colors">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>

        <MobileTabBar />
      </div>
    </div>
  )
}
