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

interface RunScanModalProps {
  isOpen: boolean
  onClose: () => void
  site?: {
    id: string
    url: string
    name?: string | null
    environment?: string | null
  } | null
  availableSites?: Array<{
    id: string
    url: string
    name?: string | null
    environment?: string | null
  }>
  onSuccess?: (scanId: string) => void
}

export function RunScanModal({ isOpen, onClose, site, availableSites, onSuccess }: RunScanModalProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(site?.id || availableSites?.[0]?.id || '')
  const [tests, setTests] = useState({
    pages: true,
    cta: true,
    forms: true,
    consoleErrors: false,
    mobileResponsive: false,
  })
  const [consentGiven, setConsentGiven] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeSite = site || availableSites?.find((s) => s.id === (selectedSiteId || availableSites?.[0]?.id))

  const startScan = useStartScan()

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

  const toggleTest = (key: keyof typeof tests) => {
    setTests((prev) => ({ ...prev, [key]: !prev[key] }))
  }

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
      },
      {
        onSuccess: (data) => {
          onSuccess?.(data.scanId)
          onClose()
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
      <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-[#16181E] p-6 shadow-2xl border border-gray-100 dark:border-white/[0.08] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white font-sans">
                Nouveau scan QA
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

        {/* Content */}
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
              Modules de vérification Playwright
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'pages',
                  title: 'Exploration des pages',
                  desc: 'Crawl des liens internes, détection des erreurs 404 & 500',
                  checked: tests.pages,
                },
                {
                  id: 'cta',
                  title: 'Interactions & Boutons CTA',
                  desc: 'Vérification de la cliquabilité des boutons principaux',
                  checked: tests.cta,
                },
                {
                  id: 'forms',
                  title: 'Formulaires de base',
                  desc: 'Présence des champs requis et boutons de validation',
                  checked: tests.forms,
                },
                {
                  id: 'consoleErrors',
                  title: 'Erreurs JavaScript (Console & Réseau)',
                  desc: 'Capture des exceptions non gérées et requêtes échouées',
                  checked: tests.consoleErrors,
                },
                {
                  id: 'mobileResponsive',
                  title: 'Navigation Mobile (Responsive)',
                  desc: 'Détection des débordements horizontaux et menus mobiles',
                  checked: tests.mobileResponsive,
                },
              ].map((test) => (
                <div
                  key={test.id}
                  onClick={() => toggleTest(test.id as keyof typeof tests)}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    test.checked
                      ? 'bg-[#ee6018]/[0.04] dark:bg-[#ee6018]/10 border-[#ee6018]/30 dark:border-[#ee6018]/40 shadow-2xs'
                      : 'bg-white dark:bg-[#111216] border-gray-200/80 dark:border-white/[0.06] hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="pt-0.5">
                    {test.checked ? (
                      <div className="h-4 w-4 rounded bg-[#ee6018] flex items-center justify-center text-white">
                        <CheckCircleIcon className="h-3 w-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="h-4 w-4 rounded border border-gray-300 dark:border-white/20 bg-white dark:bg-transparent" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">{test.title}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                      {test.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
                requêtes de lecture et des vérifications fonctionnelles.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={startScan.isPending || !consentGiven}
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
      </div>
    </div>
  )
}
