'use client'
import { useState, useEffect } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import {
  XMarkIcon,
  GlobeAltIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { useCreateSite } from '@/lib/hooks/useSites'
import type { SiteWithLastScan } from '@/lib/hooks/useSites'
import { normalizeUserUrl } from '@/lib/qa/utils'

interface AddSiteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (site: SiteWithLastScan) => void
}

const ADD_SITE_DRAFT_KEY = 'qualio:add-site-draft'

interface AddSiteDraft {
  name: string
  url: string
}

export function AddSiteModal({ isOpen, onClose, onSuccess }: AddSiteModalProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [draftRestored, setDraftRestored] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)

  const createSite = useCreateSite()

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(ADD_SITE_DRAFT_KEY)
      if (!rawDraft) return
      const draft = JSON.parse(rawDraft) as Partial<AddSiteDraft>
      if (typeof draft.name === 'string') setName(draft.name)
      if (typeof draft.url === 'string') setUrl(draft.url)
      if (typeof draft.name === 'string' || typeof draft.url === 'string') setDraftRestored(true)
    } catch {
      window.localStorage.removeItem(ADD_SITE_DRAFT_KEY)
    } finally {
      setDraftLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!draftLoaded) return
    if (!name && !url) {
      window.localStorage.removeItem(ADD_SITE_DRAFT_KEY)
      return
    }
    const draft: AddSiteDraft = { name, url }
    window.localStorage.setItem(ADD_SITE_DRAFT_KEY, JSON.stringify(draft))
  }, [draftLoaded, name, url])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Strict URL validation
    const trimmedUrl = normalizeUserUrl(url)
    if (!trimmedUrl) {
      setError("L'URL du site est requise.")
      return
    }

    try {
      const parsed = new URL(trimmedUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setError("L'URL doit commencer par http:// ou https://")
        return
      }
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        setError("Les adresses locales localhost ne sont pas accessibles par Playwright.")
        return
      }
    } catch {
      setError("Veuillez saisir une URL valide (ex: https://monsite.com).")
      return
    }

    createSite.mutate(
      {
        url: trimmedUrl,
        name: name.trim() || undefined,
        stackType: 'unknown',
        repositoryProvider: 'none',
      },
      {
        onSuccess: (newSite) => {
          setName('')
          setUrl('')
          window.localStorage.removeItem(ADD_SITE_DRAFT_KEY)
          setDraftRestored(false)
          setError(null)
          onSuccess?.(newSite)
          onClose()
        },
        onError: (err) => {
          setError(err.message || "Erreur lors de l'ajout du site.")
        },
      }
    )
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose() }}>
      <Dialog.Portal>
      {/* Backdrop */}
      <Dialog.Backdrop
        className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs transition-opacity"
      />
      <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">

      {/* Modal Dialog */}
      <Dialog.Popup className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white dark:bg-[#16181E] p-6 shadow-2xl border border-gray-100 dark:border-white/[0.08] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div>
            <Dialog.Title className="text-base font-bold text-gray-900 dark:text-white font-sans">
              Ajouter un nouveau site
            </Dialog.Title>
            <Dialog.Description className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Enregistrez un environnement web à surveiller.
            </Dialog.Description>
          </div>
          <Dialog.Close
            type="button"
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-white/[0.06] transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </Dialog.Close>
        </div>

        {draftRestored && (
          <div className="mt-4 rounded-lg border border-orange-200/70 bg-orange-50/70 px-3 py-2 text-[11px] text-orange-800 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-200">
            Votre saisie précédente a été restaurée après le rechargement de la page.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div role="alert" className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50/80 border border-red-200 dark:bg-rose-500/10 dark:border-rose-500/20 text-xs text-red-700 dark:text-rose-400">
              <ExclamationCircleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="leading-snug">{error}</p>
            </div>
          )}

          {/* Project Name */}
          <div>
            <label htmlFor="add-site-name" className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
              Nom du projet <span className="text-gray-400 dark:text-zinc-500 font-normal">(Optionnel)</span>
            </label>
            <input
              id="add-site-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Acme Marketing, Boutique Front"
              className="w-full px-3.5 py-2 text-sm bg-gray-50/80 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee6018]/20 focus:border-[#ee6018] focus:bg-white dark:bg-[#111216] dark:border-white/[0.08] dark:text-white dark:placeholder:text-zinc-500 dark:focus:bg-[#111216] transition-all font-sans"
            />
          </div>

          {/* Base URL */}
          <div>
            <label htmlFor="add-site-url" className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
              URL de base <span className="text-[#ee6018]">*</span>
            </label>
            <div className="relative">
              <GlobeAltIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
              <input
                id="add-site-url"
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://acme.com"
                required
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-gray-50/80 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee6018]/20 focus:border-[#ee6018] focus:bg-white dark:bg-[#111216] dark:border-white/[0.08] dark:text-white dark:placeholder:text-zinc-500 dark:focus:bg-[#111216] transition-all font-mono text-xs"
              />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
              Doit être accessible publiquement par les robots Playwright.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200/80 bg-gray-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-gray-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-400">
            Qualio vérifie votre site depuis l’extérieur. Aucun accès à votre dépôt ni à votre code source n’est nécessaire.
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-gray-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createSite.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ee6018] text-white text-xs font-semibold shadow-sm shadow-[#ee6018]/25 hover:bg-[#d95514] disabled:opacity-50 transition-all cursor-pointer"
            >
              {createSite.isPending ? (
                <>
                  <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                  <span>Ajout en cours...</span>
                </>
              ) : (
                <span>Ajouter le site</span>
              )}
            </button>
          </div>
        </form>
      </Dialog.Popup>
      </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
