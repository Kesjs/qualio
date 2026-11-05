'use client'

import { useState } from 'react'
import { ArrowTopRightOnSquareIcon, DocumentChartBarIcon } from '@heroicons/react/20/solid'
import { Badge, BTN_PRIMARY, BTN_SECONDARY, EmptyState, TableRegion, TD, TH } from '@/components/admin/ui'
import { BTN_SMALL, BTN_SMALL_ACCENT, CHECKBOX, plural, postJson, type Notify, type ReportTarget } from '@/components/admin/acquisition-shared'
import type { QueueItem } from '@/lib/admin/acquisition'

const STATE: Record<QueueItem['state'], { label: string; tone: 'warning' | 'accent' | 'danger'; action: string }> = {
  scan: { label: 'À scanner', tone: 'warning', action: 'Scanner & rédiger' },
  ready: { label: 'Prêt', tone: 'accent', action: 'Rédiger' },
  empty: { label: 'Sans email', tone: 'danger', action: 'Rescanner' },
}

function scoreTone(score: number | null) {
  if (score == null) return 'neutral' as const
  if (score >= 70) return 'success' as const
  if (score >= 40) return 'warning' as const
  return 'neutral' as const
}

export function AcquisitionQueue({
  items,
  notify,
  refresh,
  onCreateReport,
}: {
  items: QueueItem[]
  notify: Notify
  refresh: () => void
  onCreateReport: (target: ReportTarget) => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [includeShared, setIncludeShared] = useState(true)
  const [onlyWithReviews, setOnlyWithReviews] = useState(false)
  const [onlyWithEmail, setOnlyWithEmail] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const working = progress !== null

  // Modal d'ajout ou modification manuelle de contact
  const [contactModal, setContactModal] = useState<{
    companyId: string
    companyName: string
    domain: string
    contactId?: string
    email?: string
    fullName?: string
  } | null>(null)
  const [modalEmail, setModalEmail] = useState('')
  const [modalFullName, setModalFullName] = useState('')
  const [savingContact, setSavingContact] = useState(false)

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  const visibleItems = items.filter((item) => {
    const hasNamedContact = item.contacts.some((contact) => !contact.generic)
    if (!includeShared && item.contacts.length > 0 && !hasNamedContact) return false
    if (onlyWithReviews && item.reviewSources.length === 0 && !item.report) return false
    if (onlyWithEmail && item.contacts.length === 0) return false
    return true
  })
  const allSelected = visibleItems.length > 0 && selected.length === visibleItems.length

  function openContactModalFor(companyId: string, companyName: string, domain: string, contactId?: string, email?: string, fullName?: string) {
    setContactModal({ companyId, companyName, domain, contactId, email, fullName })
    setModalEmail(email ?? '')
    setModalFullName(fullName ?? '')
  }

  async function handleSaveContact(event: React.FormEvent) {
    event.preventDefault()
    if (!contactModal || !modalEmail.trim()) return
    setSavingContact(true)
    const { ok, data } = await postJson('/api/admin/acquisition/contacts', {
      companyId: contactModal.companyId,
      contactId: contactModal.contactId,
      email: modalEmail.trim(),
      fullName: modalFullName.trim() || undefined,
    })
    setSavingContact(false)
    if (!ok) {
      return notify('error', data.error ?? 'Impossible d’enregistrer ce contact.')
    }
    setContactModal(null)
    refresh()
    notify('success', `Contact ${modalEmail.trim()} enregistré pour ${contactModal.companyName}. Prêt à être rédigé !`)
  }

  async function prepare(ids: string[]) {
    let drafted = 0
    let noEmail = 0
    let existing = 0
    for (let index = 0; index < ids.length; index += 1) {
      setProgress({ done: index, total: ids.length })
      const { ok, data } = await postJson('/api/admin/acquisition/prepare', { companyId: ids[index] })
      if (!ok) {
        setProgress(null)
        refresh()
        return notify(
          'error',
          `${data.error ?? 'La préparation a échoué.'} ${drafted ? `${plural(drafted, 'brouillon prêt', 'brouillons prêts')} avant l’erreur.` : ''}`.trim(),
        )
      }
      if (data.drafted) drafted += 1
      else if (!data.emails) noEmail += 1
      else existing += 1
    }
    setProgress(null)
    setSelected([])
    refresh()
    const parts = [
      noEmail ? `${plural(noEmail, 'site sans email public', 'sites sans email public')}` : '',
      existing ? `${existing} déjà en brouillon` : '',
    ]
      .filter(Boolean)
      .join(', ')
    if (drafted) notify('success', `${plural(drafted, 'brouillon prêt', 'brouillons prêts')} à relire${parts ? ` (${parts})` : ''}.`, 'drafts')
    else notify('info', parts || 'Aucun nouveau brouillon à créer.')
  }

  async function archive() {
    const { ok, data } = await postJson('/api/admin/acquisition/archive', { companyIds: selected })
    if (!ok) return notify('error', data.error ?? 'Archivage impossible.')
    setSelected([])
    refresh()
    notify('success', `${plural(data.archived, 'prospect archivé', 'prospects archivés')}.`)
  }

  function openStudioFor(item: QueueItem) {
    const appStore = item.reviewSources.find((s) => s.type === 'app_store')?.url ?? null
    const external = item.reviewSources.find((s) => s.type !== 'app_store') ?? null
    onCreateReport({
      companyId: item.id,
      companyName: item.name,
      domain: item.domain,
      appStoreUrl: appStore,
      externalSource: external ? { label: external.label, url: external.url } : null,
    })
  }

  if (!items.length) {
    return (
      <EmptyState
        title="File de prospection vide"
        description="Lance une recherche ciblée (Agences, SaaS ou E-commerce) dans le panneau « Ajouter des prospects » ci-dessous."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-10 items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? [] : visibleItems.map((item) => item.id))}
            className={CHECKBOX}
          />
          Tout sélectionner
        </label>
        <button
          type="button"
          onClick={() => void prepare(selected)}
          disabled={!selected.length || working}
          className={BTN_PRIMARY}
        >
          {working ? `Analyse ${progress.done + 1}/${progress.total}…` : `Préparer (${selected.length})`}
        </button>
        <button type="button" onClick={() => void archive()} disabled={!selected.length || working} className={BTN_SECONDARY}>
          Archiver
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-4">
          <label className="flex min-h-10 items-center gap-2 text-xs font-medium text-gray-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={onlyWithEmail}
              onChange={(event) => {
                setOnlyWithEmail(event.target.checked)
                setSelected([])
              }}
              className={CHECKBOX}
            />
            Prêts avec email ({items.filter((i) => i.contacts.length > 0).length})
          </label>
          <label className="flex min-h-10 items-center gap-2 text-xs font-medium text-gray-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={includeShared}
              onChange={(event) => {
                setIncludeShared(event.target.checked)
                setSelected([])
              }}
              className={CHECKBOX}
            />
            Inclure boîtes partagées (hello@, contact@)
          </label>
          <label className="flex min-h-10 items-center gap-2 text-xs font-medium text-gray-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={onlyWithReviews}
              onChange={(event) => {
                setOnlyWithReviews(event.target.checked)
                setSelected([])
              }}
              className={CHECKBOX}
            />
            Avec source d’avis ou rapport
          </label>
        </div>
      </div>

      {working && progress && (
        <div role="status" className="space-y-1.5">
          <div className="flex justify-between font-mono text-xs tabular-nums text-gray-600 dark:text-zinc-400">
            <span>Scan des pages légales, sources d’avis et rédaction des brouillons…</span>
            <span>
              {progress.done + 1} / {progress.total}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]">
            <span
              className="block h-full rounded-full bg-[#ee6018] transition-all duration-200"
              style={{ width: `${Math.round(((progress.done + 1) / Math.max(1, progress.total)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {visibleItems.length !== items.length && (
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          Affichage filtré : <span className="font-mono tabular-nums">{visibleItems.length}</span> sur{' '}
          <span className="font-mono tabular-nums">{items.length}</span> prospects.
        </p>
      )}

      <TableRegion label="Prospects à contacter">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={`${TH} w-10`}>
                <span className="sr-only">Sélection</span>
              </th>
              <th className={TH}>Prospect &amp; pertinence</th>
              <th className={TH}>Sources d’avis &amp; rapport</th>
              <th className={TH}>Contact détecté</th>
              <th className={`${TH} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => {
              const meta = STATE[item.state]
              const first = item.contacts[0]
              const actionLabel = item.report && item.state === 'ready' ? 'Rédiger avec rapport' : meta.action
              return (
                <tr key={item.id} className="border-t border-gray-100 align-top dark:border-white/[0.06]">
                  <td className={TD}>
                    <input
                      type="checkbox"
                      aria-label={`Sélectionner ${item.name}`}
                      checked={selected.includes(item.id)}
                      onChange={() => toggle(item.id)}
                      disabled={working}
                      className={`${CHECKBOX} mt-1`}
                    />
                  </td>
                  <td className={`${TD} max-w-[18rem]`}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <a
                        href={`https://${item.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-gray-900 hover:underline dark:text-[#eeeeee]"
                      >
                        {item.name}
                      </a>
                      {item.isAgency && <Badge tone="info">Agence</Badge>}
                      {item.relevanceScore != null && (
                        <Badge tone={scoreTone(item.relevanceScore)}>
                          <span className="font-mono tabular-nums">{item.relevanceScore}</span>
                        </Badge>
                      )}
                    </div>
                    <span className="mt-0.5 block font-mono text-xs text-gray-500 dark:text-zinc-400">{item.domain}</span>
                    {item.notes && (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500 dark:text-zinc-400">
                        {item.notes.replace(/^IA Qualio \([^)]+\) · /, '')}
                      </p>
                    )}
                  </td>
                  <td className={TD}>
                    <div className="space-y-1.5">
                      {item.report ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone="success">
                            Rapport · {item.report.reviewCount} avis {item.report.sourceLabel}
                          </Badge>
                          {item.report.viewCount > 0 && (
                            <span className="font-mono text-[11px] font-semibold tabular-nums text-emerald-700 dark:text-[#a0ca92]">
                              {item.report.viewCount}× lu
                            </span>
                          )}
                          <a
                            href={`${item.report.url}?apercu=1`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-gray-600 hover:underline dark:text-zinc-300"
                          >
                            Aperçu <ArrowTopRightOnSquareIcon className="h-3 w-3" aria-hidden />
                          </a>
                        </div>
                      ) : item.reviewSources.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {item.reviewSources.map((src) => (
                            <a
                              key={src.type}
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 hover:underline dark:text-[#a0ca92]"
                            >
                              {src.label}
                              <ArrowTopRightOnSquareIcon className="h-2.5 w-2.5" aria-hidden />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-zinc-500">
                          {item.state === 'scan' ? 'Détecté au scan' : 'Aucune fiche liée sur le site'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={TD}>
                    {first ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-gray-900 dark:text-zinc-200">{first.email}</span>
                          <button
                            type="button"
                            onClick={() => openContactModalFor(item.id, item.name, item.domain, first.id, first.email, first.full_name ?? undefined)}
                            title="Modifier ce contact"
                            className="inline-flex h-5 w-5 items-center justify-center rounded text-[11px] text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                          >
                            ✎
                          </button>
                        </div>
                        {item.contacts.length > 1 && (
                          <span className="ml-1 font-mono text-[11px] text-gray-500 dark:text-zinc-500">
                            +{item.contacts.length - 1}
                          </span>
                        )}
                        {first.full_name && (
                          <span className="block text-xs text-gray-600 dark:text-zinc-400">{first.full_name}</span>
                        )}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                          {first.generic ? (
                            <span className="text-amber-700 dark:text-amber-300">Boîte partagée</span>
                          ) : (
                            <span className="text-emerald-700 dark:text-[#a0ca92]">Contact direct</span>
                          )}
                          {first.email_source_url && (
                            <a
                              href={first.email_source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-gray-500 hover:underline dark:text-zinc-400"
                            >
                              source
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start gap-1">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <button
                          type="button"
                          onClick={() => openContactModalFor(item.id, item.name, item.domain)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c2410c] hover:underline dark:text-[#ff9a66]"
                        >
                          + Ajouter email
                        </button>
                      </div>
                    )}
                  </td>
                  <td className={`${TD} text-right`}>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button type="button" onClick={() => openStudioFor(item)} disabled={working} className={BTN_SMALL}>
                        <DocumentChartBarIcon className="h-3.5 w-3.5 text-[#c2410c] dark:text-[#ff9a66]" aria-hidden />
                        {item.report ? 'Refaire rapport' : 'Créer rapport'}
                      </button>
                      <button type="button" onClick={() => void prepare([item.id])} disabled={working} className={BTN_SMALL_ACCENT}>
                        {actionLabel}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableRegion>

      {contactModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-xs"
          onClick={(event) => {
            if (event.target === event.currentTarget && !savingContact) setContactModal(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !savingContact) setContactModal(null)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/[0.12] dark:bg-[#16181E]"
          >
            <h2 id="contact-modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
              {contactModal.contactId ? 'Modifier le contact' : 'Ajouter un contact'}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
              Pour <strong className="text-gray-900 dark:text-white">{contactModal.companyName}</strong> ({contactModal.domain})
            </p>

            <form onSubmit={handleSaveContact} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Adresse email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  placeholder={`contact@${contactModal.domain.replace(/^www\./, '')}`}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#ee6018] dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:focus:border-[#ee6018]"
                />
                {!contactModal.contactId && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-gray-500 dark:text-zinc-400">Suggestions :</span>
                    {[
                      `contact@${contactModal.domain.replace(/^www\./, '')}`,
                      `hello@${contactModal.domain.replace(/^www\./, '')}`,
                    ].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setModalEmail(sug)}
                        className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-gray-700 hover:border-gray-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Nom du dirigeant ou contact (optionnel)
                </label>
                <input
                  type="text"
                  value={modalFullName}
                  onChange={(e) => setModalFullName(e.target.value)}
                  placeholder="Ex. Alexandre Martin, Sophie…"
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#ee6018] dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:focus:border-[#ee6018]"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={savingContact}
                  onClick={() => setContactModal(null)}
                  className={BTN_SECONDARY}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingContact || !modalEmail.includes('@')}
                  className={BTN_PRIMARY}
                >
                  {savingContact ? 'Enregistrement…' : 'Enregistrer et rendre prêt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
