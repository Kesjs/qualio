'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { MouseEvent } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useScanResults, useScanStatus } from '@/lib/hooks/useScan'

const STEPS = [
  { statuses: ['queued'], label: 'Scan placé dans la file', detail: 'Qualio prépare votre session.' },
  { statuses: ['running', 'discovering'], label: 'Initialisation du navigateur', detail: 'Ouverture d’un vrai navigateur Playwright.' },
  { statuses: ['crawling'], label: 'Exploration des pages', detail: 'Visite des liens et collecte des réponses.' },
  { statuses: ['browser_testing'], label: 'Vérification des interactions', detail: 'Tests des boutons, formulaires et parcours.' },
  { statuses: ['analyzing'], label: 'Analyse des preuves', detail: 'Regroupement des signaux console, réseau et visuels.' },
  { statuses: ['reporting'], label: 'Préparation du rapport', detail: 'Calcul des résultats et des régressions.' },
  { statuses: ['completed'], label: 'Rapport terminé', detail: 'Les résultats sont prêts à être consultés.' },
]

const TERMINAL = ['completed', 'failed', 'partial', 'blocked']

function stepState(stepIndex: number, status: string, progress: number) {
  if (status === 'failed' || status === 'blocked') return stepIndex === STEPS.length - 1 ? 'failed' : stepIndex < Math.ceil(progress / 15) ? 'done' : 'pending'
  if (status === 'completed') return 'done'
  const currentIndex = STEPS.findIndex((step) => step.statuses.includes(status))
  if (stepIndex < currentIndex) return 'done'
  if (stepIndex === currentIndex) return 'active'
  return 'pending'
}

export default function ScanProgressPage() {
  const params = useParams<{ scanId: string }>()
  const router = useRouter()
  const scanId = params.scanId
  const { data: scan, isLoading, isError } = useScanStatus(scanId)
  const { data: results } = useScanResults(scanId, scan?.status)
  const isActive = Boolean(scan && !TERMINAL.includes(scan.status))

  useEffect(() => {
    if (!isActive) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = 'Votre scan est encore en cours. Voulez-vous vraiment quitter cette page ?'
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [isActive])

  const leaveProgress = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isActive && !window.confirm('Le scan est encore en cours. Vous pourrez le retrouver dans l’historique. Continuer ?')) {
      event.preventDefault()
    }
  }

  if (isLoading) return <div className="py-16 text-center text-sm text-gray-500">Chargement du suivi du scan…</div>
  if (isError || !scan) return <div className="py-16 text-center text-sm text-red-500">Impossible de charger ce scan.</div>

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <Link href="/dashboard/scans" onClick={leaveProgress} className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">
        <ArrowLeftIcon className="h-4 w-4" /> Retour à l’historique
      </Link>

      <section className="rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-white/[0.08] dark:bg-[#16181E]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ee6018]">Suivi du scan</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Qualio travaille sur votre site</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">Session <span className="font-mono">{scanId.slice(0, 12)}</span> · {scan.status}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{scan.progress}%</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{scan.pagesDiscovered ?? 0} pages découvertes</p>
          </div>
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]"><div className="h-full rounded-full bg-[#ee6018] transition-all duration-700" style={{ width: `${scan.progress}%` }} /></div>
      </section>

      <section className="rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-white/[0.08] dark:bg-[#16181E]">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-bold text-gray-900 dark:text-white">Ce qui se passe maintenant</h2><span className="text-xs text-gray-500 dark:text-zinc-400">Mise à jour automatique</span></div>
        <div className="space-y-1">
          {STEPS.map((step, index) => {
            const state = stepState(index, scan.status, scan.progress)
            return <div key={step.label} className="flex gap-4 rounded-xl px-3 py-3">
              <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${state === 'done' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' : state === 'active' ? 'bg-orange-100 text-[#ee6018] dark:bg-orange-500/15' : state === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' : 'bg-gray-100 text-gray-400 dark:bg-white/[0.06] dark:text-zinc-600'}`}>
                {state === 'done' ? <CheckCircleIcon className="h-4 w-4" /> : state === 'active' ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : state === 'failed' ? <ExclamationTriangleIcon className="h-4 w-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
              </div>
              <div><p className={`text-sm font-semibold ${state === 'active' ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-zinc-300'}`}>{step.label}</p><p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-500">{step.detail}</p></div>
            </div>
          })}
        </div>
        {scan.error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">{scan.error}</div>}
      </section>

      {TERMINAL.includes(scan.status) && results && <section className="rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-white/[0.08] dark:bg-[#16181E]"><h2 className="text-sm font-bold text-gray-900 dark:text-white">Résultat du scan</h2><p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">{results.issues.length} incident(s), {results.checks.length} contrôle(s) et {results.pages.length} page(s) enregistrés.</p><Link href="/dashboard/scans" className="mt-4 inline-flex rounded-lg bg-[#ee6018] px-4 py-2 text-xs font-semibold text-white">Voir l’historique</Link></section>}
    </div>
  )
}
