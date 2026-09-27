'use client'
import { useState } from 'react'
import Image from 'next/image'
import { CameraIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline'
import { useScreenshotSignedUrl } from '@/lib/hooks/useScreenshots'

interface ScreenshotViewerProps {
  screenshotId: string
  viewport?: string
  createdAt?: string | null
  onClickZoom?: () => void
  className?: string
}

/**
 * Composant d'affichage d'un screenshot dans le drawer
 * - Charge l'URL signée à la demande
 * - Utilise next/image pour l'optimisation
 * - Cursor zoom-in pour indiquer qu'on peut cliquer
 * - Gestion des états : chargement, erreur, absent
 */
export function ScreenshotViewer({
  screenshotId,
  viewport,
  createdAt,
  onClickZoom,
  className = '',
}: ScreenshotViewerProps) {
  const [imageError, setImageError] = useState(false)

  const { data, isLoading, error } = useScreenshotSignedUrl(screenshotId, !!screenshotId)

  // État: Chargement
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#16181E] p-3 text-xs text-gray-600 dark:text-gray-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CameraIcon className="h-4 w-4 text-[#ee6018]" />
            <span>Capture d'écran au moment de la rupture Playwright</span>
          </div>
          {viewport && (
            <span className="font-mono text-[11px] text-gray-400">
              {viewport} (Desktop Chrome)
            </span>
          )}
        </div>

        {/* Skeleton de chargement */}
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] overflow-hidden bg-gray-100 dark:bg-[#16181E] animate-pulse">
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center space-y-3">
              <CameraIcon className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto animate-pulse" />
              <p className="text-xs text-gray-400 font-mono">Chargement de la capture...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // État: Erreur de chargement de l'URL signée
  if (error || !data?.signedUrl) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#16181E] p-3 text-xs text-gray-600 dark:text-gray-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CameraIcon className="h-4 w-4 text-[#ee6018]" />
            <span>Capture d'écran au moment de la rupture Playwright</span>
          </div>
          {viewport && (
            <span className="font-mono text-[11px] text-gray-400">
              {viewport}
            </span>
          )}
        </div>

        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-6 text-center space-y-3">
          <CameraIcon className="h-10 w-10 text-amber-500 mx-auto" />
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Screenshot indisponible
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            L'image n'a pas pu être chargée. Le fichier a peut-être été supprimé ou l'accès a expiré.
          </p>
        </div>
      </div>
    )
  }

  // État: Erreur de chargement de l'image elle-même
  if (imageError) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#16181E] p-3 text-xs text-gray-600 dark:text-gray-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CameraIcon className="h-4 w-4 text-[#ee6018]" />
            <span>Capture d'écran au moment de la rupture Playwright</span>
          </div>
          <span className="font-mono text-[11px] text-gray-400">
            {data.viewport}
          </span>
        </div>

        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-6 text-center space-y-3">
          <CameraIcon className="h-10 w-10 text-amber-500 mx-auto" />
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Erreur de chargement de l'image
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Le fichier existe mais n'a pas pu être affiché.
          </p>
        </div>
      </div>
    )
  }

  // État: Screenshot disponible et affiché
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header avec métadonnées */}
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#16181E] p-3 text-xs text-gray-600 dark:text-gray-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CameraIcon className="h-4 w-4 text-[#ee6018]" />
          <span>Capture d'écran au moment de la rupture Playwright</span>
        </div>
        <span className="font-mono text-[11px] text-gray-400">
          {data.viewport} (Desktop Chrome)
        </span>
      </div>

      {/* Image avec next/image + cursor zoom-in */}
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] overflow-hidden bg-black/5 dark:bg-black/40 relative group">
        <div
          className={`relative ${onClickZoom ? 'cursor-zoom-in' : ''}`}
          onClick={onClickZoom}
          role={onClickZoom ? 'button' : undefined}
          tabIndex={onClickZoom ? 0 : undefined}
          onKeyDown={(e) => {
            if (onClickZoom && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              onClickZoom()
            }
          }}
        >
          <Image
            src={data.signedUrl}
            alt="Capture de preuve Playwright"
            width={1440}
            height={900}
            className="w-full h-auto object-contain rounded-lg"
            style={{ maxHeight: '60vh' }}
            onError={() => setImageError(true)}
            priority={false}
            loading="lazy"
          />

          {/* Overlay au hover pour indiquer qu'on peut cliquer */}
          {onClickZoom && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-white dark:bg-gray-900 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
                <MagnifyingGlassPlusIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Cliquer pour agrandir
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date de capture */}
      {data.createdAt && (
        <div className="text-[11px] text-gray-500 dark:text-gray-400 text-center font-mono">
          Capturé le {new Date(data.createdAt).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Composant pour afficher un message quand aucun screenshot n'est disponible
 */
export function NoScreenshotAvailable({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#16181E] p-3 text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
        <CameraIcon className="h-4 w-4 text-gray-400" />
        <span>Aucune capture d'écran</span>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-[#16181E]/50 p-8 text-center space-y-3">
        <CameraIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Aucune capture disponible pour cette preuve
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 max-w-sm mx-auto">
          Ce type de preuve ne nécessite pas de screenshot, ou la capture n'a pas été réalisée pendant ce scan.
        </p>
      </div>
    </div>
  )
}
