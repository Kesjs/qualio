'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  LineChart,
  Users,
  Lightbulb,
  History,
  ShieldCheck,
  Menu,
  PanelLeft,
  Home,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { AccountMenu } from '@/components/dashboard/AccountMenu'
import { HeaderMeasureButton } from '@/components/dashboard/HeaderMeasureButton'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { NotificationCenter } from '@/components/dashboard/NotificationCenter'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Performance', href: '/dashboard/performance', icon: LineChart },
  { label: 'Audit', href: '/dashboard/audit-technique', icon: ShieldCheck },
  { label: 'Concurrents', href: '/dashboard/concurrents', icon: Users },
  { label: 'Opportunités', href: '/dashboard/opportunites', icon: Lightbulb },
  { label: 'Historique', href: '/dashboard/historique', icon: History },
] as const

const pageTitles: Record<string, string> = {
  '/dashboard': 'Accueil',
  '/dashboard/performance': 'Performance',
  '/dashboard/audit-technique': 'Audit',
  '/dashboard/concurrents': 'Concurrents',
  '/dashboard/opportunites': 'Opportunités',
  '/dashboard/historique': 'Historique',
  '/dashboard/parametres': 'Paramètres',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const [brand, setBrand] = useState<{ name: string } | null>({ name: 'Qualio' })

  async function handleRefresh() {
    if (isManualRefreshing) return
    setIsManualRefreshing(true)
    setTimeout(() => setIsManualRefreshing(false), 1000)
    window.location.reload()
  }

  useEffect(() => {
    if (localStorage.getItem('simulation_mode')) {
      setIsAuthenticated(true)
      return
    }

    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        window.location.href = '/login'
      }
    }).catch(() => {
      setIsAuthenticated(false)
      window.location.href = '/login'
    })
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="size-5 animate-spin rounded-full border-2 border-ink-muted/30 border-t-brand" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <TooltipProvider>
      <div className="flex min-h-screen w-full bg-canvas text-ink-primary font-sans">
        {/* Overlay Backdrop sombre sur mobile quand la sidebar est ouverte */}
        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
            aria-label="Fermer le menu"
          />
        )}

        {/* Sidebar (rétractable avec animation fluide sur desktop, tiroir sur mobile) */}
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          navItems={navItems as any}
          brand={brand}
        />

        {/* Conteneur principal (décalé selon la largeur de la sidebar avec transition animée) */}
        <div
          className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out ${
            isCollapsed ? 'lg:pl-[68px]' : 'lg:pl-60'
          }`}
        >
          {/* La "Carte" du Dashboard style Nooma */}
          <div className="flex-1 flex flex-col bg-surface lg:m-2 lg:rounded-2xl border border-border overflow-hidden shadow-sm relative">
            {/* VRAI Header Permanent (Desktop ET Mobile) */}
            <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-surface/90 px-4 sm:px-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
              {/* Bouton Menu sur mobile */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="flex size-8 items-center justify-center rounded-md border border-border bg-surface text-ink-secondary hover:text-ink-primary hover:bg-elevated transition-colors lg:hidden"
                    aria-label="Ouvrir le menu"
                  >
                    <Menu className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Ouvrir le menu</TooltipContent>
              </Tooltip>

              {/* Bouton Collapse / Rétractation sur grand écran */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setIsCollapsed((prev) => !prev)}
                    className="hidden lg:flex size-8 items-center justify-center rounded-md border border-border bg-surface text-ink-secondary hover:text-ink-primary hover:bg-elevated transition-colors"
                    aria-label={isCollapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'}
                  >
                    <PanelLeft className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isCollapsed ? 'Déplier la barre latérale' : 'Réduire la barre latérale'}</TooltipContent>
              </Tooltip>

              {/* Fil d'Ariane */}
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-elevated px-2.5 py-1.5 text-xs">
                <Link
                  href="/dashboard"
                  className="flex items-center text-ink-muted transition-colors hover:text-ink-primary"
                  aria-label="Accueil"
                >
                  <Home className="size-3.5" />
                </Link>
                <ChevronRight className="size-3.5 text-ink-muted" />
                <span className="font-medium text-ink-primary lg:text-sm lg:font-semibold">{pathname ? (pageTitles[pathname] || 'Tableau de bord') : 'Accueil'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <HeaderMeasureButton />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isManualRefreshing}
                    aria-label="Actualiser le tableau de bord"
                    className="flex size-8 items-center justify-center rounded-md border border-border bg-surface text-ink-secondary hover:text-ink-primary hover:bg-elevated transition-colors disabled:opacity-60"
                  >
                    <RefreshCw className={cn('size-4', isManualRefreshing && 'animate-spin')} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Actualiser</TooltipContent>
              </Tooltip>
              <ThemeToggle />
              <NotificationCenter />
              <div className="lg:hidden">
                <AccountMenu variant="header" />
              </div>
            </div>
          </header>

          {/* Zone de contenu des pages du dashboard */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
