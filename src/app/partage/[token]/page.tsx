import { notFound } from 'next/navigation'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { loadTaskSheet } from '@/lib/feedback/task-sheet'
import { TaskSheet } from '@/components/share/TaskSheet'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Tâche partagée · Qualio', robots: { index: false, follow: false, nocache: true }, referrer: 'no-referrer' as const }

/** Page publique d'une tâche partagée (Pro et Agence) : sans compte, jeton long, révocable (« Arrêter le partage »). */
export default async function SharedTaskPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[A-Za-z0-9_-]{32,}$/.test(token)) notFound()
  const admin = getSupabaseAdminClient() as any
  const { data: share } = await admin.from('recommendation_shares').select('recommendation_id').eq('token', token).is('revoked_at', null).maybeSingle()
  if (!share) notFound()
  const data = await loadTaskSheet(admin, share.recommendation_id)
  if (!data) notFound()
  return <TaskSheet data={data} />
}
