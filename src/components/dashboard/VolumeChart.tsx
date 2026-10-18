'use client'

import { card } from '@/components/dashboard/ui'
import type { OverviewReady } from '@/lib/feedback/types'

export function VolumeChart({ series, days }: { series: OverviewReady['series']; days: number }) {
  const max = Math.max(...series.map((point) => point.total), 1)
  const empty = series.every((point) => point.total === 0)
  const step = series.length > 1 ? 300 / (series.length - 1) : 300
  const points = series.map((point, index) => `${index * step},${112 - (point.total / max) * 92}`).join(' ')
  const area = `0,112 ${points} 300,112`
  return (
    <section className={`${card} p-5`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-950 dark:text-white">Volume d’avis</h2>
        <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#ee6018]" />Avis</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-rose-400" />dont négatifs</span>
        </div>
      </div>
      {empty ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-zinc-400">Aucun avis sur cette période.</p>
      ) : (
        <>
          <div className="relative mt-4 h-36 overflow-hidden rounded-lg border border-gray-100 bg-gradient-to-b from-orange-50/60 to-white px-3 pt-3 dark:border-white/[0.06] dark:from-orange-500/[0.06] dark:to-[#181B21]" role="img" aria-label={`Volume quotidien d’avis sur ${days} jours`}>
            <svg viewBox="0 0 300 120" preserveAspectRatio="none" className="h-full w-full"><path d={area} fill="rgba(238,96,24,.10)" /><polyline points={points} fill="none" stroke="#ee6018" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />{series.map((point, index) => <circle key={point.date} cx={index * step} cy={112 - (point.total / max) * 92} r="3.5" fill="white" stroke="#ee6018" strokeWidth="2" vectorEffect="non-scaling-stroke"><title>{`${new Date(point.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : ${point.total} avis, ${point.negative} négatifs`}</title></circle>)}</svg>
            <div className="pointer-events-none absolute inset-x-3 bottom-2 flex justify-between text-[10px] text-gray-400 dark:text-zinc-500"><span>{new Date(series[0].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span><span>Aujourd’hui</span></div>
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-gray-400 dark:text-zinc-500">
            <span>{new Date(series[0].date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            <span>Aujourd’hui</span>
          </div>
        </>
      )}
    </section>
  )
}
