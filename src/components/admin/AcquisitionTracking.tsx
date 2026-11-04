'use client'

import { useState } from 'react'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import { Badge, EmptyState, FOCUS, TableRegion, TD, TH, type Tone } from '@/components/admin/ui'
import { BTN_SMALL, BTN_SMALL_ACCENT, FOLLOW_UP_AFTER_DAYS, postJson, type Notify } from '@/components/admin/acquisition-shared'
import { formatDateTime } from '@/lib/admin/format'
import type { PipelineMessage } from '@/lib/admin/acquisition'

type Filter = 'all' | 'opened' | 'due' | 'replied' | 'bounced'

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

  const counts: Record<Filter, number> = {
    all: messages.length,
    opened: messages.filter((m) => (m.report?.viewCount ?? 0) > 0 || Boolean(m.clickedAt)).length,
    due: messages.filter((m) => m.followUpDue).length,
    replied: messages.filter((m) => m.status === 'replied').length,
    bounced: messages.filter((m) => m.status === 'bounced').length,
  }

  const visible = messages.filter((m) => {
    if (filter === 'opened') return (m.report?.viewCount ?? 0) > 0 || Boolean(m.clickedAt)
    if (filter === 'due') return m.followUpDue
    if (filter === 'replied') return m.status === 'replied'
    if (filter === 'bounced') return m.status === 'bounced'
    return true
  })

  async function mark(id: string, action: 'replied' | 'stop' | 'undo') {
    setBusy(id)
    const { ok, data } = await postJson('/api/admin/acquisition/messages/status', { id, action })
    setBusy(null)
    if (!ok) return notify('error', data.error ?? 'Mise à jour impossible.')
    refresh()
    notify(
      'success',
      action === 'replied'
        ? 'Réponse enregistrée.'
        : action === 'stop'
          ? 'Contact exclu définitivement des relances.'
          : 'Statut rétabli.',
    )
  }

  async function followUp(id: string) {
    setBusy(id)
    const { ok, data } = await postJson('/api/admin/acquisition/draft', { followUpOf: id })
    setBusy(null)
    if (!ok) return notify('error', data.error ?? 'Relance impossible.')
    refresh()
    notify('success', 'Relance prête dans Brouillons.', 'drafts')
  }

  if (!messages.length) {
    return (
      <EmptyState
        title="Aucun envoi à suivre"
        description="Dès le premier email parti, tu verras ici la livraison, les clics humains, le nombre d’ouvertures du rapport /rapport et les réponses."
      />
    )
  }

  const chip = (value: Filter, label: string) => {
    const active = filter === value
    return (
      <button
        key={value}
        type="button"
        aria-pressed={active}
        onClick={() => setFilter(value)}
        className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors duration-150 ${FOCUS} ${
          active
            ? 'border-gray-900 bg-gray-950 text-white dark:border-white dark:bg-white dark:text-gray-950'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-white/[0.08] dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
        }`}
      >
        {label}
        <span className="font-mono text-[11px] tabular-nums opacity-80">{counts[value]}</span>
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer le suivi">
          {chip('all', 'Tous')}
          {chip('opened', 'Intérêt détecté (rapport / clic)')}
          {chip('due', 'À relancer')}
          {chip('replied', 'Répondus')}
          {chip('bounced', 'Rebonds')}
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          Livraison et rebonds synchronisés automatiquement ; coche « Répondu » dès qu’un prospect te répond.
        </p>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Aucun message dans cette vue"
          description={
            filter === 'opened'
              ? 'Dès qu’un prospect humain ouvre son rapport /rapport ou clique dans l’email, il remonte ici en priorité.'
              : filter === 'due'
                ? `Une relance douce est proposée ${FOLLOW_UP_AFTER_DAYS} jours après l’envoi sans réponse.`
                : undefined
          }
        />
      ) : (
        <TableRegion label="Suivi des envois">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={TH}>Destinataire</th>
                <th className={TH}>Objet &amp; message</th>
                <th className={TH}>Envoi</th>
                <th className={TH}>Statut &amp; signaux d’intérêt</th>
                <th className={`${TH} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((message) => {
                const status = statusOf(message)
                const disabled = busy === message.id
                const views = message.report?.viewCount ?? 0
                return (
                  <tr key={message.id} className="border-t border-gray-100 align-top dark:border-white/[0.06]">
                    <td className={TD}>
                      <span className="font-mono text-xs text-gray-900 dark:text-zinc-200">{message.email}</span>
                      <span className="mt-0.5 block text-xs text-gray-500 dark:text-zinc-400">{message.company}</span>
                    </td>
                    <td className={`${TD} max-w-xs`}>
                      <details>
                        <summary className={`cursor-pointer font-semibold text-gray-900 dark:text-[#eeeeee] ${FOCUS}`}>
                          {message.isFollowUp && <span className="text-sky-700 dark:text-sky-300">Relance · </span>}
                          {message.subject}
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-gray-600 dark:text-zinc-300">{message.body}</p>
                      </details>
                      {message.report && (
                        <a
                          href={`${message.report.url}?apercu=1`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-gray-500 hover:underline dark:text-zinc-400"
                        >
                          /rapport ({message.report.reviewCount} avis)
                          <ArrowTopRightOnSquareIcon className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                    </td>
                    <td className={`${TD} whitespace-nowrap font-mono text-xs tabular-nums text-gray-600 dark:text-zinc-300`}>
                      {formatDateTime(message.sentAt)}
                    </td>
                    <td className={TD}>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={status.tone}>{status.label}</Badge>
                        {views > 0 && (
                          <Badge tone="success">
                            Rapport lu · <span className="ml-1 font-mono tabular-nums">{views}×</span>
                          </Badge>
                        )}
                        {message.clickedAt && views === 0 && <Badge tone="accent">Lien cliqué</Badge>}
                        {message.followUpDue && <Badge tone="warning">À relancer</Badge>}
                      </div>
                      {message.bounceReason && (
                        <p className="mt-1.5 max-w-[16rem] text-xs text-red-700 dark:text-red-300">{message.bounceReason}</p>
                      )}
                    </td>
                    <td className={TD}>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {message.status === 'sent' && (
                          <>
                            <button type="button" disabled={disabled} onClick={() => void mark(message.id, 'replied')} className={BTN_SMALL}>
                              Répondu
                            </button>
                            <button type="button" disabled={disabled} onClick={() => void mark(message.id, 'stop')} className={BTN_SMALL}>
                              Stop reçu
                            </button>
                          </>
                        )}
                        {message.followUpDue && (
                          <button type="button" disabled={disabled} onClick={() => void followUp(message.id)} className={BTN_SMALL_ACCENT}>
                            Préparer relance
                          </button>
                        )}
                        {message.status === 'replied' && (
                          <button type="button" disabled={disabled} onClick={() => void mark(message.id, 'undo')} className={BTN_SMALL}>
                            Annuler
                          </button>
                        )}
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
