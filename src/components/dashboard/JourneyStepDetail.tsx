'use client'
import { useState } from 'react'
import {
  XCircleIcon,
  CameraIcon,
  GlobeAltIcon,
  CommandLineIcon,
  CodeBracketIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { ScreenshotViewer, NoScreenshotAvailable } from './ScreenshotViewer'
import { ScreenshotModal } from './ScreenshotModal'
import { useScreenshotSignedUrl } from '@/lib/hooks/useScreenshots'
import type { JourneyStep } from '@/lib/hooks/useScreenshots'

interface JourneyStepDetailProps {
  step: JourneyStep
  journeyName: string
  className?: string
}

/**
 * Composant de détail complet d'une étape de journey en échec
 * - Action effectuée
 * - Résultat de l'échec
 * - Screenshot (réutilise ScreenshotViewer et modal de Phase 1)
 * - Network errors si présents
 * - Console errors si présents
 * - Affiche uniquement pour les étapes en échec
 */
export function JourneyStepDetail({ step, journeyName, className = '' }: JourneyStepDetailProps) {
  const [showScreenshotModal, setShowScreenshotModal] = useState(false)

  // Récupérer l'URL signée pour la modal plein écran
  const { data: signedUrlData } = useScreenshotSignedUrl(
    step.screenshot_id || null,
    showScreenshotModal && !!step.screenshot_id
  )

  // Ne rien afficher si l'étape n'est pas en échec
  if (step.status !== 'fail') {
    return null
  }

  const hasScreenshot = !!step.screenshot_id
  const hasNetworkData = Boolean(step.result_payload.status || step.result_payload.networkErrors)
  const hasConsoleErrors = Array.isArray(step.result_payload.consoleErrors)
  const currentUrl = typeof step.result_payload.currentUrl === 'string'
    ? step.result_payload.currentUrl
    : undefined

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header avec badge d'échec */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
            <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-900 dark:text-red-200">
              Étape {step.step_order} : {step.step_name}
            </p>
            <p className="text-xs text-red-700 dark:text-red-300">
              Échec lors de l'exécution du parcours "{journeyName}"
            </p>
          </div>
        </div>
        {step.duration_ms !== undefined && step.duration_ms > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-red-700 dark:text-red-300">
            <ClockIcon className="h-3.5 w-3.5" />
            <span>{step.duration_ms}ms</span>
          </div>
        )}
      </div>

      {/* Section : Action effectuée */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Action effectuée
        </h4>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#16181E] border border-gray-200 dark:border-white/[0.06]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Type :</span>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {step.action_type}
              </span>
            </div>
            {step.action_target && (
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Cible :</span>
                <code className="text-xs font-mono text-[#ee6018]">{step.action_target}</code>
              </div>
            )}
            {step.action_details && Object.keys(step.action_details).length > 0 && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="font-bold">Détails : </span>
                {JSON.stringify(step.action_details, null, 2)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section : Erreur */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
          Résultat de l'échec
        </h4>
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
          <p className="text-sm text-red-900 dark:text-red-200 font-medium">
            {step.error_message || 'Erreur non spécifiée'}
          </p>
          {currentUrl && (
            <p className="text-xs text-red-700 dark:text-red-300 mt-1 flex items-center gap-1">
              <GlobeAltIcon className="h-3 w-3" />
              URL au moment de l'échec : <span className="font-mono">{currentUrl}</span>
            </p>
          )}
        </div>
      </div>

      {/* Section : Screenshot */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <CameraIcon className="h-3.5 w-3.5" />
          Screenshot au moment de l'échec
        </h4>
        {hasScreenshot ? (
          <ScreenshotViewer
            screenshotId={step.screenshot_id!}
            viewport={(step.result_payload?.viewport as string) || 'desktop'}
            createdAt={step.created_at}
            onClickZoom={() => setShowScreenshotModal(true)}
          />
        ) : (
          <NoScreenshotAvailable />
        )}
      </div>

      {/* Section : Network (si données disponibles) */}
      {hasNetworkData && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <GlobeAltIcon className="h-3.5 w-3.5" />
            Informations réseau
          </h4>
          <div className="rounded-lg bg-gray-950 p-4 border border-gray-800 text-xs font-mono text-gray-200 overflow-x-auto">
            <pre>
              {JSON.stringify(
                {
                  status: step.result_payload?.status,
                  url: currentUrl,
                  networkErrors: step.result_payload?.networkErrors,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}

      {/* Section : Console Errors (si présents) */}
      {hasConsoleErrors && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <CommandLineIcon className="h-3.5 w-3.5" />
            Erreurs console capturées
          </h4>
          <div className="rounded-lg bg-gray-950 p-4 border border-gray-800 text-xs font-mono text-gray-200 overflow-x-auto space-y-1">
            {(step.result_payload.consoleErrors as string[]).map((error, index) => (
              <div key={index} className="text-red-400">
                [Error] {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section : Payload complet (pour debug) */}
      {step.result_payload && Object.keys(step.result_payload).length > 0 && (
        <details className="space-y-2">
          <summary className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1.5">
            <CodeBracketIcon className="h-3.5 w-3.5" />
            Données techniques complètes (JSON)
          </summary>
          <div className="rounded-lg bg-gray-950 p-4 border border-gray-800 text-xs font-mono text-gray-200 overflow-x-auto mt-2">
            <pre>{JSON.stringify(step.result_payload, null, 2)}</pre>
          </div>
        </details>
      )}

      {/* Modal plein écran pour le screenshot */}
      {showScreenshotModal && step.screenshot_id && signedUrlData?.signedUrl && (
        <ScreenshotModal
          isOpen={showScreenshotModal}
          onClose={() => setShowScreenshotModal(false)}
          signedUrl={signedUrlData.signedUrl}
          viewport={signedUrlData.viewport}
          createdAt={signedUrlData.createdAt}
          issueTitle={`${journeyName} - Étape ${step.step_order} : ${step.step_name}`}
        />
      )}
    </div>
  )
}
