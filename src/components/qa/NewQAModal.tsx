'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Globe, Play, CheckCircle } from 'lucide-react'
import { QAWorkflowStates } from './QAWorkflowStates'
import { useStartScan, useScanStatus } from '@/lib/hooks/useScan'
import { Checkbox } from '@/components/ui/checkbox'

interface NewQAModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (siteId: string) => void
  siteId?: string // If provided, pre-selects the site
  siteUrl?: string // If provided, pre-fills the URL
}

export function NewQAModal({ isOpen, onClose, onSuccess, siteId, siteUrl }: NewQAModalProps) {
  const [step, setStep] = useState<'input' | 'scanning' | 'success' | 'error'>('input')
  const [url, setUrl] = useState(siteUrl || '')
  const [consentGiven, setConsentGiven] = useState(false)
  const [consentConfirmedAt, setConsentConfirmedAt] = useState<string | null>(null)
  
  const startScan = useStartScan()
  
  const [currentScanId, setCurrentScanId] = useState<string | null>(null)
  const [currentSiteId, setCurrentSiteId] = useState<string | null>(siteId || null)
  const [internalError, setInternalError] = useState<string | null>(null)

  const scanStatus = useScanStatus(currentScanId, step === 'scanning')

  const toggleConsent = (checked: boolean) => {
    setConsentGiven(checked)
    setConsentConfirmedAt(checked ? new Date().toISOString() : null)
  }

  // Handle status updates
  useEffect(() => {
    if (step === 'scanning' && scanStatus.data) {
      if (['completed', 'partial'].includes(scanStatus.data.status)) {
        setStep('success')
        if (currentSiteId) onSuccess?.(currentSiteId)
      } else if (['failed', 'blocked'].includes(scanStatus.data.status)) {
        setInternalError(scanStatus.data.error || 'Le scan a échoué')
        setStep('error')
      }
    }
  }, [scanStatus.data, step, currentSiteId, onSuccess])

  const handleStartQA = async () => {
    if (!url.trim()) return
    if (!consentGiven || !consentConfirmedAt) {
      setInternalError("Vous devez confirmer l'autorisation de tester.")
      setStep('error')
      return
    }

    setStep('scanning')
    setInternalError(null)

    startScan.mutate(
      { siteId: currentSiteId || '', url, consentConfirmedAt },
      {
        onSuccess: (data) => {
          setCurrentScanId(data.scanId)
          setCurrentSiteId(data.siteId)
        },
        onError: (err) => {
          setInternalError(err.message)
          setStep('error')
        }
      }
    )
  }

  const handleReset = () => {
    setStep('input')
    setUrl(siteUrl || '')
    setCurrentScanId(null)
    setInternalError(null)
    setConsentGiven(false)
    setConsentConfirmedAt(null)
  }

  const handleClose = () => {
    if (step === 'scanning') return
    handleReset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-canvas rounded-xl border border-border shadow-2xl mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-carbon/50">
          <h2 className="text-xl font-semibold text-ink-primary font-display">
            {step === 'input' && 'Nouveau Scan QA'}
            {step === 'scanning' && 'Scan en cours'}
            {step === 'success' && 'Scan terminé'}
            {step === 'error' && 'Erreur de scan'}
          </h2>
          
          {step !== 'scanning' && (
            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-ash transition-colors">
              <X className="h-4 w-4 text-ink-muted" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <p className="text-ink-secondary mb-4 text-sm">
                    Entrez l'URL du site pour lancer un diagnostic qualité complet.
                  </p>
                  
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-ash/30 text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-orange/50 focus:border-orange transition-colors"
                      autoFocus
                      disabled={!!siteUrl} // Lock if editing existing site
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 text-sm text-ink-secondary cursor-pointer select-none group">
                    <Checkbox
                      checked={consentGiven}
                      onCheckedChange={(c) => toggleConsent(c as boolean)}
                      className="mt-0.5 border-ink-muted/50 data-[state=checked]:bg-orange data-[state=checked]:border-orange transition-colors"
                    />
                    <span className="text-xs text-ink-muted group-hover:text-ink-secondary transition-colors leading-relaxed">
                      Je confirme avoir l'autorisation de scanner ce site (Safe Crawl). Qualio visitera les pages publiques et vérifiera les liens.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 text-sm text-ink-secondary cursor-pointer select-none group">
                    <Checkbox
                      checked={false} // Would be tied to a state if we use it in API, keeping simple for UI
                      className="mt-0.5 border-ink-muted/50 data-[state=checked]:bg-orange data-[state=checked]:border-orange transition-colors"
                    />
                    <span className="text-xs text-ink-muted group-hover:text-ink-secondary transition-colors leading-relaxed">
                      Autoriser les interactions sensibles (Soumission de formulaires, clics sur les CTA d'achat).
                    </span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleClose} className="flex-1 py-3 px-4 rounded-lg border border-border bg-carbon text-ink-primary hover:bg-ash transition-colors">
                    Annuler
                  </button>
                  <button
                    onClick={handleStartQA}
                    disabled={!url.trim() || !consentGiven || startScan.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-orange text-white hover:bg-[#d95514] transition-colors disabled:opacity-50 disabled:hover:bg-orange"
                  >
                    <Play className="h-4 w-4" />
                    {startScan.isPending ? 'Démarrage...' : 'Lancer le scan'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'scanning' && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <p className="text-ink-secondary mb-6">
                    Analyse en cours pour <span className="font-medium text-ink-primary">{url}</span>
                  </p>
                </div>

                <QAWorkflowStates 
                  status={(scanStatus.data?.status as any) || 'created'}
                  progress={scanStatus.data?.progress || 0}
                />

                <div className="text-center pt-2">
                  <p className="text-xs text-ink-muted">
                    L'analyse peut prendre quelques minutes... Vous pouvez fermer cette fenêtre, le scan continuera en arrière-plan.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-center"
              >
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </motion.div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-ink-primary mb-2">Scan terminé avec succès</h3>
                  <p className="text-ink-secondary text-sm">
                    {scanStatus.data?.summary || 'Les résultats de l\'analyse sont prêts.'}
                  </p>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full py-3 px-4 rounded-lg bg-carbon border border-border text-ink-primary hover:bg-ash transition-colors"
                >
                  Voir les résultats
                </button>
              </motion.div>
            )}

            {step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center"
              >
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-ink-primary mb-2">Une erreur est survenue</h3>
                  <p className="text-red-400 text-sm">{internalError}</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleClose} className="flex-1 py-3 px-4 rounded-lg border border-border bg-carbon hover:bg-ash transition-colors">
                    Fermer
                  </button>
                  <button onClick={handleReset} className="flex-1 py-3 px-4 rounded-lg bg-orange text-white hover:bg-[#d95514] transition-colors">
                    Réessayer
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
