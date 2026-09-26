'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { NotificationDrawer } from '@/components/dashboard/NotificationDrawer'
import {
  Bars3Icon,
  XMarkIcon,
  BellIcon,
} from '@heroicons/react/24/outline'
import { AnimatedThemeToggle } from '@/components/ui/animated-theme-toggle'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  return (
    <div className="flex h-screen w-full bg-white text-gray-900 font-sans overflow-hidden antialiased dark:bg-[#0B0C0E] dark:text-zinc-100 transition-colors">
      {/* ─── Desktop Sidebar ─────────────────────────────────────────── */}
      <div className="hidden md:flex h-full shrink-0 border-r border-gray-200/80 dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#0B0C0E]">
        <Sidebar
          isCollapsed={isCollapsed}
        />
      </div>

      {/* ─── Mobile Sidebar Slide-Over Drawer (Matching Image 3) ──────────── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden overflow-hidden">
          <div
            className="fixed inset-0 bg-gray-900/30 dark:bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-72 bg-[#F8F9FA] dark:bg-[#0B0C0E] dark:border-r dark:border-white/[0.08] shadow-2xl relative flex flex-col">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-white border border-gray-200 text-gray-500 flex items-center justify-center hover:text-gray-900 shadow-2xs z-10 dark:bg-[#16181E] dark:border-white/[0.08] dark:text-zinc-400 dark:hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
              <Sidebar isCollapsed={false} />
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Panel (Seamless full workspace) ─ */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#0B0C0E] transition-all">
        {/* Mobile Header (Image 3: Lintel style) */}
        <div className="flex md:hidden h-14 w-full items-center justify-between border-b border-gray-200/80 bg-white px-4 shrink-0 dark:border-white/[0.08] dark:bg-[#0B0C0E]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ee6018] text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="7" />
                <path d="M12 2v3" />
                <path d="M12 19v3" />
                <path d="M2 12h3" />
                <path d="M19 12h3" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">Qualio</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <AnimatedThemeToggle className="h-8 w-8" />

            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06]"
            >
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-sm bg-[#ee6018]" />
            </button>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06]"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block shrink-0">
          <Header
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            unreadNotificationsCount={2}
          />
        </div>

        {/* Scrollable Content Container (Pure White in light, Pure Black #000000 in dark) */}
        <main className="flex-1 overflow-y-auto p-5 md:p-8 bg-white dark:bg-black transition-colors">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* ─── Real Right Notification Slide-Over Drawer ─────────────────────── */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  )
}
