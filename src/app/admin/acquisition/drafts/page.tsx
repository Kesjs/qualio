import type { Metadata } from 'next'
import { getAdminContext } from '@/lib/admin/auth'
import { Notice, PageHeader, Panel } from '@/components/admin/ui'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { AcquisitionDraftControls } from '@/components/admin/AcquisitionDraftControls'

export const metadata: Metadata = { title: 'Brouillons acquisition' }

export default async function DraftsPage() {
  await getAdminContext()
  const { data: messages, error } = await (getSupabaseAdminClient() as any)
    .from('acquisition_messages')
    .select('id, subject, body, status, created_at, contact:acquisition_contacts(email, company:acquisition_companies(name))')
    .order('created_at', { ascending: false })

  return <div className="mx-auto max-w-5xl space-y-6">
    <PageHeader eyebrow="Acquisition / Brouillons" title="Brouillons de messages" description="Relis et approuve chaque message avant tout envoi." />
    <Notice tone="info">Les brouillons sont préparés dans Admin uniquement. Aucun message n’est envoyé automatiquement.</Notice>
    <Panel id="drafts" title="Messages à relire" description="Chaque brouillon reste modifiable avant une éventuelle approbation.">
      {error ? <p className="text-sm text-red-300">Impossible de charger les brouillons.</p> : messages?.length ? <AcquisitionDraftControls messages={messages as any} /> : <div className="rounded-2xl border border-dashed border-white/15 px-5 py-8 text-sm text-stone-400">Génère un brouillon depuis un contact dans Prospects pour le retrouver ici.</div>}
    </Panel>
  </div>
}
