'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge, BTN_PRIMARY, BTN_SECONDARY, EmptyState, FIELD } from '@/components/admin/ui'
import { BTN_SMALL, CHECKBOX, plural, postJson, type Notify } from '@/components/admin/acquisition-shared'
import type { PipelineMessage } from '@/lib/admin/acquisition'
import { renderAcquisitionEmail } from '@/lib/email/layout'
import { GENERIC_EMAIL } from '@/lib/admin/acquisition-draft'

const MAX_SEND = 25

export function AcquisitionDrafts({ drafts, remainingToday, notify, refresh }: { drafts: PipelineMessage[]; remainingToday: number; notify: Notify; refresh: () => void }) {
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [previewing, setPreviewing] = useState<string | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (confirming) cancelRef.current?.focus() }, [confirming])

  const toggle = (id: string) => setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : current.length >= MAX_SEND ? current : [...current, id]))
  const allSelected = drafts.length > 0 && selected.length === Math.min(drafts.length, MAX_SEND)
  const willSend = Math.min(selected.length, Math.max(0, remainingToday))

  function startEdit(message: PipelineMessage) { setEditing(message.id); setSubject(message.subject); setBody(message.body) }

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
    notify('success', 'Message enregistré.')
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
    const parts = [data.failed ? `${data.failed} en échec` : '', data.skipped ? `${data.skipped} ignoré(s) (contact bloqué)` : '', data.deferred ? `${data.deferred} reporté(s), limite du jour atteinte` : ''].filter(Boolean).join(', ')
    notify(data.sent ? 'success' : 'info', `${plural(data.sent, 'email envoyé', 'emails envoyés')}${parts ? ` · ${parts}` : ''}.`, 'tracking')
  }

  if (!drafts.length) return <EmptyState title="Aucun brouillon à relire" description="Prépare des prospects dans « À contacter » : les messages apparaîtront ici, prêts à être envoyés." />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#161413] p-3">
        <div className="mr-auto min-w-[13rem]"><p className="text-sm font-semibold text-stone-200">Envoi groupé</p><p className="text-xs text-stone-400">Sélectionne plusieurs messages si tu veux les envoyer ensemble.</p></div>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : drafts.slice(0, MAX_SEND).map((message) => message.id))} className={CHECKBOX} />Tout sélectionner</label>
        <button type="button" onClick={() => setConfirming(true)} disabled={!selected.length || busy || remainingToday <= 0} className={BTN_PRIMARY}>Envoyer {selected.length ? `les ${selected.length} sélectionnés` : 'la sélection'}</button>
        <button type="button" onClick={() => void discard()} disabled={!selected.length || busy} className={BTN_SECONDARY}>Supprimer</button>
        <p className="text-sm text-stone-400">{remainingToday > 0 ? `${plural(remainingToday, 'envoi restant', 'envois restants')} aujourd’hui` : 'Limite du jour atteinte, reprends demain'} · {MAX_SEND} par envoi maximum</p>
      </div>
      <ul role="list" className="space-y-3">
        {drafts.map((message) => (
          <li key={message.id} className="rounded-2xl border border-white/10 bg-[#161413] p-4">
            <div className="flex gap-3">
              <input type="checkbox" aria-label={`Sélectionner le message pour ${message.email}`} checked={selected.includes(message.id)} onChange={() => toggle(message.id)} className={`${CHECKBOX} mt-0.5`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 text-xs text-stone-400"><span className="font-mono text-stone-200">{message.email}</span> · {message.company}{GENERIC_EMAIL.test(message.email) && <span className="ml-2 text-amber-300">Boîte partagée : réponse moins probable</span>}</p>
                  {message.isFollowUp && <Badge tone="info">Relance</Badge>}
                </div>
                {editing === message.id ? (
                  <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)]">
                    <div className="space-y-3">
                    <div><label htmlFor={`sujet-${message.id}`} className="mb-1.5 block text-xs font-semibold text-stone-300">Sujet</label><input id={`sujet-${message.id}`} value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={200} className={FIELD} /></div>
                    <div><label htmlFor={`corps-${message.id}`} className="mb-1.5 block text-xs font-semibold text-stone-300">Message</label><textarea id={`corps-${message.id}`} value={body} onChange={(event) => setBody(event.target.value)} rows={10} maxLength={5000} className={`${FIELD} py-2 leading-6`} /></div>
                    <div className="flex gap-2"><button type="button" onClick={() => void save(message.id)} disabled={busy || !subject.trim() || !body.trim()} className={BTN_PRIMARY}>Enregistrer</button><button type="button" onClick={() => setEditing(null)} className={BTN_SECONDARY}>Annuler</button></div>
                    </div>
                    <EmailPreview subject={subject} body={body} />
                  </div>
                ) : (
                  <>
                    <p className="mt-2 font-semibold">{message.subject}</p>
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-stone-300">{message.body}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => prepareSingleSend(message)} disabled={busy || remainingToday <= 0} className={BTN_PRIMARY}>Envoyer ce message</button>
                      <button type="button" onClick={() => setPreviewing(previewing === message.id ? null : message.id)} className={BTN_SMALL}>{previewing === message.id ? 'Masquer l’aperçu' : 'Aperçu du mail'}</button>
                      <button type="button" onClick={() => startEdit(message)} className={BTN_SMALL}>Modifier</button>
                      <span className="text-xs text-stone-500">ou coche-le pour un envoi groupé</span>
                    </div>
                    {previewing === message.id && <EmailPreview subject={message.subject} body={message.body} />}
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onKeyDown={(event) => { if (event.key === 'Escape') setConfirming(false) }}>
          <div role="dialog" aria-modal="true" aria-labelledby="envoi-titre" className="w-full max-w-md rounded-2xl border border-white/15 bg-[#1c1917] p-6 shadow-2xl">
            <h2 id="envoi-titre" className="text-xl font-semibold">Envoyer {plural(willSend, 'email', 'emails')} ?</h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">Les messages partent maintenant, depuis ton adresse Qualio. Tu suivras leur statut dans l’onglet Suivi.</p>
            {selected.length > willSend && <p className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-300">Limite du jour : seuls {willSend} sur {selected.length} partiront. Les autres restent en brouillon.</p>}
            <div className="mt-6 flex justify-end gap-2">
              <button ref={cancelRef} type="button" onClick={() => setConfirming(false)} className={BTN_SECONDARY}>Annuler</button>
              <button type="button" onClick={() => void send()} disabled={busy || willSend === 0} className={BTN_PRIMARY}>{busy ? 'Envoi…' : 'Envoyer maintenant'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmailPreview({ subject, body }: { subject: string; body: string }) {
  const { html } = renderAcquisitionEmail({ subject, body })
  return <div className="rounded-xl border border-white/10 bg-white p-2 text-left">
    <div className="mb-2 flex items-center justify-between px-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500"><span>Aperçu envoyé au prospect</span><span>fond blanc · logo · pied de mail</span></div>
    <iframe title={`Aperçu de ${subject}`} srcDoc={html} sandbox="" className="h-[25rem] w-full rounded-lg border border-stone-200 bg-white" />
  </div>
}
