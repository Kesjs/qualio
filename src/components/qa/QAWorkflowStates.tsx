import { ReactNode } from 'react'
import { CheckCircle2, Search, Zap, LayoutTemplate, Activity, FileText } from 'lucide-react'
import { ScanStatus } from '@/lib/qa/types'

interface QAWorkflowStatesProps {
  status: ScanStatus
  progress: number
}

const STEPS = [
  { id: 'created', label: 'Initialisation', icon: LayoutTemplate },
  { id: 'discovering', label: 'Découverte du site', icon: Search },
  { id: 'crawling', label: 'Exploration des pages', icon: Activity },
  { id: 'browser_testing', label: 'Tests navigateur', icon: Zap },
  { id: 'analyzing', label: 'Analyse des résultats', icon: FileText },
]

export function QAWorkflowStates({ status, progress }: QAWorkflowStatesProps) {
  const currentStepIndex = STEPS.findIndex(s => s.id === status)
  const isComplete = status === 'completed'
  const isFailed = status === 'failed' || status === 'blocked'

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="h-2 w-full bg-border rounded-full overflow-hidden mb-6">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            isFailed ? 'bg-red-500' : 'bg-brand'
          }`}
          style={{ width: `${Math.max(2, progress)}%` }}
        />
      </div>

      {/* Steps list */}
      <div className="space-y-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isPast = isComplete || (currentStepIndex > index && !isFailed)
          const isCurrent = currentStepIndex === index && !isFailed && !isComplete
          const isError = isCurrent && isFailed

          let iconColor = 'text-ink-muted'
          let bgColor = 'bg-elevated'
          let textColor = 'text-ink-muted'

          if (isPast) {
            iconColor = 'text-success'
            bgColor = 'bg-success/10'
            textColor = 'text-ink-primary'
          } else if (isCurrent) {
            iconColor = 'text-brand'
            bgColor = 'bg-brand/10'
            textColor = 'text-ink-primary'
          } else if (isError) {
            iconColor = 'text-red-500'
            bgColor = 'bg-red-500/10'
            textColor = 'text-red-500'
          }

          return (
            <div key={step.id} className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${bgColor}`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium transition-colors ${textColor}`}>
                  {step.label}
                </p>
                {isCurrent && (
                  <p className="text-xs text-ink-muted mt-0.5 animate-pulse">
                    En cours...
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
