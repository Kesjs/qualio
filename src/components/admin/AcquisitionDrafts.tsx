'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowTopRightOnSquareIcon, DocumentChartBarIcon } from '@heroicons/react/20/solid'
import { Badge, BTN_PRIMARY, BTN_SECONDARY, EmptyState, FIELD } from '@/components/admin/ui'
import { BTN_SMALL, CHECKBOX, plural, postJson, type Notify, type ReportTarget } from '@/components/admin/acquisition-shared'
import type { PipelineMessage } from '@/lib/admin/acquisition'
import { renderAcquisitionEmail } from '@/lib/email/layout'
import { reportTokenFromBody, type ReportCard } from '@/lib/admin/acquisition-report-card'
import { GENERIC_EMAIL, isAgency } from '@/lib/admin/acquisition-draft'

const MAX_SEND = 25

function hookBadge(message: PipelineMessage) {
  if (message.isFollowUp) return { label: 'Relance J+4', tone: 'info' as const }
  if (message.report || /\/rapport\/[\w-]+/.test(message.body)) return { label: 'Accroche Rapport (/rapport)', tone: 'success' as const }
  if (isAgency(message.company, message.subject)) return { label: 'Accroche Agence', tone: 'accent' as const }
  return { label: 'Accroche Standard', tone: 'neutral' as const }
}

export function AcquisitionDrafts({
  drafts,
  remainingToday,
  notify,
  refresh,
  onCreateReport,
}: {
  drafts: PipelineMessage[]
  remainingToday: number
  notify: Notify
  refresh: () => void
  onCreateReport: (target: ReportTarget) => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [previewing, setPreviewing] = useState<string | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (confirming) cancelRef.current?.focus()
  }, [confirming])

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : current.length >= MAX_SEND ? current : [...current, id],
    )
  const allSelected = drafts.length > 0 && selected.length === Math.min(drafts.length, MAX_SEND)
  const willSend = Math.min(selected.length, Math.max(0, remainingToday))

  function startEdit(message: PipelineMessage) {
    setEditing(message.id)
    setSubject(message.subject)
    setBody(message.body)
  }

  function prepareSingleSend(message: PipelineMessage) {
    setSelected([message.id])
    setConfirming(true)
  }

  async function save(id: string) {
    setBusy(true)
    const { ok, data } = await postJson('/api/admin/acquisition/messages/update', { id, subject, body })
    setBusy(false)
    if (!ok) return notify('error', data.error ?? 'Enregistrement impossible.')
    setEditing(null)
    refresh()
    notify('success', 'Brouillon mis à jour.')
  }

  async function discard() {
    setBusy(true)
    const { ok, data } = await postJson('/api/admin/acquisition/messages/discard', { messageIds: selected })
    setBusy(false)
    if (!ok) return notify('error', data.error ?? 'Suppression impossible.')
    setSelected([])
    refresh()
    notify('success', `${plural(data.deleted, 'brouillon supprimé', 'brouillons supprimés')}.`)
  }

  async function send() {
    setBusy(true)
    const { ok, data } = await postJson('/api/admin/acquisition/send', { messageIds: selected })
    setBusy(false)
    setConfirming(false)
    if (!ok) return notify('error', data.error ?? 'Envoi impossible.')
    setSelected([])
    refresh()
    const parts = [
      data.failed ? `${data.failed} en échec` : '',
      data.skipped ? `${data.skipped} ignoré(s)` : '',
      data.deferred ? `${data.deferred} reporté(s) (quota du jour)` : '',
    ]
      .filter(Boolean)
      .join(', ')
    notify(data.sent ? 'success' : 'info', `${plural(data.sent, 'email envoyé', 'emails envoyés')}${parts ? ` · ${parts}` : ''}.`, 'tracking')
  }

  if (!drafts.length) {
    return (
      <EmptyState
        title="Aucun brouillon en attente"
        description="Génère un rapport d’avis ou clique sur « Rédiger » depuis l’onglet « À contacter » pour préparer tes prochains envois."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Barre d'actions épurée, sans boîte imbriquée */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200/80 pb-4 dark:border-white/[0.06]">
        <label className="flex min-h-10 items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? [] : drafts.slice(0, MAX_SEND).map((message) => message.id))}
            className={CHECKBOX}
          />
          Tout sélectionner
        </label>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={!selected.length || busy || remainingToday <= 0}
          className={BTN_PRIMARY}
        >
          Envoyer {selected.length ? `(${selected.length})` : 'la sélection'}
        </button>
        <button type="button" onClick={() => void discard()} disabled={!selected.length || busy} className={BTN_SECONDARY}>
          Supprimer
        </button>
        <p className="ml-auto font-mono text-xs tabular-nums text-gray-500 dark:text-zinc-400">
          {remainingToday > 0
            ? `${plural(remainingToday, 'envoi restant', 'envois restants')} aujourd’hui · lot max ${MAX_SEND}`
            : 'Quota journalier atteint — reprise demain'}
        </p>
      </div>

      <ul role="list" className="divide-y divide-gray-100 dark:divide-white/[0.06]">
        {drafts.map((message) => {
          const badge = hookBadge(message)
          const hasReport = Boolean(message.report || /\/rapport\/[\w-]+/.test(message.body))
          return (
            <li key={message.id} className="py-5 first:pt-1 last:pb-1">
              <div className="flex gap-3.5">
                <input
                  type="checkbox"
                  aria-label={`Sélectionner le message pour ${message.email}`}
                  checked={selected.includes(message.id)}
                  onChange={() => toggle(message.id)}
                  className={`${CHECKBOX} mt-1`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                      <span className="font-mono font-medium text-gray-900 dark:text-zinc-200">{message.email}</span>
                      <span>·</span>
                      <span className="font-medium text-gray-700 dark:text-zinc-300">{message.company}</span>
                      {GENERIC_EMAIL.test(message.email) && (
                        <span className="text-amber-700 dark:text-amber-300">· boîte partagée</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                      {message.report && (
                        <a
                          href={`${message.report.url}?apercu=1`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 hover:underline dark:text-[#a0ca92]"
                        >
                          {message.report.reviewCount} avis <ArrowTopRightOnSquareIcon className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                    </div>
                  </div>

                  {editing === message.id ? (
                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.95fr)]">
                      <div className="space-y-3">
                        <div>
                          <label htmlFor={`sujet-${message.id}`} className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                            Objet de l’email
                          </label>
                          <input
                            id={`sujet-${message.id}`}
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                            maxLength={200}
                            className={FIELD}
                          />
                        </div>
                        <div>
                          <label htmlFor={`corps-${message.id}`} className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                            Corps du message
                          </label>
                          <textarea
                            id={`corps-${message.id}`}
                            value={body}
                            onChange={(event) => setBody(event.target.value)}
                            rows={10}
                            maxLength={5000}
                            className={`${FIELD} py-2.5 leading-6`}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void save(message.id)}
                            disabled={busy || !subject.trim() || !body.trim()}
                            className={BTN_PRIMARY}
                          >
                            Enregistrer
                          </button>
                          <button type="button" onClick={() => setEditing(null)} className={BTN_SECONDARY}>
                            Annuler
                          </button>
                        </div>
                      </div>
                      <EmailPreview subject={subject} body={body} />
                    </div>
                  ) : (
                    <>
                      <p className="mt-2 text-base font-semibold tracking-tight text-gray-900 dark:text-[#eeeeee]">
                        {message.subject}
                      </p>
                      <p className="mt-1.5 max-w-[72ch] line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-zinc-300">
                        {message.body}
                      </p>
                      <div className="mt-3.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => prepareSingleSend(message)}
                          disabled={busy || remainingToday <= 0}
                          className={BTN_PRIMARY}
                        >
                          Envoyer
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewing(previewing === message.id ? null : message.id)}
                          className={BTN_SMALL}
                        >
                          {previewing === message.id ? 'Masquer l’aperçu' : 'Aperçu final'}
                        </button>
                        <button type="button" onClick={() => startEdit(message)} className={BTN_SMALL}>
                          Modifier
                        </button>
                        {!hasReport && !message.isFollowUp && (
                          <button
                            type="button"
                            onClick={() =>
                              onCreateReport({
                                companyId: message.companyId,
                                companyName: message.company,
                              })
                            }
                            className={BTN_SMALL}
                          >
                            <DocumentChartBarIcon className="h-3.5 w-3.5 text-[#c2410c] dark:text-[#ff9a66]" aria-hidden />
                            Enrichir avec un rapport /rapport
                          </button>
                        )}
                      </div>
                      {previewing === message.id && (
                        <div className="mt-4">
                          <EmailPreview subject={message.subject} body={message.body} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {confirming && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-xs"
          onClick={(event) => {
            if (event.target === event.currentTarget && !busy) setConfirming(false)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !busy) setConfirming(false)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="envoi-titre"
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/[0.12] dark:bg-[#16181E]"
          >
            <h2 id="envoi-titre" className="text-xl font-semibold">
              Confirmer l’envoi de {plural(willSend, 'email', 'emails')} ?
            </h2>
            <p className="mt-2.5 text-sm leading-6 text-gray-600 dark:text-zinc-300">
              Les emails partent immédiatement avec désinscription en un clic (RFC 8058) et suivi d’ouverture du rapport.
            </p>
            {selected.length > willSend && (
              <p className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-5 text-amber-800 dark:text-amber-300">
                Quota du jour : seuls {willSend} sur {selected.length} partiront maintenant ; le reste demeure en brouillon.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button ref={cancelRef} type="button" disabled={busy} onClick={() => setConfirming(false)} className={BTN_SECONDARY}>
                Annuler
              </button>
              <button type="button" onClick={() => void send()} disabled={busy || willSend === 0} className={BTN_PRIMARY}>
                {busy ? 'Envoi en cours…' : 'Envoyer maintenant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmailPreview({ subject, body }: { subject: string; body: string }) {
  const [card, setCard] = useState<ReportCard | null>(null)
  const reportToken = reportTokenFromBody(body)
  useEffect(() => {
    if (!reportToken) { setCard(null); return }
    let cancelled = false
    fetch(`/api/admin/acquisition/report-card?token=${encodeURIComponent(reportToken)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => { if (!cancelled) setCard(data?.card ?? null) })
      .catch(() => { if (!cancelled) setCard(null) })
    return () => { cancelled = true }
  }, [reportToken])
  const { html } = renderAcquisitionEmail({ subject, body, trackingUrl: '#apercu', unsubscribeUrl: '#desinscription', card })
  return (
    <div className="rounded-xl border border-gray-200/90 bg-gray-50 p-2 text-left dark:border-white/[0.08] dark:bg-[#101010]">
      <div className="mb-2 flex items-center justify-between px-2 font-mono text-[11px] text-gray-500 dark:text-zinc-400">
        <span>Rendu destinataire</span>
        <span>RFC 8058 + lien stop inclus</span>
      </div>
      <iframe title={`Aperçu de ${subject}`} srcDoc={html} sandbox="" className="h-[24rem] w-full rounded-lg border border-stone-200 bg-white" />
    </div>
  )
}
