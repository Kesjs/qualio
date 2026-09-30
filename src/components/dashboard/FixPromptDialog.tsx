'use client'

import { useEffect, useState } from 'react'
import { ClipboardDocumentIcon, XMarkIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface FixPromptDialogProps {
  issueId: string | null
  issueTitle?: string
  onClose: () => void
}

interface FixPromptResponse {
  prompt: string
  summary: string
  evidence_count: number
  stack_type: string
}

type ViewMode = 'summary' | 'full'

export function FixPromptDialog({ issueId, issueTitle, onClose }: FixPromptDialogProps) {
  const [data, setData] = useState<FixPromptResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [view, setView] = useState<ViewMode>('summary')

  useEffect(() => {
    if (!issueId) return
    const controller = new AbortController()
    setData(null)
    setError(null)
    setCopied(false)
    setView('summary')
    fetch(`/api/issues/${issueId}/fix-prompt`, { signal: controller.signal })
      .then(async (response) => {
        const json = await response.json()
        if (!response.ok) throw new Error(json.error ?? 'Impossible de générer le prompt')
        setData(json)
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(reason instanceof Error ? reason.message : 'Impossible de générer le prompt')
      })
    return () => controller.abort()
  }, [issueId])

  if (!issueId) return null

  const copyPrompt = async () => {
    const text = view === 'summary' ? data?.summary : data?.prompt
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2_000)
    } catch {
      setError('La copie a échoué. Sélectionnez le texte manuellement.')
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="fix-prompt-title">
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111216]">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5 dark:border-white/10">
          <div>
            <h2 id="fix-prompt-title" className="text-base font-bold text-gray-950 dark:text-white">Prompt de correction</h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{issueTitle ?? 'Incident Qualio'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5" aria-label="Fermer le prompt">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {!data && !error && (
            <div className="flex items-center gap-2 py-12 text-sm text-gray-500"><ArrowPathIcon className="h-4 w-4 animate-spin" /> Préparation du contexte vérifié…</div>
          )}
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">{error}</p>}
          {data && (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2 text-[11px] text-gray-500 dark:text-zinc-400">
                  <span className="rounded-full border border-gray-200 px-2.5 py-1 dark:border-white/10">{data.evidence_count} preuve{data.evidence_count > 1 ? 's' : ''}</span>
                  <span className="rounded-full border border-gray-200 px-2.5 py-1 dark:border-white/10">Stack : {data.stack_type}</span>
                  <span className="rounded-full border border-gray-200 px-2.5 py-1 dark:border-white/10">Aucun accès au dépôt</span>
                </div>
                <div className="inline-flex rounded-lg border border-gray-200 p-0.5 text-xs dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setView('summary')}
                    className={`rounded-md px-2.5 py-1 font-medium transition-colors ${view === 'summary' ? 'bg-[#ee6018] text-white' : 'text-gray-500 dark:text-zinc-400'}`}
                  >
                    Résumé
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('full')}
                    className={`rounded-md px-2.5 py-1 font-medium transition-colors ${view === 'full' ? 'bg-[#ee6018] text-white' : 'text-gray-500 dark:text-zinc-400'}`}
                  >
                    Prompt complet
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap break-words rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs leading-6 text-gray-800 dark:border-white/10 dark:bg-black/30 dark:text-zinc-200">
                {view === 'summary' ? data.summary : data.prompt}
              </pre>
            </>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-gray-200 p-4 dark:border-white/10">
          <button type="button" disabled={!data} onClick={copyPrompt} className="inline-flex items-center gap-2 rounded-lg bg-[#ee6018] px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
            {copied ? 'Copié' : view === 'summary' ? 'Copier le résumé' : 'Copier le prompt complet'}
          </button>
        </div>
      </div>
    </div>
  )
}
