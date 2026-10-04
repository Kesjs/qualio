'use client'
import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  PlayIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  Square2StackIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { useStartScan } from '@/lib/hooks/useScan'
import { CheckboxGroup, type CheckboxGroupOption } from '@/components/ui/checkbox-group'
import { AVAILABLE_SCAN_MODULES, DEFAULT_SCAN_MODULES } from '@/lib/qa/types'
import { ScanProgressPanel } from './ScanProgressPanel'

const SCAN_MODULE_OPTIONS: CheckboxGroupOption[] = [
  {
    label: "Formulaires de connexion et de contact",
    value: "forms",
    description: "Repérage des champs, champs requis et boutons d’envoi",
  },
]

const ADVANCED_SCAN_MODULE_OPTIONS: CheckboxGroupOption[] = [
  { label: 'Pages et liens', value: 'pages', description: 'Repérer les pages inaccessibles et les liens en erreur' },
  { label: 'Boutons et CTA', value: 'cta', description: 'Vérifier les actions principales visibles' },
  { label: 'Erreurs JavaScript', value: 'consoleErrors', description: 'Capturer les erreurs console et réseau observées' },
  { label: 'Responsive mobile', value: 'mobileResponsive', description: 'Repérer les débordements sur la page d’accueil' },
]

interface RunScanModalProps {
  isOpen: boolean
  onClose: () => void
  site?: {
    id: string
    url: string
    name?: string | null
    environment?: string | null
    journeyDefinitions?: unknown
  } | null
  availableSites?: Array<{
    id: string
    url: string
    name?: string | null
    environment?: string | null
    journeyDefinitions?: unknown
  }>
  onSuccess?: (scanId: string) => void
}

export function RunScanModal({ isOpen, onClose, site, availableSites, onSuccess }: RunScanModalProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(site?.id || availableSites?.[0]?.id || '')
  const [selectedModules, setSelectedModules] = useState<string[]>([...DEFAULT_SCAN_MODULES])
  const [consentGiven, setConsentGiven] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [launchedScanId, setLaunchedScanId] = useState<string | null>(null)

  const activeSite = site || availableSites?.find((s) => s.id === (selectedSiteId || availableSites?.[0]?.id))
  const hasConfiguredJourneys = Array.isArray(activeSite?.journeyDefinitions) && activeSite.journeyDefinitions.length > 0

  const startScan = useStartScan()

  useEffect(() => {
    if (!isOpen) {
      setLaunchedScanId(null)
      setError(null)
    }
  }, [isOpen])

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
  if (!activeSite) return null


  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!consentGiven) {
      setError("Vous devez confirmer l'autorisation de tester ce site.")
      return
    }

    startScan.mutate(
      {
        siteId: activeSite.id,
        url: activeSite.url,
        consentConfirmedAt: new Date().toISOString(),
        selectedModules,
      },
      {
        onSuccess: (data) => {
          setLaunchedScanId(data.scanId)
          onSuccess?.(data.scanId)
        },
        onError: (err) => {
          setError(err.message || 'Erreur lors du démarrage du scan.')
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 dark:border-white/[0.08] dark:bg-[#16181E]">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 p-6 pb-4 dark:border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white font-sans">
                Nouvel audit des formulaires
              </h2>
              {activeSite.environment && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/40">
                  {activeSite.environment}
                </span>
              )}
            </div>
            {!site && availableSites && availableSites.length > 1 ? (
              <div className="mt-2">
                <select
                  value={activeSite.id}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#111216] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#ee6018]"
                >
                  {availableSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || new URL(s.url).hostname} ({s.url})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 font-mono">
                <GlobeAltIcon className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                <span>{activeSite.url}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Content: scrolls independently so the action row never falls below the viewport. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        {launchedScanId ? (
          <div className="mt-5 space-y-4">
            <ScanProgressPanel scanId={launchedScanId} variant="compact" />
            <div className="sticky bottom-0 flex items-center justify-end gap-2.5 border-t border-gray-100 bg-white/95 pt-4 backdrop-blur dark:border-white/[0.06] dark:bg-[#16181E]/95">
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]">Fermer</button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleLaunch} className="mt-5 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50/80 border border-red-200 text-xs text-red-700">
              <ExclamationCircleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="leading-snug">{error}</p>
            </div>
          )}

          {/* Test suites checklist */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Périmètre de l’audit
            </label>
            <div className="rounded-xl border border-gray-200/80 bg-gray-50/30 p-1 dark:border-white/[0.06] dark:bg-white/[0.01]">
              <CheckboxGroup
                options={SCAN_MODULE_OPTIONS}
                value={selectedModules}
                onChange={setSelectedModules}
              />
            </div>
            <p className="mt-2 text-[11px] text-gray-500 dark:text-zinc-500">Le périmètre principal reste volontairement limité aux formulaires.</p>
            <details className="mt-3 rounded-lg border border-gray-200/80 dark:border-white/[0.08]">
              <summary className="cursor-pointer list-none px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-zinc-300">Options avancées <span className="font-normal text-gray-400">(facultatives)</span></summary>
              <div className="border-t border-gray-200/80 p-1 dark:border-white/[0.08]">
                <CheckboxGroup
                  options={ADVANCED_SCAN_MODULE_OPTIONS.filter((option) => AVAILABLE_SCAN_MODULES.includes(option.value as typeof AVAILABLE_SCAN_MODULES[number]))}
                  value={selectedModules}
                  onChange={setSelectedModules}
                />
              </div>
            </details>
          </div>

          {/* Consent Checkbox */}
          <div className="p-3.5 rounded-lg bg-gray-50 dark:bg-[#111216] border border-gray-200/80 dark:border-white/[0.06] space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 dark:border-white/20 text-[#ee6018] focus:ring-[#ee6018]"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                Je confirme avoir l'autorisation de tester ce site web. Qualio effectuera des
                requêtes de lecture et vérifiera uniquement les formulaires visibles.
              </span>
            </label>
          </div>

          {/* Actions */}
          {!hasConfiguredJourneys && <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-zinc-400">Les parcours de connexion, de contact et la vérification de l’e-mail seront ajoutés après ce premier repérage.</div>}
          <div className="sticky bottom-0 flex items-center justify-end gap-2.5 border-t border-gray-100 bg-white/95 pt-3 backdrop-blur dark:border-white/[0.06] dark:bg-[#16181E]/95">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={startScan.isPending || !consentGiven || selectedModules.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#ee6018] text-white text-xs font-semibold shadow-sm shadow-[#ee6018]/25 hover:bg-[#d95514] disabled:opacity-50 transition-all cursor-pointer"
            >
              {startScan.isPending ? (
                <>
                  <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                  <span>Démarrage du scan...</span>
                </>
              ) : (
                <>
                  <PlayIcon className="h-3.5 w-3.5 fill-current" />
                  <span>Lancer le scan</span>
                </>
              )}
            </button>
          </div>
        </form>
        )}
        </div>
      </div>
    </div>
  )
}
