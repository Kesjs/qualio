'use client'

import { card } from '@/components/dashboard/ui'
import type { OverviewReady } from '@/lib/feedback/types'

export function VolumeChart({ series, days }: { series: OverviewReady['series']; days: number }) {
  const max = Math.max(...series.map((point) => point.total), 1)
  const empty = series.every((point) => point.total === 0)
  const step = series.length > 1 ? 300 / (series.length - 1) : 300
  const y = (value: number) => 104 - (value / max) * 84
  const points = series.map((point, index) => `${index * step},${y(point.total)}`).join(' ')
  const negativePoints = series.map((point, index) => `${index * step},${y(point.negative)}`).join(' ')
  const area = `0,104 ${points} 300,104`
  const labels = series.filter((_, index) => index === 0 || index === series.length - 1 || index === Math.floor((series.length - 1) / 2))
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
          <div className="relative mt-4 overflow-hidden rounded-lg border border-gray-100 bg-white dark:border-white/[0.06] dark:bg-[#181B21]" role="img" aria-label={`Graphique du volume quotidien d’avis sur ${days} jours`}>
            <div className="flex h-44 gap-2 px-3 pt-3"><div className="flex w-5 flex-col justify-between pb-5 text-right text-[9px] text-gray-400"><span>{max}</span><span>{Math.ceil(max / 2)}</span><span>0</span></div><div className="relative min-w-0 flex-1"><svg viewBox="0 0 300 120" preserveAspectRatio="none" className="h-full w-full"><g stroke="currentColor" className="text-gray-100 dark:text-white/[0.07]" strokeWidth="0.7"><line x1="0" y1="20" x2="300" y2="20" /><line x1="0" y1="62" x2="300" y2="62" /><line x1="0" y1="104" x2="300" y2="104" /></g><path d={area} fill="rgba(238,96,24,.10)" /><polyline points={points} fill="none" stroke="#ee6018" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /><polyline points={negativePoints} fill="none" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />{series.map((point, index) => <circle key={point.date} cx={index * step} cy={y(point.total)} r="3.5" fill="white" stroke="#ee6018" strokeWidth="2" vectorEffect="non-scaling-stroke"><title>{`${new Date(point.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : ${point.total} avis, ${point.negative} négatifs`}</title></circle>)}</svg><div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between text-[9px] text-gray-400 dark:text-zinc-500">{labels.map((point) => <span key={point.date}>{new Date(point.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>)}</div></div></div>
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
