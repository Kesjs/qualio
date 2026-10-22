import type { Metadata } from 'next'
import { getAdminContext } from '@/lib/admin/auth'
import { Notice, PageHeader, Panel } from '@/components/admin/ui'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

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
      {error ? <p className="text-sm text-red-300">Impossible de charger les brouillons.</p> : messages?.length ? <div className="space-y-4">
        {messages.map((message: any) => <article key={message.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-sm font-semibold text-stone-100">{message.subject}</p><p className="mt-1 text-xs text-stone-500">À : {message.contact?.email ?? 'Contact inconnu'} · {message.contact?.company?.name ?? 'Entreprise inconnue'}</p></div>
            <span className="rounded-full border border-[#ee6018]/40 px-2.5 py-1 text-xs font-semibold text-[#ffb08a]">{message.status === 'draft' ? 'À relire' : message.status}</span>
          </div>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-6 text-stone-300">{message.body}</pre>
          <p className="mt-4 text-xs text-stone-500">Créé le {new Date(message.created_at).toLocaleString('fr-FR')}</p>
        </article>)}
      </div> : <div className="rounded-2xl border border-dashed border-white/15 px-5 py-8 text-sm text-stone-400">Génère un brouillon depuis un contact dans Prospects pour le retrouver ici.</div>}
    </Panel>
  </div>
}
