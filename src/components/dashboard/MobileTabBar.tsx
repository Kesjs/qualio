'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS, isNavActive } from './nav'

/** Sur mobile, le menu devient une barre en bas (doc 3.2). */
export function MobileTabBar() {
  const pathname = usePathname()
  return (
    <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200/80 bg-white pb-[env(safe-area-inset-bottom)] dark:border-white/[0.08] dark:bg-[#0B0C0E] md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = isNavActive(pathname, item)
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium ${active ? 'text-[#c2410c] dark:text-orange-400' : 'text-gray-500 dark:text-zinc-400'}`}>
            <Icon className="h-5 w-5" />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
