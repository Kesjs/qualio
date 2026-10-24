'use client'

import { useState } from 'react'
import { Badge, EmptyState, TableRegion, TD, TH, type Tone } from '@/components/admin/ui'
import { BTN_SMALL, BTN_SMALL_ACCENT, FOLLOW_UP_AFTER_DAYS, postJson, type Notify } from '@/components/admin/acquisition-shared'
import { formatDateTime } from '@/lib/admin/format'
import type { PipelineMessage } from '@/lib/admin/acquisition'

type Filter = 'all' | 'due' | 'replied' | 'bounced'

function statusOf(message: PipelineMessage): { label: string; tone: Tone } {
  if (message.status === 'replied') return { label: 'Répondu', tone: 'success' }
  if (message.status === 'suppressed') return { label: 'Stop', tone: 'neutral' }
  if (message.status === 'bounced') return { label: 'Rebond', tone: 'danger' }
  if (message.deliveredAt) return { label: 'Livré', tone: 'info' }
  return { label: 'Envoyé', tone: 'neutral' }
}

export function AcquisitionTracking({ messages, notify, refresh }: { messages: PipelineMessage[]; notify: Notify; refresh: () => void }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const counts = { all: messages.length, due: messages.filter((m) => m.followUpDue).length, replied: messages.filter((m) => m.status === 'replied').length, bounced: messages.filter((m) => m.status === 'bounced').length }
  const visible = messages.filter((m) => filter === 'all' || (filter === 'due' && m.followUpDue) || (filter === 'replied' && m.status === 'replied') || (filter === 'bounced' && m.status === 'bounced'))

  async function mark(id: string, action: 'replied' | 'stop' | 'undo') {
    setBusy(id)
    const { ok, data } = await postJson('/api/admin/acquisition/messages/status', { id, action })
    setBusy(null)
    if (!ok) return notify('error', data.error ?? 'Mise à jour impossible.')
    refresh()
    notify('success', action === 'replied' ? 'Réponse enregistrée.' : action === 'stop' ? 'Contact exclu : il ne sera plus jamais relancé.' : 'Réponse annulée.')
  }

  async function followUp(id: string) {
    setBusy(id)
    const { ok, data } = await postJson('/api/admin/acquisition/draft', { followUpOf: id })
    setBusy(null)
    if (!ok) return notify('error', data.error ?? 'Relance impossible.')
    refresh()
    notify('success', 'Relance prête : relis-la dans Brouillons.', 'drafts')
  }

  if (!messages.length) return <EmptyState title="Aucun message envoyé" description="Dès le premier envoi, tu verras ici s’il est livré, rebondi ou s’il a reçu une réponse." />

  const chip = (value: Filter, label: string) => (
    <button type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`min-h-11 rounded-lg border px-3 text-sm font-semibold ${filter === value ? 'border-white/30 bg-white/[0.1] text-white' : 'border-white/10 text-stone-400 hover:text-white'}`}>{label} <span className="font-mono text-xs">{counts[value]}</span></button>
  )

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-3 text-xs leading-5 text-sky-200">Les statuts Envoyé, Livré et Rebond viennent du fournisseur d’email. « Répondu » et « Stop reçu » sont enregistrés quand tu confirmes l’action ici.</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer le suivi">{chip('all', 'Tous')}{chip('due', 'À relancer')}{chip('replied', 'Répondus')}{chip('bounced', 'Rebonds')}</div>
      {visible.length === 0 ? <EmptyState title="Rien dans ce filtre" description={filter === 'due' ? `Une relance est proposée ${FOLLOW_UP_AFTER_DAYS} jours après l’envoi, sans réponse.` : undefined} /> : (
        <TableRegion label="Suivi des envois">
          <table className="w-full text-sm">
            <thead><tr><th className={TH}>Destinataire</th><th className={TH}>Message</th><th className={TH}>Envoyé</th><th className={TH}>Statut</th><th className={TH}><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {visible.map((message) => {
                const status = statusOf(message)
                const disabled = busy === message.id
                return (
                  <tr key={message.id} className="border-t border-white/10 align-top">
                    <td className={TD}><span className="font-mono text-xs">{message.email}</span><span className="block text-xs text-stone-400">{message.company}</span></td>
                    <td className={`${TD} max-w-xs`}><details><summary className="cursor-pointer font-semibold">{message.isFollowUp && <span className="text-sky-300">Relance · </span>}{message.subject}</summary><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-stone-300">{message.body}</p></details></td>
                    <td className={`${TD} whitespace-nowrap text-xs text-stone-300`}>{formatDateTime(message.sentAt)}</td>
                    <td className={TD}><div className="flex flex-wrap gap-1.5"><Badge tone={status.tone}>{status.label}</Badge>{message.followUpDue && <Badge tone="warning">À relancer</Badge>}</div>{message.bounceReason && <p className="mt-1.5 max-w-[16rem] text-xs text-red-300">{message.bounceReason}</p>}</td>
                    <td className={TD}>
                      <div className="flex flex-wrap justify-end gap-2">
                        {message.status === 'sent' && <><button type="button" disabled={disabled} onClick={() => void mark(message.id, 'replied')} className={BTN_SMALL}>Répondu</button><button type="button" disabled={disabled} onClick={() => void mark(message.id, 'stop')} className={BTN_SMALL}>Stop reçu</button></>}
                        {message.followUpDue && <button type="button" disabled={disabled} onClick={() => void followUp(message.id)} className={BTN_SMALL_ACCENT}>Relancer</button>}
                        {message.status === 'replied' && <button type="button" disabled={disabled} onClick={() => void mark(message.id, 'undo')} className={BTN_SMALL}>Annuler</button>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableRegion>
      )}
    </div>
  )
}
