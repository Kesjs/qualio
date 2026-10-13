import type { ComponentType } from 'react'
import { CalendarDaysIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon, PlusCircleIcon } from '@heroicons/react/24/outline'

export interface NavItem {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  /** Seule l'adresse exacte active l'entrée (utile pour l'accueil). */
  exact?: boolean
  /** Anciennes pages encore accessibles par adresse : elles activent cette entrée (doc 6.6, Thèmes et Actions deviennent des filtres). */
  alsoMatches?: string[]
}

/** Menu à 4 entrées (doc 3.2). */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Cette semaine', href: '/dashboard', icon: CalendarDaysIcon, exact: true },
  { label: 'Avis', href: '/dashboard/feedback', icon: ChatBubbleLeftRightIcon },
  { label: 'Ajouter des avis', href: '/dashboard/collection', icon: PlusCircleIcon },
  { label: 'Réglages', href: '/dashboard/settings', icon: Cog6ToothIcon },
]

export function isNavActive(pathname: string | null | undefined, item: NavItem) {
  const path = pathname ?? ''
  if (item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`)) return true
  return Boolean(item.alsoMatches?.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)))
}
