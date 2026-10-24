'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, LayoutDashboard, ListChecks, Mail, MessageSquare, Users, Eye } from 'lucide-react'
import { FOCUS } from '@/components/admin/ui'

const ITEMS = [
  { href: '/admin', label: 'Vue d’ensemble', short: 'Accueil', Icon: LayoutDashboard },
  { href: '/admin/actions', label: 'Actions prioritaires', short: 'Actions', Icon: ListChecks },
  { href: '/admin/feedback', label: 'Retours produit', short: 'Retours', Icon: MessageSquare },
  { href: '/admin/users', label: 'Utilisateurs', short: 'Utilisateurs', Icon: Users },
  { href: '/admin/emails', label: 'Emails & relances', short: 'Emails', Icon: Mail },
] as const

const ACQUISITION = [
  { href: '/admin/acquisition', label: 'Prospection', short: 'Prospection', Icon: Building2 },
  { href: '/admin/acquisition/visitors', label: 'Visiteurs', short: 'Visiteurs', Icon: Eye },
] as const

/** Sur admin.tryqualio.pro, « / » est réécrit vers /admin : on ramène les deux formes au même chemin. */
function normalize(pathname: string) {
  if (pathname === '/') return '/admin'
  return pathname.startsWith('/admin') ? pathname : `/admin${pathname}`
}

export function AdminNav({ variant, collapsed = false, onNavigate }: { variant: 'sidebar' | 'bar'; collapsed?: boolean; onNavigate?: () => void }) {
  const current = normalize(usePathname() ?? '/admin')
  const isActive = (href: string) => (href === '/admin' || href === '/admin/acquisition' ? current === href : current === href || current.startsWith(`${href}/`))
  const sidebar = variant === 'sidebar'
  return (
    <nav aria-label="Navigation admin" className={sidebar ? 'mt-6' : 'mt-3'}>
      <ul role="list" className={sidebar ? 'space-y-1' : 'flex flex-wrap gap-1.5'}>
        {[...ITEMS, ...ACQUISITION].map(({ href, label, short, Icon }) => {
          const active = isActive(href)
          const classes = sidebar
            ? `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm ${active ? 'bg-white/[0.1] font-semibold text-white' : 'text-stone-300 hover:bg-white/[0.06] hover:text-white'}`
            : `flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm ${active ? 'bg-white/[0.1] font-semibold text-white' : 'text-stone-300 hover:bg-white/[0.06]'}`
          return (
            <li key={href}>
              <Link href={href} onClick={onNavigate} aria-current={active ? 'page' : undefined} aria-label={collapsed ? label : undefined} title={collapsed ? label : undefined} className={`${classes} ${collapsed ? 'justify-center px-0' : ''} ${FOCUS}`}>
                <Icon size={18} aria-hidden="true" className={active ? 'text-[#ff9a66]' : 'text-stone-400'} />
                {sidebar && !collapsed ? label : !sidebar ? short : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
