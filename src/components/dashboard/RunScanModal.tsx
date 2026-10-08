'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface AuditSite { id: string; url: string; name?: string | null; environment?: string | null; journeyDefinitions?: unknown }
interface RunScanModalProps {
  isOpen: boolean
  onClose: () => void
  site?: AuditSite | null
  availableSites?: AuditSite[]
  onSuccess?: (scanId: string) => void
}

/** Entry point only: discovery, consent and execution live on the audit page. */
export function RunScanModal({ isOpen, onClose, site, availableSites }: RunScanModalProps) {
  const router = useRouter()
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const activeSite = site || availableSites?.find(item => item.id === selectedSiteId) || availableSites?.[0]
  if (!isOpen) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={event => { if (event.key === 'Escape') onClose() }}>
    <button type="button" tabIndex={-1} aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />
    <section role="dialog" aria-modal="true" aria-labelledby="audit-entry-title" className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#16181E]">
      <div className="flex items-start justify-between gap-3"><h2 id="audit-entry-title" className="text-base font-bold">Audit des formulaires</h2><button autoFocus type="button" aria-label="Fermer" onClick={onClose} className="rounded-lg p-1 text-gray-500 focus-visible:outline-2 focus-visible:outline-[#ee6018]"><XMarkIcon className="h-5 w-5" /></button></div>
      {!site && !!availableSites?.length && <label className="mt-4 block text-xs font-semibold">Site à explorer<select value={activeSite?.id ?? ''} onChange={event => setSelectedSiteId(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 bg-transparent p-2 dark:border-white/10">{availableSites.map(item => <option key={item.id} value={item.id}>{item.name || item.url}</option>)}</select></label>}
      <p className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-zinc-400">Qualio détectera les formulaires sans les soumettre. Sur la page suivante, vous choisirez lesquels tester et autoriserez leurs soumissions réelles.</p>
      <p className="mt-3 break-all text-xs text-gray-500">{activeSite?.url ?? 'Ajoutez un site pour préparer un audit.'}</p>
      <button type="button" disabled={!activeSite} onClick={() => { if (activeSite) { router.push(`/dashboard/sites/${activeSite.id}/audit`); onClose() } }} className="mt-5 w-full rounded-lg bg-[#ee6018] px-4 py-3 text-xs font-semibold text-white hover:bg-[#d95514] disabled:opacity-50">Découvrir les formulaires</button>
    </section>
  </div>
}
