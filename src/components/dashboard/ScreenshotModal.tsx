'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  XMarkIcon,
  CameraIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline'

interface ScreenshotModalProps {
  isOpen: boolean
  onClose: () => void
  signedUrl: string
  viewport: string
  createdAt: string | null
  issueTitle?: string
}

/**
 * Modal plein écran pour afficher un screenshot en haute résolution
 * - Pas de lib externe (modal maison)
 * - Fermeture par ESC, clic sur backdrop, ou bouton X
 * - Image en pleine résolution avec next/image
 * - Design cohérent avec le dashboard
 */
export function ScreenshotModal({
  isOpen,
  onClose,
  signedUrl,
  viewport,
  createdAt,
  issueTitle,
}: ScreenshotModalProps) {
  const [imageError, setImageError] = useState(false)

  // Fermeture par ESC
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Bloquer le scroll du body quand la modal est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop avec blur */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-label="Fermer la modal"
      />

      {/* Conteneur de la modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className="relative w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col bg-white dark:bg-[#111216] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/[0.08] animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-white/[0.08] bg-gray-50/70 dark:bg-[#16181E]/60 rounded-t-2xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-[#ee6018]/10 flex items-center justify-center">
                  <CameraIcon className="h-5 w-5 text-[#ee6018]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {issueTitle || 'Screenshot Playwright'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {viewport}
                    </span>
                    {createdAt && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(createdAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body — Image en pleine résolution */}
          <div className="flex-1 overflow-auto p-6 bg-gray-100 dark:bg-[#0A0B0E]">
            {imageError ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 p-8 rounded-xl bg-white dark:bg-[#111216] border border-amber-200 dark:border-amber-900/50">
                  <CameraIcon className="h-16 w-16 text-amber-500 mx-auto" />
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      Erreur de chargement
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      L'image n'a pas pu être affichée en pleine résolution.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="relative rounded-lg overflow-hidden shadow-2xl border border-gray-300 dark:border-white/[0.12] bg-white dark:bg-[#111216]">
                  <Image
                    src={signedUrl}
                    alt="Screenshot Playwright en pleine résolution"
                    width={1920}
                    height={1080}
                    className="max-w-full max-h-[calc(95vh-140px)] w-auto h-auto object-contain"
                    onError={() => setImageError(true)}
                    priority
                    quality={95}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer — Info & actions */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-[#16181E]/40 rounded-b-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowsPointingInIcon className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[11px]">ESC</kbd> ou cliquez en dehors pour fermer
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
