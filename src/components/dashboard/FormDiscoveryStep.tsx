'use client'
import { useState } from 'react'
import type { DiscoveredForm, FormType } from '@/lib/qa/types'

export const FORM_TYPE_LABELS: Record<FormType, string> = {
  contact: 'Contact', newsletter: 'Newsletter', login: 'Connexion', signup: 'Inscription', other: 'Autre',
}

export function FormDiscoveryStep({ forms, selected, onChange }: {
  forms: DiscoveredForm[]; selected: string[]; onChange: (signatures: string[]) => void
}) {
  const [filter, setFilter] = useState<FormType | 'all'>('all')
  const visible = forms.filter(form => filter === 'all' || form.formType === filter)
  const available = visible.filter(form => form.testability.testable)
  const allChecked = available.length > 0 && available.every(form => selected.includes(form.signature))
  const toggle = (signature: string) => onChange(selected.includes(signature) ? selected.filter(item => item !== signature) : [...selected, signature])
  return <section className="space-y-4" aria-labelledby="forms-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="forms-title" className="text-base font-semibold">{forms.length} formulaire(s) distinct(s)</h2>
      <button type="button" disabled={!available.length} onClick={() => onChange(allChecked
        ? selected.filter(signature => !available.some(form => form.signature === signature))
        : [...new Set([...selected, ...available.map(form => form.signature)])])}
        className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold disabled:opacity-40 dark:border-white/10 focus-visible:outline-2 focus-visible:outline-[#ee6018]">
        {allChecked ? 'Tout décocher' : 'Tout cocher'}{filter !== 'all' ? ` · ${FORM_TYPE_LABELS[filter]}` : ''}
      </button>
    </div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par type de formulaire">
      {(['all', ...Object.keys(FORM_TYPE_LABELS)] as Array<FormType | 'all'>).map(type => <button key={type} type="button"
        aria-pressed={filter === type} onClick={() => setFilter(type)}
        className={`rounded-lg px-3 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-[#ee6018] ${filter === type ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950' : 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-zinc-300'}`}>
        {type === 'all' ? 'Tous' : FORM_TYPE_LABELS[type]} ({forms.filter(form => type === 'all' || form.formType === type).length})
      </button>)}
    </div>
    <div className="space-y-3">
      {!visible.length && <p className="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-white/10">Aucun formulaire de ce type sur les pages explorées.</p>}
      {visible.map(form => {
        const checked = selected.includes(form.signature)
        const effect = !form.testability.testable ? 'Non testable' : form.formType === 'signup' ? 'Crée un compte'
          : ['contact', 'newsletter'].includes(form.formType) ? 'Envoie un email' : form.formType === 'login' ? 'Lecture seule' : 'Soumission réelle'
        return <label key={form.signature} className={`flex gap-3 rounded-xl border p-4 transition-colors ${!form.testability.testable ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500 dark:border-white/5 dark:bg-white/[0.02]' : checked ? 'cursor-pointer border-[#ee6018]/50 bg-[#ee6018]/[0.04]' : 'cursor-pointer border-gray-200 bg-white dark:border-white/10 dark:bg-[#16181E]'}`}>
          <input type="checkbox" checked={checked} disabled={!form.testability.testable} onChange={() => toggle(form.signature)}
            className="mt-1 h-4 w-4 shrink-0 accent-[#ee6018] focus-visible:outline-2 focus-visible:outline-[#ee6018]" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">{FORM_TYPE_LABELS[form.formType]}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] ${form.formType === 'signup' ? 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300' : 'border-gray-200 dark:border-white/10'}`}>{effect}</span>
              {form.occurrences.length > 1 && <span className="text-xs text-gray-500">Présent sur {form.occurrences.length} pages</span>}
            </div>
            <p className="break-all text-xs text-gray-500 dark:text-zinc-400">{form.occurrences[0]?.pageUrl}</p>
            <p className="text-xs text-gray-600 dark:text-zinc-300">Champs : {form.fields.filter(field => !field.hidden).map(field => field.label || field.name || field.type).join(', ') || 'Champs inaccessibles'}</p>
            {!form.testability.testable ? <p className="text-xs">{form.testability.reason}</p>
              : form.formType === 'login' ? <p className="text-xs text-gray-500">Identifiants de test configurés, ou une seule tentative invalide pour vérifier le message d’erreur.</p>
              : ['contact', 'newsletter'].includes(form.formType) ? <p className="text-xs text-gray-500">Peut déclencher un email. Sa réception ne sera pas vérifiée.</p> : null}
            {form.occurrences.length > 1 && <details onClick={event => event.stopPropagation()} className="text-xs text-gray-500">
              <summary className="cursor-pointer">Voir les pages</summary>
              <ul className="mt-2 space-y-1">{form.occurrences.map(occurrence => <li key={occurrence.pageUrl} className="break-all">{occurrence.pageUrl}</li>)}</ul>
            </details>}
          </div>
        </label>
      })}
    </div>
  </section>
}
