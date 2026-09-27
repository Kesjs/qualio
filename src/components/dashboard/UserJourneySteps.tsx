'use client'
import {
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import type { JourneyStep } from '@/lib/hooks/useScreenshots'

interface UserJourneyStepsProps {
  steps: JourneyStep[]
  journeyName: string
  onStepClick?: (step: JourneyStep) => void
  className?: string
}

/**
 * Composant d'affichage des étapes d'un user journey
 * - Liste verticale avec statuts PASS/FAIL/NOT_REACHED
 * - Seule l'étape en échec est cliquable pour voir le détail
 * - Design minimal pour les étapes PASS (pas de screenshot affiché)
 */
export function UserJourneySteps({
  steps,
  journeyName,
  onStepClick,
  className = '',
}: UserJourneyStepsProps) {
  if (steps.length === 0) {
    return null
  }

  const stepsPassed = steps.filter((s) => s.status === 'pass').length
  const stepsFailed = steps.filter((s) => s.status === 'fail').length
  const stepsNotReached = steps.filter((s) => s.status === 'not_reached').length
  const stepsTotal = steps.length

  const journeyStatus = stepsFailed > 0 ? 'fail' : stepsPassed === stepsTotal ? 'pass' : 'partial'

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header du parcours */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            User Journey : {journeyName}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <span>
              {stepsPassed} / {stepsTotal} étapes réussies
            </span>
            {stepsFailed > 0 && (
              <span className="text-red-600 dark:text-red-400 font-semibold">
                • {stepsFailed} échec{stepsFailed > 1 ? 's' : ''}
              </span>
            )}
            {stepsNotReached > 0 && (
              <span className="text-gray-500 dark:text-gray-500">
                • {stepsNotReached} non atteinte{stepsNotReached > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Badge de statut global */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
            journeyStatus === 'pass'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
              : journeyStatus === 'fail'
              ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40'
              : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
          }`}
        >
          {journeyStatus === 'pass' && <CheckCircleIcon className="h-4 w-4" />}
          {journeyStatus === 'fail' && <XCircleIcon className="h-4 w-4" />}
          {journeyStatus === 'partial' && <MinusCircleIcon className="h-4 w-4" />}
          <span>{journeyStatus === 'pass' ? 'Réussi' : journeyStatus === 'fail' ? 'Échec' : 'Partiel'}</span>
        </div>
      </div>

      {/* Liste des étapes */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isFailedStep = step.status === 'fail'
          const isClickable = isFailedStep && onStepClick

          return (
            <div
              key={step.id || index}
              onClick={() => isClickable && onStepClick(step)}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                isFailedStep
                  ? 'border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20'
                  : step.status === 'not_reached'
                  ? 'border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-[#16181E] opacity-60'
                  : 'border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#111216]'
              } ${isClickable ? 'cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors' : ''}`}
            >
              {/* Numéro de l'étape */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.status === 'pass'
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                    : step.status === 'fail'
                    ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                {step.step_order}
              </div>

              {/* Nom et détails de l'étape */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {step.step_name}
                  </span>
                  {step.duration_ms !== undefined && step.duration_ms > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <ClockIcon className="h-3 w-3" />
                      {step.duration_ms}ms
                    </span>
                  )}
                </div>
                
                {/* Action effectuée */}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {step.action_type === 'navigate' && `Naviguer vers ${step.action_target || 'page'}`}
                  {step.action_type === 'click' && `Cliquer sur ${step.action_target || 'élément'}`}
                  {step.action_type === 'fill' && `Remplir ${step.action_target || 'formulaire'}`}
                  {step.action_type === 'submit' && `Soumettre ${step.action_target || 'formulaire'}`}
                  {step.action_type === 'wait' && `Attendre ${step.action_target || 'élément'}`}
                  {step.action_type === 'assert' && `Vérifier ${step.action_target || 'condition'}`}
                </p>

                {/* Message d'erreur si échec */}
                {step.error_message && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                    ⚠️ {step.error_message}
                  </p>
                )}
              </div>

              {/* Icône de statut */}
              <div className="flex-shrink-0">
                {step.status === 'pass' && (
                  <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                )}
                {step.status === 'fail' && (
                  <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
                {step.status === 'not_reached' && (
                  <MinusCircleIcon className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                )}
                {step.status === 'skip' && (
                  <MinusCircleIcon className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Note en bas */}
      {stepsFailed > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          💡 Cliquez sur l'étape en échec pour voir le détail complet (screenshot, network, console)
        </p>
      )}
    </div>
  )
}

/**
 * Composant pour afficher un message quand aucun journey n'est disponible
 */
export function NoJourneyAvailable({ className = '' }: { className?: string }) {
  return (
    <div className={`p-6 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50/50 dark:bg-[#16181E]/50 text-center ${className}`}>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
        Aucun parcours utilisateur détecté
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
        Les user journeys apparaîtront ici lors des prochains scans
      </p>
    </div>
  )
}
