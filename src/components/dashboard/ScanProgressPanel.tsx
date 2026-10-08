'use client'
import Link from 'next/link'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useScanResults, useScanStatus } from '@/lib/hooks/useScan'
import { FormScanProgress } from './FormScanProgress'

interface ScanProgressPanelProps { scanId: string; variant?: 'full' | 'compact' }
const STEPS = [
  { statuses: ['created', 'queued'], label: 'Audit placé dans la file', detail: 'La sélection est enregistrée ; le worker va démarrer.' },
  { statuses: ['running', 'discovering'], label: 'Ouverture du site', detail: 'Ouverture des pages autorisées dans le navigateur.' },
  { statuses: ['crawling'], label: 'Repérage sur les pages ciblées', detail: 'Vérification passive des pages concernées.' },
  { statuses: ['browser_testing'], label: 'Test des formulaires sélectionnés', detail: 'Une tentative par formulaire, avec captures et preuves.' },
  { statuses: ['analyzing'], label: 'Diagnostic des incidents', detail: 'L’IA explique les faits observés sans modifier les statuts.' },
  { statuses: ['reporting'], label: 'Préparation du rapport', detail: 'Enregistrement des incidents et de la synthèse.' },
  { statuses: ['completed', 'partial'], label: 'Audit terminé', detail: 'Les résultats de chaque formulaire sont disponibles.' },
]
const TERMINAL = ['completed', 'failed', 'partial', 'blocked']
function stepState(index: number, status: string, progress: number) {
  if (status === 'failed' || status === 'blocked') return index === STEPS.length - 1 ? 'failed' : index < Math.ceil(progress / 15) ? 'done' : 'pending'
  if (status === 'completed' || status === 'partial') return 'done'
  const current = STEPS.findIndex(step => step.statuses.includes(status))
  return index < current ? 'done' : index === current ? 'active' : 'pending'
}
export function ScanProgressPanel({ scanId, variant = 'full' }: ScanProgressPanelProps) {
  const { data: scan, isLoading, isError } = useScanStatus(scanId)
  const { data: results } = useScanResults(scanId, scan?.status)
  if (isLoading) return <p role="status" className="py-8 text-sm text-gray-500">Chargement du suivi…</p>
  if (isError || !scan) return <p role="alert" className="py-8 text-sm text-red-600">Impossible de charger ce scan.</p>
  const progress = Math.max(0, Math.min(100, scan.progress))
  const terminal = TERMINAL.includes(scan.status)
  return <div className={variant === 'compact' ? 'space-y-4' : 'space-y-6'}>
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-[#ee6018]">Suivi de l’audit</p><h2 className="mt-1 text-sm font-semibold">{scan.status === 'completed' ? 'Votre rapport est prêt' : scan.status === 'partial' ? 'Audit terminé avec des résultats partiels' : terminal ? 'Le scan a rencontré un problème' : 'Qualio teste votre sélection'}</h2></div>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Progression de l’audit" className="relative h-16 w-16 shrink-0"><svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden="true"><circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100 dark:text-white/10" /><circle cx="32" cy="32" r="27" fill="none" stroke="#ee6018" strokeWidth="4" strokeLinecap="round" strokeDasharray={169.65} strokeDashoffset={169.65 * (1 - progress / 100)} className="transition-all duration-700 motion-reduce:transition-none" /></svg><span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums">{progress}%</span></div>
    </div>
    <ol className="relative space-y-2 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-gray-200 dark:before:bg-white/10">
      {STEPS.map((step, index) => {
        const state = stepState(index, scan.status, progress)
        return <li key={step.label} className="relative flex items-start gap-3"><div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${state === 'done' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : state === 'active' ? 'bg-orange-50 text-[#ee6018] dark:bg-[#342115]' : state === 'failed' ? 'bg-red-50 text-red-600 dark:bg-red-950' : 'bg-gray-100 text-gray-400 dark:bg-[#24262d]'}`}>{state === 'done' ? <CheckCircleIcon className="h-4 w-4" /> : state === 'active' ? <span className="h-2 w-2 rounded-full bg-[#ee6018] motion-safe:animate-pulse" /> : state === 'failed' ? <ExclamationTriangleIcon className="h-4 w-4" /> : <span className="text-xs">{index + 1}</span>}</div><div className={`min-w-0 flex-1 py-2 ${state === 'active' ? 'rounded-xl border border-[#ee6018]/25 bg-[#ee6018]/[0.04] px-3' : ''}`}><p className={`text-xs font-semibold ${state === 'done' || state === 'pending' ? 'text-gray-400 dark:text-zinc-500' : ''}`}>{step.label}</p>{state === 'active' && <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{step.detail}</p>}</div></li>
      })}
    </ol>
    <FormScanProgress forms={scan.forms ?? []} />
    {scan.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">{scan.error}</p>}
    {terminal && <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-white/10"><p className="text-xs text-gray-500">{results ? `${results.issues.length} incident(s), ${results.checks.length} contrôle(s).` : 'Chargement des résultats enregistrés…'} Les résultats indéterminés ne sont pas des réussites.</p><div className="flex flex-wrap gap-3"><Link href={`/dashboard/bugs?scanId=${scanId}`} className="rounded-lg bg-[#ee6018] px-4 py-2 text-xs font-semibold text-white">Voir les incidents</Link>{variant === 'full' && <Link href="/dashboard/scans" className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold dark:border-white/10">Historique</Link>}</div></div>}
  </div>
}
