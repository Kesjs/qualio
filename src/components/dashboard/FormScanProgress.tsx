'use client'
import type { FormScanProgress } from '@/lib/qa/types'
import { FORM_TYPE_LABELS } from './FormDiscoveryStep'

const LABELS = { pending: 'En attente', running: 'En cours', passed: 'OK', failed: 'Échec', skipped: 'Ignoré', inconclusive: 'Indéterminé', warning: 'À vérifier' }
export function FormScanProgress({ forms }: { forms: FormScanProgress[] }) {
  if (!forms.length) return null
  return <section aria-label="État des formulaires sélectionnés" className="space-y-3">
    <h3 className="text-sm font-semibold">Formulaires sélectionnés</h3>
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-white/5 dark:border-white/10">
      {forms.map(form => <li key={form.signature} className="flex flex-wrap items-start justify-between gap-3 p-3">
        <div className="min-w-0 flex-1"><p className="text-xs font-semibold">{FORM_TYPE_LABELS[form.formType]}</p><p className="mt-1 break-all text-xs text-gray-500">{form.pageUrl}</p>
          {form.reason && <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{form.reason}</p>}</div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${form.status === 'passed' ? 'text-emerald-600 dark:text-emerald-400' : form.status === 'failed' ? 'text-red-600 dark:text-red-400' : form.status === 'running' ? 'text-[#ee6018]' : 'text-gray-500'}`}>
          <span className={`h-1.5 w-1.5 rounded-full bg-current ${form.status === 'running' ? 'motion-safe:animate-pulse' : ''}`} />{LABELS[form.status]}
        </span>
      </li>)}
    </ul>
  </section>
}
