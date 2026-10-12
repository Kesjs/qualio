import { notFound, redirect } from 'next/navigation'

// Anciennes adresses du dashboard : redirigées vers les nouvelles pages.
const legacy: Record<string, string> = {
  analysis: '/dashboard/themes',
  syntheses: '/dashboard/actions?tab=history',
  recommendations: '/dashboard/actions',
}

export default async function LegacyDashboardRoute({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const target = legacy[section]
  if (!target) notFound()
  redirect(target)
}
