'use client'

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownTrayIcon, ClipboardDocumentIcon, DocumentArrowDownIcon, EnvelopeIcon, LinkIcon, LockClosedIcon, NoSymbolIcon, ShareIcon, TableCellsIcon } from '@heroicons/react/24/outline'
import type { ActionItem, FeedbackItem } from '@/lib/feedback/types'
import type { PlanId } from '@/lib/billing/plans'
import { redactPersonalInfo } from '@/lib/feedback/redact'
import { buildMailto, buildTaskText, type TaskReview } from '@/lib/feedback/task-text'
import { btnSecondary } from './bricks'

const ITEM = 'flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#c2410c] disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-100 dark:hover:bg-white/[0.06]'
const ICON = 'h-4 w-4 shrink-0 text-gray-600 dark:text-zinc-400'

async function fetchReviews(siteId: string, ids: string[]): Promise<TaskReview[]> {
  if (!ids.length) return []
  const params = new URLSearchParams({ siteId, status: 'all', ids: ids.slice(0, 5).join(',') })
  const response = await fetch(`/api/feedback/list?${params}`)
  if (!response.ok) return []
  const body = (await response.json()) as { items: FeedbackItem[] }
  // Les coordonnées personnelles sont masquées : le texte part vers d'autres personnes.
  return body.items.map((item) => ({ content: redactPersonalInfo(item.content), created_at: item.created_at, source: item.source }))
}

type ShareState = { allowed: boolean; active: boolean; url: string | null }

/**
 * Menu « Partager la tâche » : copier le texte, e-mail (mailto), CSV pour tous ;
 * lien de partage et PDF pour Pro et Agence. Le lien se coupe à tout moment avec « Arrêter le partage ».
 */
export function ShareMenu({ siteId, action, plan }: { siteId: string; action: ActionItem; plan: PlanId | undefined }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const queryClient = useQueryClient()
  const locked = plan === 'free'

  const shareKey = ['task-share', action.id]
  const { data: share } = useQuery({
    queryKey: shareKey,
    enabled: open && !locked,
    staleTime: 15_000,
    queryFn: async () => {
      const response = await fetch(`/api/shares?recommendationId=${encodeURIComponent(action.id)}`)
      if (!response.ok) throw new Error('Impossible de lire l’état du partage.')
      return (await response.json()) as ShareState
    },
  })

  const close = useCallback(() => setOpen(false), [])
  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) close() }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { close(); rootRef.current?.querySelector<HTMLButtonElement>('button[aria-haspopup]')?.focus() }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])
        if (!items.length) return
        event.preventDefault()
        const index = items.indexOf(document.activeElement as HTMLElement)
        items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [open, close])

  const run = async (task: () => Promise<void>) => {
    setBusy(true)
    try { await task() } catch (error) { toast.error(error instanceof Error ? error.message : 'Action impossible pour le moment.') } finally { setBusy(false) }
  }

  const copyText = () => run(async () => {
    const reviews = await fetchReviews(siteId, action.feedback_ids)
    await navigator.clipboard.writeText(buildTaskText(action, reviews))
    toast.success('Texte de la tâche copié')
    close()
  })

  const sendMail = () => run(async () => {
    const reviews = await fetchReviews(siteId, action.feedback_ids)
    close()
    window.location.href = buildMailto(action, reviews)
  })

  const createLink = () => run(async () => {
    const response = await fetch('/api/shares', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recommendationId: action.id }) })
    const body = await response.json().catch(() => null) as { url?: string; error?: string } | null
    if (!response.ok || !body?.url) throw new Error(body?.error ?? 'Impossible de créer le lien.')
    await navigator.clipboard?.writeText(body.url).catch(() => undefined)
    queryClient.setQueryData<ShareState>(shareKey, { allowed: true, active: true, url: body.url })
    toast.success('Lien de partage copié', { description: 'Toute personne qui a ce lien voit la tâche et les avis cités. Vous pouvez arrêter le partage à tout moment.', duration: 8000 })
    close()
  })

  const copyLink = () => run(async () => {
    if (!share?.url) return
    await navigator.clipboard.writeText(share.url)
    toast.success('Lien de partage copié')
    close()
  })

  const stopSharing = () => run(async () => {
    const response = await fetch(`/api/shares?recommendationId=${encodeURIComponent(action.id)}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Impossible d’arrêter le partage.')
    queryClient.setQueryData<ShareState>(shareKey, { allowed: true, active: false, url: null })
    toast.success('Partage arrêté : l’ancien lien ne fonctionne plus.')
    close()
  })

  const csvBase = `/api/feedback/recommendations/export?siteId=${encodeURIComponent(siteId)}`
  const lockedRow = (icon: ReactNode, label: string) => (
    <Link role="menuitem" href="/pricing" className={ITEM}>
      {icon}<span className="flex-1">{label}</span><span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-zinc-400"><LockClosedIcon className="h-3.5 w-3.5" aria-hidden="true" />Pro</span>
    </Link>
  )

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={() => setOpen((value) => !value)} className={btnSecondary}>
        <ShareIcon className="h-4 w-4" aria-hidden="true" />Partager la tâche
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label="Partager la tâche" className="absolute left-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-[#1D2027]">
          <button type="button" role="menuitem" disabled={busy} onClick={() => void copyText()} className={ITEM}><ClipboardDocumentIcon className={ICON} aria-hidden="true" />Copier le texte de la tâche</button>
          <button type="button" role="menuitem" disabled={busy} onClick={() => void sendMail()} className={ITEM}><EnvelopeIcon className={ICON} aria-hidden="true" />Envoyer par e-mail</button>
          <a role="menuitem" href={`${csvBase}&id=${encodeURIComponent(action.id)}`} onClick={close} className={ITEM}><ArrowDownTrayIcon className={ICON} aria-hidden="true" />Télécharger cette tâche (CSV)</a>
          <a role="menuitem" href={csvBase} onClick={close} className={ITEM}><TableCellsIcon className={ICON} aria-hidden="true" />Toutes les décisions acceptées (CSV)</a>
          <div className="my-1 border-t border-gray-200 dark:border-white/10" role="separator" />
          {locked ? (
            <>
              {lockedRow(<LinkIcon className={ICON} aria-hidden="true" />, 'Lien de partage')}
              {lockedRow(<DocumentArrowDownIcon className={ICON} aria-hidden="true" />, 'Enregistrer en PDF')}
            </>
          ) : (
            <>
              {share?.active ? (
                <>
                  <button type="button" role="menuitem" disabled={busy} onClick={() => void copyLink()} className={ITEM}><LinkIcon className={ICON} aria-hidden="true" />Copier le lien de partage</button>
                  <button type="button" role="menuitem" disabled={busy} onClick={() => void stopSharing()} className={`${ITEM} !text-red-700 dark:!text-red-300`}><NoSymbolIcon className="h-4 w-4 shrink-0" aria-hidden="true" />Arrêter le partage</button>
                </>
              ) : (
                <button type="button" role="menuitem" disabled={busy} onClick={() => void createLink()} className={ITEM}><LinkIcon className={ICON} aria-hidden="true" />Créer un lien de partage</button>
              )}
              <a role="menuitem" href={`/partage/apercu/${encodeURIComponent(action.id)}?imprimer=1`} target="_blank" rel="noopener" onClick={close} className={ITEM}><DocumentArrowDownIcon className={ICON} aria-hidden="true" />Enregistrer en PDF</a>
            </>
          )}
        </div>
      )}
    </div>
  )
}
