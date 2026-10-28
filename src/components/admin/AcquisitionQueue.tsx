'use client'

import { useState } from 'react'
import { Badge, BTN_PRIMARY, BTN_SECONDARY, EmptyState, TableRegion, TD, TH } from '@/components/admin/ui'
import { BTN_SMALL_ACCENT, CHECKBOX, plural, postJson, type Notify } from '@/components/admin/acquisition-shared'
import type { QueueItem } from '@/lib/admin/acquisition'

const STATE: Record<QueueItem['state'], { label: string; tone: 'warning' | 'accent' | 'danger'; action: string }> = {
  scan: { label: 'À analyser', tone: 'warning', action: 'Analyser et rédiger' },
  ready: { label: 'Prêt à rédiger', tone: 'accent', action: 'Rédiger' },
  empty: { label: 'Aucun email', tone: 'danger', action: 'Réanalyser' },
}

export function AcquisitionQueue({ items, notify, refresh }: { items: QueueItem[]; notify: Notify; refresh: () => void }) {
  const [selected, setSelected] = useState<string[]>([])
  const [includeShared, setIncludeShared] = useState(false)
  const [onlySourced, setOnlySourced] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const working = progress !== null
  const toggle = (id: string) => setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  const visibleItems = items.filter((item) => {
    const hasNamedContact = item.contacts.some((contact) => !contact.generic)
    if (!includeShared && !hasNamedContact) return false
    if (onlySourced && !item.contacts.some((contact) => Boolean(contact.email_source_url))) return false
    return true
  })
  const allSelected = visibleItems.length > 0 && selected.length === visibleItems.length

  async function prepare(ids: string[]) {
    let drafted = 0, noEmail = 0, existing = 0
    for (let index = 0; index < ids.length; index += 1) {
      setProgress({ done: index, total: ids.length })
      const { ok, data } = await postJson('/api/admin/acquisition/prepare', { companyId: ids[index] })
      if (!ok) { setProgress(null); refresh(); return notify('error', `${data.error ?? 'La préparation a échoué.'} ${drafted ? `${plural(drafted, 'brouillon prêt', 'brouillons prêts')} avant l’erreur.` : ''}`.trim()) }
      if (data.drafted) drafted += 1
      else if (!data.emails) noEmail += 1
      else existing += 1
    }
    setProgress(null)
    setSelected([])
    refresh()
    const parts = [noEmail ? `${plural(noEmail, 'entreprise sans email', 'entreprises sans email')}` : '', existing ? `${existing} déjà traitée(s)` : ''].filter(Boolean).join(', ')
    if (drafted) notify('success', `${plural(drafted, 'brouillon prêt', 'brouillons prêts')} à relire${parts ? ` (${parts})` : ''}.`, 'drafts')
    else notify('info', parts || 'Rien à préparer.')
  }

  async function archive() {
    const { ok, data } = await postJson('/api/admin/acquisition/archive', { companyIds: selected })
    if (!ok) return notify('error', data.error ?? 'Archivage impossible.')
    setSelected([])
    refresh()
    notify('success', `${plural(data.archived, 'entreprise archivée', 'entreprises archivées')}.`)
  }

  if (!items.length) return <EmptyState title="Aucun prospect à contacter" description="Importe un CSV ou colle des domaines dans « Ajouter des prospects », ils apparaîtront ici." />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : visibleItems.map((item) => item.id))} className={CHECKBOX} />Tout sélectionner</label>
        <button type="button" onClick={() => void prepare(selected)} disabled={!selected.length || working} className={BTN_PRIMARY}>{working ? `Préparation ${progress.done + 1}/${progress.total}…` : `Préparer la sélection (${selected.length})`}</button>
        <button type="button" onClick={() => void archive()} disabled={!selected.length || working} className={BTN_SECONDARY}>Archiver</button>
        <label className="flex min-h-11 items-center gap-2 text-sm text-gray-600 dark:text-zinc-300"><input type="checkbox" checked={includeShared} onChange={(event) => { setIncludeShared(event.target.checked); setSelected([]) }} className={CHECKBOX} />Inclure les boîtes partagées</label>
        <label className="flex min-h-11 items-center gap-2 text-sm text-gray-600 dark:text-zinc-300"><input type="checkbox" checked={onlySourced} onChange={(event) => { setOnlySourced(event.target.checked); setSelected([]) }} className={CHECKBOX} />Emails trouvés sur une source publique</label>
        {working && <p role="status" className="text-sm text-gray-500 dark:text-zinc-400">Chaque site est analysé puis un brouillon est créé. Ne ferme pas la page.</p>}
      </div>
      {visibleItems.length !== items.length && (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-800 dark:text-amber-200">
          {items.length} prospects dans la file · {visibleItems.length} affichés. Les autres sont masqués car ils n’ont qu’une boîte partagée ; active « Inclure les boîtes partagées » pour les voir.
        </p>
      )}
      <TableRegion label="Prospects à contacter">
        <table className="w-full text-sm">
          <thead><tr><th className={`${TH} w-12`}><span className="sr-only">Sélection</span></th><th className={TH}>Entreprise</th><th className={TH}>Emails</th><th className={TH}>Étape</th><th className={TH}><span className="sr-only">Action</span></th></tr></thead>
          <tbody>
            {visibleItems.map((item) => {
              const meta = STATE[item.state]
              const first = item.contacts[0]
              return (
                <tr key={item.id} className="border-t border-gray-200/80 dark:border-white/[0.08]">
                  <td className={TD}><input type="checkbox" aria-label={`Sélectionner ${item.name}`} checked={selected.includes(item.id)} onChange={() => toggle(item.id)} disabled={working} className={CHECKBOX} /></td>
                  <td className={TD}><a href={`https://${item.domain}`} target="_blank" rel="noreferrer" className="font-semibold hover:underline">{item.name}<span className="block font-mono text-xs font-normal text-gray-500 dark:text-zinc-400">{item.domain}</span></a></td>
                  <td className={TD}>
                    {first ? <><span className="font-mono text-xs">{first.email}</span>{item.contacts.length > 1 && <span className="text-xs text-gray-500 dark:text-zinc-500"> +{item.contacts.length - 1}</span>}{first.generic && <span className="block text-xs text-amber-700 dark:text-amber-300">Boîte partagée</span>}{first.email_status === 'verified' && <span className="block text-xs text-emerald-700 dark:text-emerald-300">Domaine email valide</span>}{first.email_status === 'unverified' && <span className="block text-xs text-amber-700 dark:text-amber-300">Domaine non confirmé</span>}{first.email_source_url && <a href={first.email_source_url} target="_blank" rel="noreferrer" className="block text-xs text-sky-700 dark:text-sky-300 hover:underline">Trouvé sur le site</a>}</>
                      : <span className="text-xs text-gray-500 dark:text-zinc-500">{item.state === 'scan' ? 'Pas encore cherchés' : 'Aucun email public : importe-en un par CSV'}</span>}
                  </td>
                  <td className={TD}><Badge tone={meta.tone}>{meta.label}</Badge></td>
                  <td className={`${TD} text-right`}><button type="button" onClick={() => void prepare([item.id])} disabled={working} className={BTN_SMALL_ACCENT}>{meta.action}</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableRegion>
    </div>
  )
}
