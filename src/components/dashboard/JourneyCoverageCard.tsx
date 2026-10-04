'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircleIcon, PlusIcon, ArrowPathIcon, PencilIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { getJourneyTemplates } from '@/lib/qa/journeys/templates'
import type { JourneyDefinition, JourneyStepDefinition, JourneyActionType, JourneyStepAction } from '@/lib/qa/types'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface JourneyCoverageCardProps {
  siteId: string
  journeys: unknown
  monitorEnabled?: boolean | null
  monitorLastRunAt?: string | null
  monitorNextRunAt?: string | null
  latestMonitorScan?: { status: string; completed_at: string | null; created_at: string | null } | null
}

export function JourneyCoverageCard({ siteId, journeys, monitorEnabled: initialMonitorEnabled = false, monitorLastRunAt, monitorNextRunAt, latestMonitorScan }: JourneyCoverageCardProps) {
  const [configuredJourneys, setConfiguredJourneys] = useState<JourneyDefinition[]>(Array.isArray(journeys) ? journeys as JourneyDefinition[] : [])
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [secrets, setSecrets] = useState<Array<{ id: string; name: string }>>([])
  const [secretName, setSecretName] = useState('')
  const [secretValue, setSecretValue] = useState('')
  const [isSavingSecret, setIsSavingSecret] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Array<{ id: string; label: string; pageUrl: string; kind: string; target: string }>>([])
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [monitorEnabled, setMonitorEnabled] = useState(Boolean(initialMonitorEnabled))
  const [frequencyHours, setFrequencyHours] = useState(24)
  const [monitorSaving, setMonitorSaving] = useState(false)
  const templates = useMemo(() => getJourneyTemplates().filter((template) => template.id === 'saas-login' || template.id === 'saas-signup' || template.id === 'saas-forgot-password' || template.id === 'marketing-contact' || template.id === 'media-newsletter'), [])
  const coverage = useMemo(() => ({ configured: configuredJourneys.filter((journey) => templates.some((template) => template.name === journey.name)).length, total: templates.length }), [configuredJourneys, templates])

  useEffect(() => {
    fetch(`/api/sites/${siteId}/secrets`).then(async (response) => response.ok ? setSecrets(await response.json()) : undefined).catch(() => undefined)
  }, [siteId])

  const discoverForms = async () => {
    setIsDiscovering(true)
    setError(null)
    try {
      const response = await fetch(`/api/sites/${siteId}/journey-suggestions`)
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Impossible de repérer les parcours.')
      setSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions : [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible de repérer les parcours.')
    } finally { setIsDiscovering(false) }
  }

  const prepareSuggestion = async (suggestion: { label: string; pageUrl: string; kind: string; target: string }) => {
    const isAuth = suggestion.kind === 'auth'
    const generated: JourneyDefinition = {
      name: isAuth ? 'Page d’authentification' : 'Formulaire public',
      startUrl: suggestion.pageUrl,
      steps: [
        { name: 'Ouvrir la page', action: { type: 'navigate', target: suggestion.pageUrl } },
        { name: 'Vérifier le formulaire', action: { type: 'wait', target: suggestion.target } },
        { name: 'Valider la présence du formulaire', action: { type: 'assert', target: suggestion.target } },
      ],
    }
    const next = [...configuredJourneys.filter((journey) => journey.name !== generated.name), generated]
    setSavingId('suggestion')
    try {
      const response = await fetch(`/api/sites/${siteId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ journeyDefinitions: next }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Impossible de préparer ce parcours.')
      setConfiguredJourneys(next)
      setSuggestions([])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Impossible de préparer ce parcours.') }
    finally { setSavingId(null) }
  }

  const saveMonitor = async () => {
    setMonitorSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/sites/${siteId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ monitor: { enabled: monitorEnabled, frequencyHours } }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Impossible d’enregistrer la surveillance.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Impossible d’enregistrer la surveillance.') }
    finally { setMonitorSaving(false) }
  }

  const activate = async (templateId: string) => {
    const template = templates.find((item) => item.id === templateId)
    if (!template) return
    setSavingId(templateId)
    setError(null)
    try {
      const next = [...configuredJourneys, { ...template }]
      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journeyDefinitions: next }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Impossible d’activer ce parcours.')
      setConfiguredJourneys(next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible d’activer ce parcours.')
    } finally {
      setSavingId(null)
    }
  }

  const updateJourney = (index: number, update: Partial<JourneyDefinition>) => {
    setConfiguredJourneys((current) => current.map((journey, journeyIndex) => journeyIndex === index ? { ...journey, ...update } : journey))
  }

  const updateStep = (journeyIndex: number, stepIndex: number, update: Omit<Partial<JourneyStepDefinition>, 'action'> & { action?: Partial<JourneyStepAction> }) => {
    setConfiguredJourneys((current) => current.map((journey, index) => index !== journeyIndex ? journey : {
      ...journey,
      steps: journey.steps.map((step, currentStep) => currentStep === stepIndex ? { ...step, ...update, action: update.action ? { ...step.action, ...update.action } : step.action } : step),
    }))
  }

  const saveJourneys = async () => {
    setSavingId('journeys')
    setError(null)
    try {
      const response = await fetch(`/api/sites/${siteId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ journeyDefinitions: configuredJourneys }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Impossible d’enregistrer les parcours.')
      setEditingIndex(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible d’enregistrer les parcours.')
    } finally {
      setSavingId(null)
    }
  }

  const removeJourney = (index: number) => {
    setConfiguredJourneys((current) => current.filter((_, journeyIndex) => journeyIndex !== index))
    setEditingIndex(null)
  }

  const addStep = (journeyIndex: number) => {
    const step: JourneyStepDefinition = { name: 'Nouvelle étape', action: { type: 'wait', target: 'body' } }
    setConfiguredJourneys((current) => current.map((journey, index) => index === journeyIndex ? { ...journey, steps: [...journey.steps, step] } : journey))
  }

  const saveSecret = async () => {
    setIsSavingSecret(true)
    setError(null)
    try {
      const response = await fetch(`/api/sites/${siteId}/secrets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: secretName, value: secretValue }) })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Impossible d’enregistrer cet identifiant.')
      setSecrets((current) => [...current.filter((secret) => secret.name !== payload.name), { id: payload.id, name: payload.name }].sort((a, b) => a.name.localeCompare(b.name)))
      setSecretName('')
      setSecretValue('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Impossible d’enregistrer cet identifiant.')
    } finally {
      setIsSavingSecret(false)
    }
  }

  const removeSecret = async (name: string) => {
    const response = await fetch(`/api/sites/${siteId}/secrets?name=${encodeURIComponent(name)}`, { method: 'DELETE' })
    if (response.ok) setSecrets((current) => current.filter((secret) => secret.name !== name))
  }

  return (
    <section className="mb-6 rounded-2xl border border-gray-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#16181E]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ee6018]">Parcours critiques</p>
          <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{coverage.configured}/{coverage.total} parcours P0 configurés</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-500 dark:text-zinc-400">Activez les parcours qui comptent pour ce site. Qualio les rejouera après les prochains déploiements.</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-orange-200/70 bg-orange-50/60 p-4 dark:border-orange-500/20 dark:bg-orange-500/[0.06]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-sm font-semibold text-gray-900 dark:text-white">Préparer une surveillance</p><p className="mt-1 text-xs text-gray-600 dark:text-zinc-400">Qualio repère les pages susceptibles de contenir un formulaire et prépare les étapes du test.</p></div>
          <button type="button" onClick={() => void discoverForms()} disabled={isDiscovering} className="inline-flex items-center gap-1.5 rounded-lg bg-[#ee6018] px-3 py-2 text-xs font-semibold text-white hover:bg-[#d95514] disabled:opacity-60"><SparklesIcon className="h-3.5 w-3.5" />{isDiscovering ? 'Repérage…' : 'Repérer les parcours'}</button>
        </div>
        {suggestions.length > 0 && <div className="mt-3 grid gap-2 md:grid-cols-2">{suggestions.map((suggestion) => <div key={suggestion.id} className="rounded-lg border border-orange-200/70 bg-white p-3 dark:border-white/[0.08] dark:bg-[#16181E]"><p className="text-xs font-semibold text-gray-900 dark:text-white">{suggestion.label}</p><p className="mt-1 truncate text-[11px] font-mono text-gray-500 dark:text-zinc-500">{suggestion.pageUrl}</p><button type="button" onClick={() => void prepareSuggestion(suggestion)} disabled={savingId !== null} className="mt-2 text-xs font-semibold text-[#ee6018] hover:underline">Préparer ce test</button></div>)}</div>}
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {templates.map((template) => {
          const enabled = configuredJourneys.some((journey) => journey.name === template.name)
          return <div key={template.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200/80 px-3 py-3 dark:border-white/[0.08]">
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{template.name}</p><p className="mt-0.5 truncate text-xs text-gray-500 dark:text-zinc-500">{template.goal}</p></div>
            {enabled ? <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircleIcon className="h-4 w-4" />Actif</span> : <button type="button" onClick={() => void activate(template.id)} disabled={savingId !== null} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#ee6018] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#d95514] disabled:opacity-60">{savingId === template.id ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> : <PlusIcon className="h-3.5 w-3.5" />}Activer</button>}
          </div>
        })}
      </div>
      {configuredJourneys.length > 0 && <div className="mt-5 border-t border-gray-200/80 pt-5 dark:border-white/[0.08]">
        <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Parcours activés</p><button type="button" onClick={() => void saveJourneys()} disabled={savingId !== null} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-[#ee6018] hover:text-[#ee6018] disabled:opacity-60 dark:border-white/[0.08] dark:text-zinc-300">{savingId === 'journeys' ? 'Enregistrement…' : 'Enregistrer les modifications'}</button></div>
        <div className="mt-3 space-y-3">
          {configuredJourneys.map((journey, journeyIndex) => <div key={`${journey.name}-${journeyIndex}`} className="rounded-xl border border-gray-200/80 p-4 dark:border-white/[0.08]">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-gray-900 dark:text-white">{journey.name}</p><p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{journey.steps.length} étape(s) · {journey.startUrl || 'URL de départ non définie'}</p></div><div className="flex items-center gap-1"><button type="button" onClick={() => setEditingIndex(editingIndex === journeyIndex ? null : journeyIndex)} aria-label="Modifier le parcours" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-[#ee6018] dark:hover:bg-white/[0.06]"><PencilIcon className="h-4 w-4" /></button><button type="button" onClick={() => removeJourney(journeyIndex)} aria-label="Supprimer le parcours" className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><TrashIcon className="h-4 w-4" /></button></div></div>
            {editingIndex === journeyIndex && <div className="mt-4 space-y-4 border-t border-gray-200/80 pt-4 dark:border-white/[0.08]">
              <div className="grid gap-3 md:grid-cols-2"><label className="text-xs font-semibold text-gray-600 dark:text-zinc-300">Nom<input value={journey.name} onChange={(event) => updateJourney(journeyIndex, { name: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-normal text-gray-900 outline-none focus:border-[#ee6018] dark:border-white/[0.08] dark:bg-[#111216] dark:text-white" /></label><label className="text-xs font-semibold text-gray-600 dark:text-zinc-300">URL de départ<input value={journey.startUrl || ''} onChange={(event) => updateJourney(journeyIndex, { startUrl: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-normal text-gray-900 outline-none focus:border-[#ee6018] dark:border-white/[0.08] dark:bg-[#111216] dark:text-white" /></label></div>
              <div className="space-y-2">{journey.steps.map((step, stepIndex) => <div key={stepIndex} className="rounded-lg bg-gray-50 p-3 dark:bg-[#111216]"><div className="grid gap-2 md:grid-cols-[1.2fr_.8fr]"> <input aria-label={`Nom de l’étape ${stepIndex + 1}`} value={step.name} onChange={(event) => updateStep(journeyIndex, stepIndex, { name: event.target.value })} className="rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs dark:border-white/[0.08] dark:bg-[#16181E] dark:text-white" /><select aria-label={`Action de l’étape ${stepIndex + 1}`} value={step.action.type} onChange={(event) => updateStep(journeyIndex, stepIndex, { action: { type: event.target.value as JourneyActionType } })} className="rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs dark:border-white/[0.08] dark:bg-[#16181E] dark:text-white">{(['navigate', 'fill', 'click', 'submit', 'wait', 'assert'] as JourneyActionType[]).map((action) => <option key={action} value={action}>{action}</option>)}</select></div><input aria-label={`Cible de l’étape ${stepIndex + 1}`} value={step.action.target || ''} onChange={(event) => updateStep(journeyIndex, stepIndex, { action: { target: event.target.value } })} placeholder="Sélecteur CSS ou URL" className="mt-2 w-full rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs dark:border-white/[0.08] dark:bg-[#16181E] dark:text-white" />{step.action.type === 'fill' && <input aria-label={`Valeur de l’étape ${stepIndex + 1}`} value={typeof step.action.value === 'string' ? step.action.value : ''} onChange={(event) => updateStep(journeyIndex, stepIndex, { action: { value: event.target.value } })} placeholder="Valeur ou {{secret:NOM}}" className="mt-2 w-full rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs dark:border-white/[0.08] dark:bg-[#16181E] dark:text-white" />}<input aria-label={`Résultat attendu de l’étape ${stepIndex + 1}`} value={step.expectedResult?.selector || step.expectedResult?.url || step.expectedResult?.text || ''} onChange={(event) => updateStep(journeyIndex, stepIndex, { expectedResult: { selector: event.target.value } })} placeholder="Résultat attendu : sélecteur, texte ou URL" className="mt-2 w-full rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs dark:border-white/[0.08] dark:bg-[#16181E] dark:text-white" /></div>)}</div>
              <button type="button" onClick={() => addStep(journeyIndex)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#ee6018] hover:underline"><PlusIcon className="h-3.5 w-3.5" />Ajouter une étape</button>
            </div>}
          </div>)}
        </div>
      </div>}
      <div className="mt-5 border-t border-gray-200/80 pt-5 dark:border-white/[0.08]">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Surveillance automatique</p><p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">La fréquence est libre. La valeur proposée est une fois par jour.</p></div><label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-zinc-300"><input type="checkbox" checked={monitorEnabled} onChange={(event) => setMonitorEnabled(event.target.checked)} className="accent-[#ee6018]" /> Activer</label></div>
        <div className="mt-3 flex flex-wrap items-center gap-2"><select value={frequencyHours} onChange={(event) => setFrequencyHours(Number(event.target.value))} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs dark:border-white/[0.08] dark:bg-[#111216] dark:text-white"><option value={1}>Toutes les heures</option><option value={6}>Toutes les 6 heures</option><option value={12}>Toutes les 12 heures</option><option value={24}>Une fois par jour</option><option value={168}>Une fois par semaine</option></select><button type="button" onClick={() => void saveMonitor()} disabled={monitorSaving || configuredJourneys.length === 0} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-[#ee6018] hover:text-[#ee6018] disabled:opacity-50 dark:border-white/[0.08] dark:text-zinc-300">{monitorSaving ? 'Enregistrement…' : 'Enregistrer la surveillance'}</button></div>
        {monitorEnabled && <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-zinc-400"><p>Dernière vérification : {monitorLastRunAt ? formatDistanceToNow(new Date(monitorLastRunAt), { addSuffix: true, locale: fr }) : 'pas encore exécutée'}</p><p>Prochaine vérification : {monitorNextRunAt ? formatDistanceToNow(new Date(monitorNextRunAt), { addSuffix: true, locale: fr }) : 'non planifiée'}</p>{latestMonitorScan && <p className={latestMonitorScan.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : latestMonitorScan.status === 'failed' || latestMonitorScan.status === 'partial' || latestMonitorScan.status === 'blocked' ? 'text-red-600 dark:text-red-400' : 'text-gray-500'}>Dernier résultat : {latestMonitorScan.status === 'completed' ? 'succès' : latestMonitorScan.status === 'failed' || latestMonitorScan.status === 'partial' || latestMonitorScan.status === 'blocked' ? 'échec' : 'en cours'}</p>}</div>}
      </div>
      <div className="mt-5 border-t border-gray-200/80 pt-5 dark:border-white/[0.08]">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Identifiants de test</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-zinc-500">Les valeurs sont chiffrées côté serveur et ne sont jamais réaffichées. Utilisez ensuite <code className="rounded bg-gray-100 px-1 dark:bg-white/[0.06]">{'{{secret:NOM}}'}</code> dans une étape.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1.4fr_auto]"><input value={secretName} onChange={(event) => setSecretName(event.target.value.toUpperCase())} placeholder="LOGIN_EMAIL" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-[#ee6018] dark:border-white/[0.08] dark:bg-[#111216] dark:text-white" /><input type="password" value={secretValue} onChange={(event) => setSecretValue(event.target.value)} placeholder="Valeur confidentielle" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-[#ee6018] dark:border-white/[0.08] dark:bg-[#111216] dark:text-white" /><button type="button" onClick={() => void saveSecret()} disabled={isSavingSecret || !secretName || !secretValue} className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50 dark:bg-white dark:text-black">{isSavingSecret ? '…' : 'Enregistrer'}</button></div>
        {secrets.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{secrets.map((secret) => <span key={secret.id} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:border-white/[0.08] dark:text-zinc-300">{secret.name}<button type="button" onClick={() => void removeSecret(secret.name)} aria-label={`Supprimer ${secret.name}`} className="text-gray-400 hover:text-red-500">×</button></span>)}</div>}
      </div>
      {error && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </section>
  )
}
