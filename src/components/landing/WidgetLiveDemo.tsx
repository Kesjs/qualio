'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, MessageSquare, Star, X, Sparkles, Sliders, ArrowRight, RotateCcw } from 'lucide-react'
import { SIGNUP } from './tokens'

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
  const [isWidgetActive, setIsWidgetActive] = useState(false)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form states inside demo widget panel
  const [rating, setRating] = useState<number | null>(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!toastMessage) return
    const timer = setTimeout(() => setToastMessage(null), 6000)
    return () => clearTimeout(timer)
  }, [toastMessage])

  // Listen for custom event to reopen demo modal from widget footer
  useEffect(() => {
    function handleReopen() {
      // Re-trigger open
      window.dispatchEvent(new CustomEvent('qualio:open-demo'))
    }
    window.addEventListener('qualio:open-demo-modal', handleReopen)
    return () => window.removeEventListener('qualio:open-demo-modal', handleReopen)
  }, [])

  function handleActivateDemo() {
    setIsWidgetActive(true)
    onClose()
    onActivated?.()
    setToastMessage(
      `Widget activé en bas à ${config.position === 'right' ? 'droite' : 'gauche'} ! Cliquez dessus pour tester l’expérience.`
    )
  }

  function handleWidgetSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 400)
  }

  function resetForm() {
    setContent('')
    setAuthorName('')
    setAuthorEmail('')
    setRating(5)
    setIsSubmitted(false)
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
                  Démo interactive
                </span>
                <h2 id="demo-modal-title" className="mt-2 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                  Tester le widget en direct
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Personnalisez l’apparence rapide du widget et testez-le directement sur cette page.
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
                  Couleur d’accent du widget
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
                  Position sur l’écran
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
        <div className="fixed bottom-24 right-6 z-[90] max-w-sm animate-in fade-in slide-in-from-bottom-3 duration-200 sm:bottom-6 sm:right-6">
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

      {/* 3. Bouton déclencheur flottant du widget démo sur la page */}
      {isWidgetActive && (
        <div
          className={`fixed bottom-6 z-[95] transition-all duration-300 ${
            config.position === 'right' ? 'right-6' : 'left-6'
          }`}
        >
          <button
            type="button"
            onClick={() => setIsPanelOpen((prev) => !prev)}
            aria-expanded={isPanelOpen}
            aria-label={config.buttonLabel || 'Donner mon avis'}
            className="group relative inline-flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-2xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              backgroundColor: config.accentColor,
              boxShadow: `0 14px 28px -6px ${config.accentColor}50, 0 6px 12px -2px rgba(0,0,0,0.12)`,
            }}
          >
            <MessageSquare className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
            <span>{config.buttonLabel || 'Donner mon avis'}</span>

            {/* Pastille indiquant le mode démo */}
            <span className="flex h-2 w-2 rounded-full bg-white/90 animate-ping absolute -top-1 -right-1" />
            <span className="flex h-2 w-2 rounded-full bg-white absolute -top-1 -right-1" />
          </button>
        </div>
      )}

      {/* 4. Panneau modal / popover du widget interactif */}
      {isWidgetActive && isPanelOpen && (
        <div
          className={`fixed bottom-20 z-[95] w-[360px] max-w-[calc(100vw-32px)] animate-in fade-in slide-in-from-bottom-2 duration-150 ${
            config.position === 'right' ? 'right-6' : 'left-6'
          }`}
        >
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl text-gray-900">
            {/* Header du widget */}
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 rounded-full" style={{ backgroundColor: config.accentColor }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Démo Qualio Widget
                  </span>
                </div>
                <h3 className="mt-1 text-base font-bold text-gray-950">Votre avis compte</h3>
                <p className="text-xs text-gray-500">Partagez votre expérience ou vos suggestions.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                aria-label="Fermer"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Contenu : Formulaire ou Succès */}
            {!isSubmitted ? (
              <form onSubmit={handleWidgetSubmit} className="mt-4 space-y-3.5">
                {/* Note par étoiles */}
                <div>
                  <label className="block text-xs font-medium text-gray-700">Note globale</label>
                  <div className="mt-1.5 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating ?? rating ?? 0) >= star
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRating(star)}
                          aria-label={`${star} sur 5`}
                          className="rounded p-1 text-gray-300 transition hover:scale-110 focus:outline-none"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              active ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                            }`}
                          />
                        </button>
                      )
                    })}
                    <span className="ml-2 text-xs font-semibold text-gray-600">
                      {rating === 5
                        ? '5/5 · Excellent'
                        : rating === 4
                        ? '4/5 · Très bien'
                        : rating === 3
                        ? '3/5 · Moyen'
                        : rating === 2
                        ? '2/5 · À améliorer'
                        : rating === 1
                        ? '1/5 · Décevant'
                        : 'Sans note'}
                    </span>
                  </div>
                </div>

                {/* Champ texte */}
                <div>
                  <label htmlFor="demo-content" className="block text-xs font-medium text-gray-700">
                    Votre avis <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="demo-content"
                    required
                    rows={3}
                    maxLength={1000}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Écrivez ce qui fonctionne bien ou ce qu’on devrait améliorer…"
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs text-gray-800 outline-none transition focus:border-gray-400 focus:ring-1 focus:ring-gray-300"
                  />
                </div>

                {/* Nom et email */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="demo-name" className="block text-[11px] font-medium text-gray-600">
                      Nom (facultatif)
                    </label>
                    <input
                      id="demo-name"
                      type="text"
                      maxLength={80}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Thomas"
                      className="mt-1 h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800 outline-none focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="demo-email" className="block text-[11px] font-medium text-gray-600">
                      Email (facultatif)
                    </label>
                    <input
                      id="demo-email"
                      type="email"
                      maxLength={120}
                      value={authorEmail}
                      onChange={(e) => setAuthorEmail(e.target.value)}
                      placeholder="thomas@exemple.com"
                      className="mt-1 h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-800 outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

                {/* Bouton d'envoi */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !content.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundColor: config.accentColor }}
                  >
                    {isSubmitting ? (
                      <span>Envoi en cours…</span>
                    ) : (
                      <>
                        <span>Envoyer mon avis</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Écran de succès */
              <div className="py-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-6 w-6 stroke-[2.5]" />
                </div>
                <h4 className="mt-3 text-base font-bold text-gray-900">Merci pour votre retour !</h4>
                <p className="mt-2 text-xs leading-relaxed text-gray-600">
                  Dans votre dashboard Qualio, cet avis est automatiquement analysé par l’IA, catégorisé par
                  sentiment et rattaché à une recommandation claire.
                </p>

                <div className="mt-5 space-y-2">
                  <Link
                    href={SIGNUP}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gray-950 py-2.5 text-xs font-semibold text-white hover:bg-black transition"
                  >
                    <span>Créer mon compte gratuit</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Envoyer un autre avis test</span>
                  </button>
                </div>
              </div>
            )}

            {/* Pied de widget : bouton pour re-personnaliser */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-400">
              <span className="font-mono">Qualio widget v1.0</span>
              <button
                type="button"
                onClick={() => {
                  setIsPanelOpen(false)
                  onClose()
                  setTimeout(() => {
                    const evt = new CustomEvent('qualio:open-demo-modal')
                    window.dispatchEvent(evt)
                  }, 100)
                }}
                className="inline-flex items-center gap-1 text-[#ee6018] hover:underline"
              >
                <Sliders className="h-3 w-3" />
                <span>Modifier le style</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
