'use client'
import { useState } from 'react'
import Image from 'next/image'
import { 
  CameraIcon, 
  CheckBadgeIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'
import { useScreenshotSignedUrl } from '@/lib/hooks/useScreenshots'
import { ScreenshotModal } from './ScreenshotModal'

interface BeforeAfterComparisonProps {
  beforeScreenshotId: string | null
  afterScreenshotId: string | null
  issueTitle?: string
  className?: string
}

/**
 * Composant de comparaison Before/After pour les incidents RESOLVED
 * - Deux images côte à côte (empilées sur mobile)
 * - Labels BEFORE / AFTER
 * - Réutilise ScreenshotViewer et ScreenshotModal de Phase 1
 * - Gestion des cas où un seul screenshot est disponible
 */
export function BeforeAfterComparison({
  beforeScreenshotId,
  afterScreenshotId,
  issueTitle,
  className = '',
}: BeforeAfterComparisonProps) {
  const [modalImage, setModalImage] = useState<'before' | 'after' | null>(null)

  // Charger les URLs signées pour les deux screenshots
  const { data: beforeData, isLoading: beforeLoading } = useScreenshotSignedUrl(
    beforeScreenshotId,
    !!beforeScreenshotId
  )
  const { data: afterData, isLoading: afterLoading } = useScreenshotSignedUrl(
    afterScreenshotId,
    !!afterScreenshotId
  )

  // Si aucun des deux n'est disponible, ne rien afficher
  if (!beforeScreenshotId && !afterScreenshotId) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Badge RESOLVED */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
        <CheckBadgeIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
            Incident résolu après rescan
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
            Comparez visuellement l'état avant et après correction
          </p>
        </div>
      </div>

      {/* Comparaison Before / After */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* BEFORE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-[#16181E] rounded-t-lg border-x border-t border-gray-200 dark:border-white/[0.08]">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              Before (scan initial)
            </span>
            {beforeData?.viewport && (
              <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                {beforeData.viewport}
              </span>
            )}
          </div>

          {beforeLoading ? (
            <ScreenshotSkeleton />
          ) : !beforeScreenshotId || !beforeData?.signedUrl ? (
            <ScreenshotUnavailable label="Screenshot avant correction indisponible" />
          ) : (
            <div
              className="relative rounded-b-lg overflow-hidden bg-gray-100 dark:bg-[#0A0B0E] border border-gray-200 dark:border-white/[0.08] cursor-zoom-in group"
              onClick={() => setModalImage('before')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setModalImage('before')
                }
              }}
            >
              <Image
                src={beforeData.signedUrl}
                alt="Screenshot avant correction"
                width={720}
                height={450}
                className="w-full h-auto object-contain"
                style={{ maxHeight: '400px' }}
                loading="lazy"
                quality={75}
              />
              
              {/* Overlay au hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white dark:bg-gray-900 rounded-lg px-3 py-2 shadow-lg">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Cliquer pour agrandir
                  </span>
                </div>
              </div>
            </div>
          )}

          {beforeData?.createdAt && (
            <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center font-mono">
              {new Date(beforeData.createdAt).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* AFTER */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-t-lg border-x border-t border-emerald-200 dark:border-emerald-900/40">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              After (rescan)
            </span>
            {afterData?.viewport && (
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                {afterData.viewport}
              </span>
            )}
          </div>

          {afterLoading ? (
            <ScreenshotSkeleton />
          ) : !afterScreenshotId || !afterData?.signedUrl ? (
            <ScreenshotUnavailable label="Screenshot après correction indisponible" />
          ) : (
            <div
              className="relative rounded-b-lg overflow-hidden bg-gray-100 dark:bg-[#0A0B0E] border border-emerald-200 dark:border-emerald-900/40 cursor-zoom-in group"
              onClick={() => setModalImage('after')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setModalImage('after')
                }
              }}
            >
              <Image
                src={afterData.signedUrl}
                alt="Screenshot après correction"
                width={720}
                height={450}
                className="w-full h-auto object-contain"
                style={{ maxHeight: '400px' }}
                loading="lazy"
                quality={75}
              />
              
              {/* Overlay au hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white dark:bg-gray-900 rounded-lg px-3 py-2 shadow-lg">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Cliquer pour agrandir
                  </span>
                </div>
              </div>
            </div>
          )}

          {afterData?.createdAt && (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 text-center font-mono">
              {new Date(afterData.createdAt).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
      </div>

      {/* Modals plein écran (réutilisation de ScreenshotModal Phase 1) */}
      {modalImage === 'before' && beforeData?.signedUrl && (
        <ScreenshotModal
          isOpen={true}
          onClose={() => setModalImage(null)}
          signedUrl={beforeData.signedUrl}
          viewport={beforeData.viewport}
          createdAt={beforeData.createdAt}
          issueTitle={`${issueTitle || 'Screenshot'} - BEFORE`}
        />
      )}

      {modalImage === 'after' && afterData?.signedUrl && (
        <ScreenshotModal
          isOpen={true}
          onClose={() => setModalImage(null)}
          signedUrl={afterData.signedUrl}
          viewport={afterData.viewport}
          createdAt={afterData.createdAt}
          issueTitle={`${issueTitle || 'Screenshot'} - AFTER`}
        />
      )}
    </div>
  )
}

// ─── Composants utilitaires ───────────────────────────────────────────────────

function ScreenshotSkeleton() {
  return (
    <div className="rounded-b-lg border border-gray-200 dark:border-white/[0.08] bg-gray-100 dark:bg-[#16181E] animate-pulse">
      <div className="h-64 flex items-center justify-center">
        <CameraIcon className="h-10 w-10 text-gray-300 dark:text-gray-600 animate-pulse" />
      </div>
    </div>
  )
}

function ScreenshotUnavailable({ label }: { label: string }) {
  return (
    <div className="rounded-b-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-8 text-center space-y-3">
      <ExclamationTriangleIcon className="h-10 w-10 text-amber-500 mx-auto" />
      <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
        {label}
      </p>
      <p className="text-xs text-amber-700 dark:text-amber-300">
        La capture n'a pas été réalisée lors de ce scan.
      </p>
    </div>
  )
}
