import { notFound, redirect } from 'next/navigation'

// Anciennes adresses du dashboard : redirigées vers les nouvelles pages.
const legacy: Record<string, string> = {
  analysis: '/dashboard/feedback',
  syntheses: '/dashboard',
  recommendations: '/dashboard',
}

export default async function LegacyDashboardRoute({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  const target = legacy[section]
  if (!target) notFound()
  redirect(target)
}
