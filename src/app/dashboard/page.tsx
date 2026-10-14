import { redirect } from 'next/navigation'
import { getAuthedContext } from '@/lib/supabase/auth'
import { WeeklyPage } from '@/components/dashboard/weekly/WeeklyPage'

export default async function DashboardPage() {
  // Un compte sans projet passe par l'onboarding avant même l'affichage du dashboard : aucun écran intermédiaire.
  const { supabase, userId } = await getAuthedContext()
  if (userId) {
    const { count } = await (supabase as any).from('sites').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    if (count === 0) redirect('/onboarding')
  }
  return <WeeklyPage />
}
