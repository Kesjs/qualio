'use client'

import { useState, useEffect } from 'react'
import { Check, MessageSquare, X, Sparkles, ArrowRight } from 'lucide-react'

export interface WidgetDemoConfig {
  accentColor: string
  position: 'right' | 'left'
  buttonLabel: string
}

const DEFAULT_CONFIG: WidgetDemoConfig = {
  accentColor: '#ee6018',
  position: 'right',
  buttonLabel: 'Donner mon avis',
}

const COLOR_OPTIONS = [
  { hex: '#ee6018', label: 'Orange Qualio' },
  { hex: '#2563eb', label: 'Bleu Royal' },
  { hex: '#7c3aed', label: 'Violet Moderne' },
  { hex: '#059669', label: 'Vert Émeraude' },
  { hex: '#111827', label: 'Noir Obsidienne' },
]

const LABEL_PRESETS = ['Donner mon avis', 'Votre avis', 'Laisser un retour']

interface WidgetLiveDemoProps {
  isOpen: boolean
  onClose: () => void
  onActivated?: () => void
}

export function WidgetLiveDemo({ isOpen, onClose, onActivated }: WidgetLiveDemoProps) {
  const [config, setConfig] = useState<WidgetDemoConfig>(DEFAULT_CONFIG)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 6000)
    return () => clearTimeout(timer)
  }, [toastMessage])

  function handleActivateDemo() {
    // 1. Supprimer l'éventuel widget précédent
    const existingHost = document.querySelector('[data-qualio-widget]') as HTMLElement | null
    if (existingHost) existingHost.remove()

    const oldScript = document.querySelector('script[data-qualio-demo]') as HTMLElement | null
    if (oldScript) oldScript.remove()

    // 2. Réinitialiser le verrou singleton du widget
    ;(window as any).__qualioWidgetLoaded = false

    // 3. Récupérer la clé publique de démo
    const demoKey = process.env.NEXT_PUBLIC_QUALIO_WIDGET_KEY || 'guWs9U6tKOXoeCnxVN_M1um9QqxgIhhm'

    // 4. Injecter dynamiquement le vrai script /widget.js
    const script = document.createElement('script')
    script.src = '/widget.js'
    script.setAttribute('data-qualio-demo', 'true')
    script.setAttribute('data-key', demoKey)
    script.setAttribute('data-accent', config.accentColor)
    script.setAttribute('data-position', config.position)
    script.setAttribute('data-label', config.buttonLabel || 'Donner mon avis')
    script.setAttribute('data-title', 'Votre avis compte')
    script.setAttribute('data-intro', 'Testez le widget Qualio en conditions réelles.')

    // 5. À l'exécution du script, animer ou ouvrir le widget
    script.onload = () => {
      setTimeout(() => {
        const w = (window as any).qualioWidget
        if (w?.highlight) {
          w.highlight()
        } else if (w?.open) {
          w.open()
        }
      }, 150)
    }

    document.body.appendChild(script)

    // 6. Fermer la modal et afficher le toast confirmant que le vrai widget est actif
    onClose()
    onActivated?.()
    setToastMessage(
      `Le vrai widget Qualio est maintenant actif en bas à ${config.position === 'right' ? 'droite' : 'gauche'} !`
    )
  }

  return (
    <>
      {/* 1. Modal de configuration rapide */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-6 shadow-2xl transition-all sm:p-7"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-[#ee6018]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Démo en direct
                </span>
                <h2 id="demo-modal-title" className="mt-2 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                  Tester le widget en direct
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Personnalisez l’apparence et activez le vrai widget Qualio directement sur cette page.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customization controls */}
            <div className="mt-6 space-y-5">
              {/* Couleur d'accent */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Couleur d'accent du widget
                </label>
                <div className="mt-2.5 flex flex-wrap items-center gap-3">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, accentColor: c.hex }))}
                      title={c.label}
                      className="group relative flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{
                        backgroundColor: c.hex,
                        boxShadow:
                          config.accentColor === c.hex ? `0 0 0 3px #fff, 0 0 0 5px ${c.hex}` : 'none',
                      }}
                    >
                      {config.accentColor === c.hex && (
                        <Check className="h-4 w-4 text-white drop-shadow-xs" />
                      )}
                    </button>
                  ))}
                  <span className="ml-1 text-xs font-medium text-gray-600">
                    {COLOR_OPTIONS.find((c) => c.hex === config.accentColor)?.label}
                  </span>
                </div>
              </div>

              {/* Position à l'écran */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Position sur l'écran
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, position: 'right' }))}
                    className={`flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      config.position === 'right'
                        ? 'border-[#ee6018] bg-orange-50/70 text-[#c2410c] shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Bas droite (recommandé)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, position: 'left' }))}
                    className={`flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      config.position === 'left'
                        ? 'border-[#ee6018] bg-orange-50/70 text-[#c2410c] shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Bas gauche
                  </button>
                </div>
              </div>

              {/* Texte du bouton */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Texte du bouton
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {LABEL_PRESETS.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, buttonLabel: label }))}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                        config.buttonLabel === label
                          ? 'border-[#ee6018] bg-orange-50 text-[#c2410c]'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  maxLength={30}
                  value={config.buttonLabel}
                  onChange={(e) => setConfig((prev) => ({ ...prev, buttonLabel: e.target.value }))}
                  placeholder="Ou saisissez un texte personnalisé…"
                  className="mt-2 h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-800 outline-none transition focus:border-[#ee6018] focus:ring-2 focus:ring-[#ee6018]/15"
                />
              </div>

              {/* Mini aperçu en temps réel */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Aperçu du bouton flottant
                </span>
                <div className="mt-2.5 flex items-center justify-center py-2">
                  <div
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-md transition-all"
                    style={{ backgroundColor: config.accentColor }}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span>{config.buttonLabel || 'Donner mon avis'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleActivateDemo}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-95"
                style={{ backgroundColor: config.accentColor }}
              >
                <span>Afficher le widget sur la page</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Toast de confirmation */}
      {toastMessage && (
        <div
          style={{ position: 'fixed', bottom: '5.5rem', right: '1.5rem', zIndex: 9000, maxWidth: '22rem' }}
        >
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white p-3.5 shadow-xl text-gray-800">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Check className="h-4 w-4" />
            </span>
            <p className="text-xs font-medium leading-relaxed">{toastMessage}</p>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
