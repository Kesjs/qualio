import { notFound } from 'next/navigation'
import { getAuthedContext } from '@/lib/supabase/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/billing/limits'
import { loadTaskSheet } from '@/lib/feedback/task-sheet'
import { TaskSheet } from '@/components/share/TaskSheet'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Aperçu de la tâche · Qualio', robots: { index: false, follow: false, nocache: true }, referrer: 'no-referrer' as const }

/** Aperçu privé d'une tâche, pour l'enregistrer en PDF (Pro et Agence) sans créer de lien public. */
export default async function TaskPreviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ imprimer?: string }> }) {
  const { id } = await params
  const { imprimer } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const { supabase, userId } = await getAuthedContext()
  if (!userId) notFound()
  if ((await getUserPlan(supabase as any, userId)) === 'free') notFound()
  const admin = getSupabaseAdminClient() as any
  const { data: owned } = await admin.from('feedback_recommendations').select('id').eq('id', id).eq('user_id', userId).maybeSingle()
  if (!owned) notFound()
  const data = await loadTaskSheet(admin, id)
  if (!data) notFound()
  return <TaskSheet data={data} autoPrint={imprimer === '1'} preview />
}
