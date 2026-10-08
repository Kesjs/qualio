'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog } from '@base-ui/react/dialog'
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
  return <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose() }}>
    <Dialog.Portal>
    <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs" />
    <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
    <Dialog.Popup className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#16181E]">
      <div className="flex items-start justify-between gap-3"><Dialog.Title className="text-base font-bold">Audit des formulaires</Dialog.Title><Dialog.Close type="button" aria-label="Fermer" className="rounded-lg p-1 text-gray-500 focus-visible:outline-2 focus-visible:outline-[#ee6018]"><XMarkIcon className="h-5 w-5" /></Dialog.Close></div>
      {!site && !!availableSites?.length && <label className="mt-4 block text-xs font-semibold">Site à explorer<select value={activeSite?.id ?? ''} onChange={event => setSelectedSiteId(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 bg-transparent p-2 dark:border-white/10">{availableSites.map(item => <option key={item.id} value={item.id}>{item.name || item.url}</option>)}</select></label>}
      <Dialog.Description className="mt-4 text-sm leading-relaxed text-gray-500 dark:text-zinc-400">Qualio détectera les formulaires sans les soumettre. Sur la page suivante, vous choisirez lesquels tester et autoriserez leurs soumissions réelles.</Dialog.Description>
      <p className="mt-3 break-all text-xs text-gray-500">{activeSite?.url ?? 'Ajoutez un site pour préparer un audit.'}</p>
      <button type="button" disabled={!activeSite} onClick={() => { if (activeSite) { router.push(`/dashboard/sites/${activeSite.id}/audit`); onClose() } }} className="mt-5 w-full rounded-lg bg-[#ee6018] px-4 py-3 text-xs font-semibold text-white hover:bg-[#d95514] disabled:opacity-50">Découvrir les formulaires</button>
    </Dialog.Popup>
    </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog.Root>
}
