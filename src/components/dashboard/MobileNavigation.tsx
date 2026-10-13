'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeIcon, ChatBubbleLeftRightIcon, ArrowDownTrayIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

export const dashboardNavigation = [
  { label: 'Cette semaine', href: '/dashboard', icon: HomeIcon },
  { label: 'Avis', href: '/dashboard/feedback', icon: ChatBubbleLeftRightIcon },
  { label: 'Ajouter des avis', href: '/dashboard/collection', icon: ArrowDownTrayIcon },
  { label: 'Réglages', href: '/dashboard/settings', icon: Cog6ToothIcon },
]

export function MobileNavigation() {
  const pathname = usePathname()
  return <nav aria-label="Navigation principale mobile" className="grid shrink-0 grid-cols-4 border-t border-border-strong bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">{dashboardNavigation.map((item) => { const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href); const Icon = item.icon; return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-center text-[10px] ${active ? 'bg-elevated font-semibold text-ink-primary' : 'text-ink-secondary'}`}><Icon className="h-5 w-5" /><span>{item.label}</span></Link> })}</nav>
}
