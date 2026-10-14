import { redirect } from 'next/navigation'
import { getAuthedContext } from '@/lib/supabase/auth'
import { WeeklyPage } from '@/components/dashboard/weekly/WeeklyPage'

export const revalidate = 0

export default async function DashboardPage() {
  // Vérifier le projet avant de rendre le dashboard pour éviter tout flash pendant l'onboarding.
  const { supabase, userId } = await getAuthedContext()
  if (userId) {
    const { data: projects, error } = await (supabase as any).from('sites').select('id').eq('user_id', userId).limit(1)
    if (error) throw error
    if (!projects?.length) redirect('/onboarding')
  }
  return <WeeklyPage />
}
