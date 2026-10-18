import type { Metadata } from 'next'
import Link from 'next/link'
import { getAdminContext } from '@/lib/admin/auth'
import { AdminSignOut } from '@/components/admin/AdminSessionActions'
import { AdminNav } from '@/components/admin/AdminNav'
import { FOCUS } from '@/components/admin/ui'

export const metadata: Metadata = {
  title: { template: '%s · Qualio Admin', default: 'Qualio Admin' },
  robots: { index: false, follow: false },
}

function Brand({ size }: { size: 'md' | 'sm' }) {
  const box = size === 'md' ? 'h-9 w-9' : 'h-8 w-8'
  return (
    <Link href="/admin" className={`flex items-center gap-3 rounded-lg ${FOCUS}`}>
      <span className={`flex ${box} items-center justify-center rounded-lg bg-black p-1.5`}><img src="/qualio-logo/export/mark/monogram-orange.svg" alt="" width={36} height={36} className="h-full w-full" /></span>
      <span className="font-bold">Qualio <span className="text-[#ff9a66]">Admin</span></span>
    </Link>
  )
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAdminContext()
  return (
    <div className="min-h-dvh bg-[#101010] text-[#eeeeee] antialiased">
      <a href="#admin-contenu" className={`sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-black ${FOCUS}`}>Aller au contenu</a>
      <div className="mx-auto flex min-h-dvh max-w-[1600px]">
        <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#161413] p-5 lg:flex">
          <div className="border-b border-white/10 pb-5"><Brand size="md" /></div>
          <AdminNav variant="sidebar" />
          <div className="mt-auto space-y-3 border-t border-white/10 pt-5 text-sm">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">Session admin</p>
              <p className="mt-1 truncate text-stone-200" title={user.email ?? undefined}>{user.email}</p>
            </div>
            <AdminSignOut />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-white/10 bg-[#161413] px-5 py-4 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0"><Brand size="sm" /><p className="mt-1 max-w-[14rem] truncate text-xs text-stone-400">{user.email}</p></div>
              <AdminSignOut />
            </div>
            <AdminNav variant="bar" />
          </header>
          <main id="admin-contenu" tabIndex={-1} className="min-w-0 flex-1 p-5 outline-none sm:p-8 lg:p-12">{children}</main>
        </div>
      </div>
    </div>
  )
}
