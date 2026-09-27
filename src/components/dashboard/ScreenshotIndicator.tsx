'use client'
import { useState } from 'react'
import Image from 'next/image'
import { CameraIcon } from '@heroicons/react/24/outline'
import { useScreenshotSignedUrl } from '@/lib/hooks/useScreenshots'

interface ScreenshotIndicatorProps {
  screenshotId: string
  issueTitle?: string
  className?: string
}

/**
 * Indicateur de screenshot dans la liste des incidents
 * - Icône caméra + texte "Screenshot disponible"
 * - Au survol : affiche un aperçu flottant (thumbnail)
 * - Lazy loading : charge uniquement au hover
 * - Pas de nouvelle dépendance : position absolute + next/image
 */
export function ScreenshotIndicator({
  screenshotId,
  issueTitle,
  className = '',
}: ScreenshotIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Charger l'URL signée uniquement au hover
  const { data, isLoading } = useScreenshotSignedUrl(screenshotId, isHovered)

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setImageError(false)
      }}
    >
      {/* Indicateur visible en permanence */}
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors">
        <CameraIcon className="h-3.5 w-3.5" />
        <span>Screenshot disponible</span>
      </div>

      {/* Aperçu flottant au hover */}
      {isHovered && (
        <div
          className="absolute left-0 top-full mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ width: '320px' }}
        >
          <div className="bg-white dark:bg-[#111216] rounded-xl shadow-2xl border border-gray-200 dark:border-white/[0.08] overflow-hidden">
            {/* Header du tooltip */}
            <div className="px-3 py-2 bg-gray-50 dark:bg-[#16181E] border-b border-gray-200 dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <CameraIcon className="h-3.5 w-3.5 text-[#ee6018] flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                  {issueTitle || 'Aperçu du screenshot'}
                </span>
              </div>
            </div>

            {/* Aperçu de l'image */}
            <div className="p-2 bg-gray-100 dark:bg-[#0A0B0E]">
              {isLoading ? (
                // Skeleton de chargement
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
                  <CameraIcon className="h-8 w-8 text-gray-400 dark:text-gray-600 animate-pulse" />
                </div>
              ) : imageError || !data?.signedUrl ? (
                // Erreur de chargement
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2 p-4">
                    <CameraIcon className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Aperçu indisponible
                    </p>
                  </div>
                </div>
              ) : (
                // Image thumbnail
                <div className="relative w-full rounded-lg overflow-hidden bg-black/5 dark:bg-black/40">
                  <Image
                    src={data.signedUrl}
                    alt="Aperçu du screenshot"
                    width={320}
                    height={200}
                    className="w-full h-auto object-contain rounded-lg"
                    style={{ maxHeight: '200px' }}
                    onError={() => setImageError(true)}
                    loading="lazy"
                    quality={60}
                  />
                </div>
              )}
            </div>

            {/* Footer du tooltip */}
            {data?.viewport && (
              <div className="px-3 py-2 bg-gray-50 dark:bg-[#16181E] border-t border-gray-200 dark:border-white/[0.08]">
                <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                  <span className="font-mono">{data.viewport}</span>
                  {data.createdAt && (
                    <span>
                      {new Date(data.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Petite flèche pointant vers l'indicateur */}
          <div className="absolute left-4 -top-1.5 w-3 h-3 bg-white dark:bg-[#111216] border-l border-t border-gray-200 dark:border-white/[0.08] transform rotate-45" />
        </div>
      )}
    </div>
  )
}

/**
 * Variante compacte : juste l'icône caméra sans texte
 * Pour les listes très denses
 */
export function ScreenshotIndicatorCompact({
  screenshotId,
  issueTitle,
  className = '',
}: ScreenshotIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  const { data, isLoading } = useScreenshotSignedUrl(screenshotId, isHovered)

  return (
    <div
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setImageError(false)
      }}
    >
      {/* Icône seule */}
      <div
        className="h-6 w-6 flex items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
        title="Screenshot disponible"
      >
        <CameraIcon className="h-3.5 w-3.5" />
      </div>

      {/* Aperçu flottant identique à la version normale */}
      {isHovered && (
        <div
          className="absolute left-0 top-full mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ width: '320px' }}
        >
          <div className="bg-white dark:bg-[#111216] rounded-xl shadow-2xl border border-gray-200 dark:border-white/[0.08] overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 dark:bg-[#16181E] border-b border-gray-200 dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <CameraIcon className="h-3.5 w-3.5 text-[#ee6018] flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                  {issueTitle || 'Aperçu du screenshot'}
                </span>
              </div>
            </div>

            <div className="p-2 bg-gray-100 dark:bg-[#0A0B0E]">
              {isLoading ? (
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse flex items-center justify-center">
                  <CameraIcon className="h-8 w-8 text-gray-400 dark:text-gray-600 animate-pulse" />
                </div>
              ) : imageError || !data?.signedUrl ? (
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2 p-4">
                    <CameraIcon className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Aperçu indisponible
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative w-full rounded-lg overflow-hidden bg-black/5 dark:bg-black/40">
                  <Image
                    src={data.signedUrl}
                    alt="Aperçu du screenshot"
                    width={320}
                    height={200}
                    className="w-full h-auto object-contain rounded-lg"
                    style={{ maxHeight: '200px' }}
                    onError={() => setImageError(true)}
                    loading="lazy"
                    quality={60}
                  />
                </div>
              )}
            </div>

            {data?.viewport && (
              <div className="px-3 py-2 bg-gray-50 dark:bg-[#16181E] border-t border-gray-200 dark:border-white/[0.08]">
                <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                  <span className="font-mono">{data.viewport}</span>
                  {data.createdAt && (
                    <span>
                      {new Date(data.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="absolute left-4 -top-1.5 w-3 h-3 bg-white dark:bg-[#111216] border-l border-t border-gray-200 dark:border-white/[0.08] transform rotate-45" />
        </div>
      )}
    </div>
  )
}
