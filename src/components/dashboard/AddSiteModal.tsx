'use client'
import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { useCreateSite } from '@/lib/hooks/useSites'
import { normalizeUserUrl } from '@/lib/qa/utils'

interface AddSiteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (siteId: string) => void
}

export function AddSiteModal({ isOpen, onClose, onSuccess }: AddSiteModalProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [environment, setEnvironment] = useState<'production' | 'staging'>('production')
  const [error, setError] = useState<string | null>(null)

  const createSite = useCreateSite()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

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
        environment,
      },
      {
        onSuccess: (newSite) => {
          setName('')
          setUrl('')
          setEnvironment('production')
          setError(null)
          onSuccess?.(newSite.id)
          onClose()
        },
        onError: (err) => {
          setError(err.message || "Erreur lors de l'ajout du site.")
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-[#16181E] p-6 shadow-2xl border border-gray-100 dark:border-white/[0.08] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white font-sans">
              Ajouter un nouveau site
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Enregistrez un environnement web à surveiller.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:bg-white/[0.06] transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50/80 border border-red-200 dark:bg-rose-500/10 dark:border-rose-500/20 text-xs text-red-700 dark:text-rose-400">
              <ExclamationCircleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="leading-snug">{error}</p>
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
              Nom du projet <span className="text-gray-400 dark:text-zinc-500 font-normal">(Optionnel)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Acme Marketing, Boutique Front"
              className="w-full px-3.5 py-2 text-sm bg-gray-50/80 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ee6018]/20 focus:border-[#ee6018] focus:bg-white dark:bg-[#111216] dark:border-white/[0.08] dark:text-white dark:placeholder:text-zinc-500 dark:focus:bg-[#111216] transition-all font-sans"
            />
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
              URL de base <span className="text-[#ee6018]">*</span>
            </label>
            <div className="relative">
              <GlobeAltIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
              <input
                type="url"
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

          {/* Environment Segmented Control */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
              Environnement
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-gray-100/80 border border-gray-200/60 dark:bg-[#111216] dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setEnvironment('production')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  environment === 'production'
                    ? 'bg-white text-gray-900 shadow-xs dark:bg-[#16181E] dark:text-white dark:shadow-none'
                    : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Production
              </button>
              <button
                type="button"
                onClick={() => setEnvironment('staging')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                  environment === 'staging'
                    ? 'bg-white text-gray-900 shadow-xs dark:bg-[#16181E] dark:text-white dark:shadow-none'
                    : 'text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Staging
              </button>
            </div>
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
      </div>
    </div>
  )
}
