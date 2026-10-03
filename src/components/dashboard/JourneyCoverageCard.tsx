'use client'

import { useMemo, useState } from 'react'
import { CheckCircleIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { getJourneyCoverage, getJourneyTemplates, type JourneyVertical } from '@/lib/qa/journeys/templates'
import type { JourneyDefinition } from '@/lib/qa/types'

interface JourneyCoverageCardProps {
  siteId: string
  journeys: unknown
  defaultVertical?: string | null
}

const VERTICALS: Array<{ value: JourneyVertical; label: string }> = [
  { value: 'saas', label: 'SaaS / application web' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'booking', label: 'Réservation' },
  { value: 'marketing', label: 'Site vitrine / marketing' },
  { value: 'media', label: 'Média / contenu' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'other', label: 'Autre' },
]

function normalizeVertical(value: string | null | undefined): JourneyVertical {
  if (value === 'ecommerce' || value === 'booking' || value === 'marketing' || value === 'media' || value === 'marketplace' || value === 'other') return value
  return 'saas'
}

export function JourneyCoverageCard({ siteId, journeys, defaultVertical }: JourneyCoverageCardProps) {
  const [vertical, setVertical] = useState<JourneyVertical>(normalizeVertical(defaultVertical))
  const [configuredJourneys, setConfiguredJourneys] = useState<JourneyDefinition[]>(Array.isArray(journeys) ? journeys as JourneyDefinition[] : [])
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const coverage = useMemo(() => getJourneyCoverage(configuredJourneys, vertical), [configuredJourneys, vertical])
  const templates = getJourneyTemplates(vertical)

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

  return (
    <section className="mb-6 rounded-2xl border border-gray-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#16181E]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ee6018]">Parcours critiques</p>
          <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{coverage.configured}/{coverage.total} parcours P0 configurés</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-gray-500 dark:text-zinc-400">Activez les parcours qui comptent pour ce site. Qualio les rejouera après les prochains déploiements.</p>
        </div>
        <select value={vertical} onChange={(event) => setVertical(event.target.value as JourneyVertical)} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-[#ee6018] dark:border-white/[0.08] dark:bg-[#111216] dark:text-zinc-200">
          {VERTICALS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
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
      {error && <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </section>
  )
}
