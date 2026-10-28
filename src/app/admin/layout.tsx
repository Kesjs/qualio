import type { Metadata } from 'next'
import { getAdminContext } from '@/lib/admin/auth'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata: Metadata = {
  title: { template: '%s · Qualio Admin', default: 'Qualio Admin' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAdminContext()
  return (
    <div className="min-h-dvh bg-white dark:bg-[#0B0C0E] text-gray-900 dark:text-[#eeeeee] antialiased">
      <a href="#admin-contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-black">Aller au contenu</a>
      <AdminShell email={user.email ?? null}>{children}</AdminShell>
    </div>
  )
}
