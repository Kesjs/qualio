'use client'

import { useEffect, useState } from 'react'
import { ArrowPathIcon, CheckCircleIcon, ClipboardDocumentIcon, ExclamationCircleIcon, LinkIcon } from '@heroicons/react/24/outline'
import { useSites } from '@/lib/hooks/useSites'

type Mode = 'manual' | 'automatic'

export function DeploymentAutomationPanel() {
  const { data: sites } = useSites()
  const [siteId, setSiteId] = useState('')
  const [mode, setMode] = useState<Mode>('manual')
  const [hasWebhook, setHasWebhook] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!siteId) return
    let active = true
    setMessage('')
    setError('')
    fetch(`/api/sites/${siteId}/automation`)
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Impossible de charger le réglage')
        if (active) {
          setMode(data.mode === 'automatic' ? 'automatic' : 'manual')
          setHasWebhook(Boolean(data.hasWebhook))
          setWebhookUrl('')
        }
      })
      .catch((reason) => active && setError(reason instanceof Error ? reason.message : 'Impossible de charger le réglage'))
    return () => { active = false }
  }, [siteId])

  const save = async (nextMode: Mode) => {
    if (!siteId || loading) return
    setLoading(true)
    setMessage('')
    setError('')
    try {
      const response = await fetch(`/api/sites/${siteId}/automation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: nextMode, rotateToken: !hasWebhook }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Impossible d’enregistrer le réglage')
      setMode(nextMode)
      setHasWebhook(true)
      if (data.webhookUrl) setWebhookUrl(data.webhookUrl)
      setMessage(nextMode === 'automatic' ? 'Les publications déclencheront un re-scan automatique.' : 'Le re-scan automatique est désactivé.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible d’enregistrer le réglage')
    } finally {
      setLoading(false)
    }
  }

  const copyWebhook = async () => {
    if (!webhookUrl) return
    await navigator.clipboard.writeText(webhookUrl)
    setMessage('Lien webhook copié. Il ne sera affiché qu’après une nouvelle génération.')
  }

  return (
    <div className="mt-6 space-y-5 border-t border-gray-100 p-5 dark:border-white/[0.06] md:p-7">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#ee6018]">Vérification après publication</p>
        <h2 className="mt-2 text-base font-semibold text-gray-900 dark:text-white">Re-scan automatique</h2>
        <p className="mt-1 max-w-xl text-sm leading-6 text-gray-500 dark:text-zinc-400">Qualio reçoit le signal de publication de votre outil, puis rejoue les parcours du site. Le webhook ne modifie jamais votre production.</p>
      </div>
      <label className="block max-w-xl text-xs font-medium text-gray-700 dark:text-zinc-300">
        Site à surveiller
        <select value={siteId} onChange={(event) => setSiteId(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-white/[0.08] dark:bg-[#111216] dark:text-white">
          <option value="">Choisir un site</option>
          {sites?.map((site) => <option key={site.id} value={site.id}>{site.name || site.url}</option>)}
        </select>
      </label>
      {siteId ? (
        <div className="max-w-xl space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => save('automatic')} disabled={loading || mode === 'automatic'} className={`rounded-lg border px-3 py-2.5 text-left text-xs transition ${mode === 'automatic' ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-300' : 'border-gray-200 text-gray-600 hover:border-[#ee6018] dark:border-white/[0.08] dark:text-zinc-300'}`}>
              <span className="block font-semibold">Automatique</span>
              <span className="mt-1 block text-[11px] opacity-75">Un événement de publication lance le re-scan.</span>
            </button>
            <button type="button" onClick={() => save('manual')} disabled={loading || mode === 'manual'} className={`rounded-lg border px-3 py-2.5 text-left text-xs transition ${mode === 'manual' ? 'border-gray-300 bg-gray-50 text-gray-800 dark:border-white/20 dark:bg-white/[0.04] dark:text-white' : 'border-gray-200 text-gray-600 hover:border-[#ee6018] dark:border-white/[0.08] dark:text-zinc-300'}`}>
              <span className="block font-semibold">Manuel</span>
              <span className="mt-1 block text-[11px] opacity-75">Les événements sont conservés sans lancer de scan.</span>
            </button>
          </div>
          {hasWebhook ? <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400"><LinkIcon className="h-4 w-4 shrink-0" />Webhook configuré. Le lien complet n’est révélé qu’à sa génération.</p> : null}
          {webhookUrl ? <div className="rounded-lg border border-[#ee6018]/25 bg-[#ee6018]/5 p-3"><p className="text-[11px] font-medium text-gray-700 dark:text-zinc-300">Ajoutez ce lien dans l’outil qui publie votre site :</p><div className="mt-2 flex gap-2"><input readOnly value={webhookUrl} className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-2.5 py-2 font-mono text-[11px] text-gray-700 dark:border-white/[0.08] dark:bg-[#111216] dark:text-zinc-200" /><button type="button" onClick={copyWebhook} className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#ee6018] px-2.5 py-2 text-xs font-semibold text-white"><ClipboardDocumentIcon className="h-3.5 w-3.5" />Copier</button></div></div> : null}
          {loading ? <p className="flex items-center gap-2 text-xs text-gray-500"><ArrowPathIcon className="h-4 w-4 animate-spin" />Enregistrement…</p> : null}
          {message ? <p className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircleIcon className="h-4 w-4" />{message}</p> : null}
          {error ? <p className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400"><ExclamationCircleIcon className="h-4 w-4" />{error}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
