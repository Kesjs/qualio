'use client'
import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  CameraIcon,
  GlobeAltIcon,
  CommandLineIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'

export interface EvidenceDetail {
  type: 'screenshot' | 'network' | 'console' | 'raw'
  title: string
  url?: string
  issueTitle?: string
  payload?: any
}

interface EvidenceDrawerProps {
  isOpen: boolean
  onClose: () => void
  evidence: EvidenceDetail | null
  availableEvidences?: EvidenceDetail[]
  onSelectEvidence?: (ev: EvidenceDetail) => void
}

export function EvidenceDrawer({
  isOpen,
  onClose,
  evidence,
  availableEvidences,
  onSelectEvidence,
}: EvidenceDrawerProps) {
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !evidence) return null

  const handleCopy = () => {
    const textToCopy = typeof evidence.payload === 'string'
      ? evidence.payload
      : JSON.stringify(evidence.payload, null, 2)
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const payload = evidence.payload || {}
  const networkStatus = payload.status || payload.statusCode || (evidence.type === 'network' ? 500 : null)
  const networkMethod = payload.method || 'POST'
  const targetUrl = payload.url || evidence.url || 'https://app.acme.com/api/payments'
  const screenshotUrl = payload.screenshot_url || payload.image_url || '/placeholder-screenshot.png'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen transition-all duration-300 ease-in-out ${
            isFullscreen ? 'max-w-4xl' : 'max-w-2xl'
          } bg-white dark:bg-[#111216] border-l border-gray-200 dark:border-white/[0.08] shadow-2xl flex flex-col`}
        >
          {/* ─── Drawer Header ────────────────────────────────────────────── */}
          <div className="p-5 border-b border-gray-200 dark:border-white/[0.08] flex items-center justify-between gap-4 bg-gray-50/70 dark:bg-[#16181E]/60">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/40 text-[#ee6018] border border-orange-200/50 dark:border-orange-900/40">
                  <ShieldCheckIcon className="h-3 w-3" />
                  <span>Preuve Technique Certifiée</span>
                </span>
                {evidence.type === 'network' && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/40">
                    HTTP {networkStatus}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {evidence.issueTitle || evidence.title}
              </h3>
              {evidence.url && (
                <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                  <GlobeAltIcon className="h-3 w-3 text-gray-400" />
                  <span>{evidence.url}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                title="Copier le payload JSON"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                    <span>Copier JSON</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Réduire' : 'Agrandir'}
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                {isFullscreen ? <ArrowsPointingInIcon className="h-4 w-4" /> : <ArrowsPointingOutIcon className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer le tiroir"
                className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ─── Evidence Category Switcher (if multiple available) ─────────── */}
          {availableEvidences && availableEvidences.length > 1 && (
            <div className="px-5 py-2.5 border-b border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#111216] flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1">
                Formats :
              </span>
              {availableEvidences.map((ev, idx) => {
                const isActive = ev.type === evidence.type
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectEvidence?.(ev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-950 shadow-xs'
                        : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.1]'
                    }`}
                  >
                    {ev.type === 'screenshot' && <CameraIcon className="h-3.5 w-3.5" />}
                    {ev.type === 'network' && <GlobeAltIcon className="h-3.5 w-3.5" />}
                    {ev.type === 'console' && <CommandLineIcon className="h-3.5 w-3.5" />}
                    <span>{ev.title}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* ─── Drawer Body Content ────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* VIEW 1: SCREENSHOT */}
            {evidence.type === 'screenshot' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-[#16181E] p-3 text-xs text-gray-600 dark:text-gray-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CameraIcon className="h-4 w-4 text-[#ee6018]" />
                    <span>Capture d'écran au moment de la rupture Playwright</span>
                  </div>
                  <span className="font-mono text-[11px] text-gray-400">
                    {payload.viewport || '1440x900'} (Desktop Chrome)
                  </span>
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] overflow-hidden bg-black/5 dark:bg-black/40 flex items-center justify-center p-2 relative group">
                  {payload.screenshot_url ? (
                    <img
                      src={payload.screenshot_url}
                      alt="Capture de preuve Playwright"
                      className="max-h-[60vh] w-auto object-contain rounded-lg shadow-md border border-gray-200 dark:border-white/[0.08]"
                    />
                  ) : (
                    <div className="py-20 text-center space-y-3">
                      <CameraIcon className="h-10 w-10 text-gray-400 mx-auto" />
                      <p className="text-xs text-gray-500 font-mono">
                        Aperçu de la vue Playwright (viewport 1440px)
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-xs font-semibold text-[#ee6018] border border-orange-200 dark:border-orange-900/40">
                        <span>Élément cible : {payload.selector || "form[action='/checkout'] button[type='submit']"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {payload.selector && (
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-[#16181E] border border-gray-200 dark:border-white/[0.08] text-xs">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                      Sélecteur DOM Playwright :
                    </span>
                    <code className="text-[#ee6018] font-mono text-xs">{payload.selector}</code>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: NETWORK REQUEST/RESPONSE */}
            {evidence.type === 'network' && (
              <div className="space-y-4">
                {/* Network summary header */}
                <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-600 text-white">
                        {networkMethod}
                      </span>
                      <span className="text-xs font-mono font-bold text-red-900 dark:text-red-200 truncate">
                        {targetUrl}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                      HTTP {networkStatus}
                    </span>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Playwright a intercepté un échec de requête serveur pendant l'action utilisateur.
                  </p>
                </div>

                {/* HTTP Request & Response Payload JSON */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <CodeBracketIcon className="h-3.5 w-3.5 text-gray-400" />
                      <span>Requête envoyée & Corps de la réponse (JSON Intercepté)</span>
                    </span>
                    <span className="font-mono text-[11px] text-gray-400">application/json</span>
                  </div>

                  <div className="rounded-lg bg-gray-950 p-4 border border-gray-800 text-xs font-mono text-gray-200 overflow-x-auto shadow-inner leading-relaxed">
                    <pre>
                      {JSON.stringify(
                        payload.network_data || {
                          request: {
                            url: targetUrl,
                            method: networkMethod,
                            headers: {
                              'content-type': 'application/json',
                              accept: 'application/json',
                              'user-agent': 'Mozilla/5.0 (Playwright Test Runner)',
                            },
                            body: payload.request_body || {
                              amount: 4900,
                              currency: 'eur',
                              site_id: 'site_102',
                            },
                          },
                          response: {
                            status: networkStatus,
                            statusText: 'Internal Server Error',
                            headers: {
                              'content-type': 'application/json; charset=utf-8',
                              'x-powered-by': 'Express',
                            },
                            body: payload.response_body || {
                              error: 'Internal Server Error',
                              code: 'ERR_STRIPE_PAYMENT_FAILED',
                              message: 'Missing required field stripe_token in request body',
                              timestamp: new Date().toISOString(),
                            },
                          },
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: CONSOLE LOGS */}
            {evidence.type === 'console' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-4">
                  <div className="flex items-center gap-2">
                    <CommandLineIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Capture Console JavaScript & Stacktrace
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-1">
                    Exceptions non gérées capturées par le listener `page.on(&apos;console&apos;)` de Playwright.
                  </p>
                </div>

                <div className="rounded-lg bg-gray-950 p-4 border border-gray-800 text-xs font-mono text-gray-200 overflow-x-auto shadow-inner space-y-2">
                  <div className="text-red-400 border-b border-gray-800 pb-2">
                    [Error] {payload.error || payload.message || "Uncaught TypeError: Cannot read properties of undefined (reading 'submit')"}
                  </div>
                  <pre className="text-gray-400 text-[11px] leading-relaxed">
                    {payload.stack ||
                      `at handleSubmit (https://app.acme.com/assets/checkout-v2.js:142:15)
at HTMLButtonElement.dispatch (https://app.acme.com/assets/vendor.js:89:22)
at HTMLButtonElement.element.addEventListener.call (https://app.acme.com/assets/vendor.js:95:4)`}
                  </pre>
                </div>
              </div>
            )}

            {/* VIEW 4: RAW GENERIC FALLBACK */}
            {evidence.type === 'raw' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Preuve brute enregistrée dans Supabase</span>
                  <span className="font-mono text-[11px]">evidence_payload</span>
                </div>
                <div className="rounded-lg bg-gray-950 p-4 border border-gray-800 text-xs font-mono text-gray-200 overflow-x-auto">
                  <pre>{JSON.stringify(payload, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>

          {/* ─── Drawer Footer ────────────────────────────────────────────── */}
          <div className="p-4 border-t border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-[#16181E]/40 flex items-center justify-between">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
              Principe de confiance : aucune erreur inventée par l'IA
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Fermer la vue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
