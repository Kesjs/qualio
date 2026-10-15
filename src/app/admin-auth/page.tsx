import { Suspense } from 'react'
import AdminLoginPage from '@/app/admin/login/page'

export default function AdminAuthPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#0B0C0E] text-sm text-zinc-400">Chargement…</main>}>
      <AdminLoginPage />
    </Suspense>
  )
}
