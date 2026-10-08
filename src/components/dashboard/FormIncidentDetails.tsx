'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FixPromptDialog } from './FixPromptDialog'
import { ScreenshotViewer } from './ScreenshotViewer'

const ACTION_LABELS: Record<string, string> = { field_filled: 'Champ rempli', submit_clicked: 'Clic d’envoi', response_received: 'Réponse reçue', message_displayed: 'Message affiché', capture_unavailable: 'Capture indisponible' }
export function FormIncidentDetails({ issue, siteId }: {
  issue: { id: string; title: string; scan_id?: string; evidence?: Array<{ type: string; payload: Record<string, unknown> }> | null }
  siteId: string
}) {
  const [showPrompt, setShowPrompt] = useState(false)
  const evidence = issue.evidence ?? []
  const signature = evidence.find(ev => typeof ev.payload.signature === 'string')?.payload.signature
  const captures = evidence.filter(ev => ev.type === 'screenshot' && typeof ev.payload.screenshotId === 'string')
  const actions = evidence.filter(ev => ev.type === 'action')
  if (typeof signature !== 'string') return null
  return <div className="space-y-3 border-t border-gray-100 pt-3 dark:border-white/10">
    <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setShowPrompt(true)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold dark:border-white/10">Copier le prompt de correction</button>
      <Link href={`/dashboard/sites/${siteId}/audit?signature=${encodeURIComponent(signature)}${issue.scan_id ? `&previousScanId=${encodeURIComponent(issue.scan_id)}` : ''}`} className="rounded-lg border border-[#ee6018]/30 px-3 py-2 text-xs font-semibold text-[#ee6018]">Retester ce formulaire</Link>
    </div>
    <details className="rounded-lg border border-gray-200 p-3 dark:border-white/10"><summary className="cursor-pointer text-xs font-semibold">Détail de la soumission · {actions.length} action(s)</summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{captures.map((capture, index) => <div key={`${String(capture.payload.phase)}-${index}`}><p className="mb-2 text-xs font-semibold">{capture.payload.phase === 'before' ? 'Avant soumission' : 'Après soumission'}</p><ScreenshotViewer screenshotId={String(capture.payload.screenshotId)} /></div>)}</div>
      <ol className="mt-4 space-y-2 border-l border-gray-200 pl-4 dark:border-white/10">{actions.map((ev, index) => <li key={index} className="text-xs"><span className="font-semibold">{ACTION_LABELS[String(ev.payload.action)] ?? String(ev.payload.action)}</span>{typeof ev.payload.field === 'string' && <span> · {ev.payload.field}</span>}{typeof ev.payload.status === 'number' && <span> · HTTP {ev.payload.status}</span>}{typeof ev.payload.text === 'string' && <p className="mt-1 break-words text-gray-500">{ev.payload.text}</p>}{typeof ev.payload.at === 'string' && <time className="ml-2 text-gray-400">{new Date(ev.payload.at).toLocaleTimeString('fr-FR')}</time>}</li>)}</ol>
    </details>
    {showPrompt && <FixPromptDialog issueId={issue.id} issueTitle={issue.title} onClose={() => setShowPrompt(false)} />}
  </div>
}
