'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircleIcon, PlusIcon, ArrowPathIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { getJourneyTemplates } from '@/lib/qa/journeys/templates'
import type { JourneyDefinition, JourneyStepDefinition, JourneyActionType, JourneyStepAction } from '@/lib/qa/types'

interface JourneyCoverageCardProps {
  siteId: string
  journeys: unknown
}

export function JourneyCoverageCard({ siteId, journeys }: JourneyCoverageCardProps) {
  const [configuredJourneys, setConfiguredJourneys] = useState<JourneyDefinition[]>(Array.isArray(journeys) ? journeys as JourneyDefinition[] : [])
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [secrets, setSecrets] = useState<Array<{ id: string; name: string }>>([])
  const [secretName, setSecretName] = useState('')
  const [secretValue, setSecretValue] = useState('')
  const [isSavingSecret, setIsSavingSecret] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const templates = useMemo(() => getJourneyTemplates('saas').filter((template) => template.id === 'saas-login' || template.id === 'marketing-contact'), [])
  const coverage = useMemo(() => ({ configured: configuredJourneys.filter((journey) => templates.some((template) => template.name === journey.name)).length, total: templates.length }), [configuredJourneys, templates])

  useEffect(() => {
    fetch(`/api/sites/${siteId}/secrets`).then(async (response) => response.ok ? setSecrets(await response.json()) : undefined).catch(() => undefined)
  }, [siteId])

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
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {templates.filter((template) => template.priority === 'P0').map((template) => {
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
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Identifiants de test</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-zinc-500">Les valeurs sont chiffrées côté serveur et ne sont jamais réaffichées. Utilisez ensuite <code className="rounded bg-gray-100 px-1 dark:bg-white/[0.06]">{'{{secret:NOM}}'}</code> dans une étape.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1.4fr_auto]"><input value={secretName} onChange={(event) => setSecretName(event.target.value.toUpperCase())} placeholder="LOGIN_EMAIL" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-[#ee6018] dark:border-white/[0.08] dark:bg-[#111216] dark:text-white" /><input type="password" value={secretValue} onChange={(event) => setSecretValue(event.target.value)} placeholder="Valeur confidentielle" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-[#ee6018] dark:border-white/[0.08] dark:bg-[#111216] dark:text-white" /><button type="button" onClick={() => void saveSecret()} disabled={isSavingSecret || !secretName || !secretValue} className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-50 dark:bg-white dark:text-black">{isSavingSecret ? '…' : 'Enregistrer'}</button></div>
        {secrets.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{secrets.map((secret) => <span key={secret.id} className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:border-white/[0.08] dark:text-zinc-300">{secret.name}<button type="button" onClick={() => void removeSecret(secret.name)} aria-label={`Supprimer ${secret.name}`} className="text-gray-400 hover:text-red-500">×</button></span>)}</div>}
      </div>
      {error && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </section>
  )
}
