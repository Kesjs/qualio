'use client'

import { card } from '@/components/dashboard/ui'
import type { OverviewReady } from '@/lib/feedback/types'

export function VolumeChart({ series, days }: { series: OverviewReady['series']; days: number }) {
  const max = Math.max(...series.map((point) => point.total), 1)
  const empty = series.every((point) => point.total === 0)
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
          <div className="mt-4 flex h-32 items-end gap-[3px]" role="img" aria-label={`Volume quotidien d’avis sur ${days} jours`}>
            {series.map((point) => (
              <div key={point.date} className="group relative flex h-full flex-1 flex-col justify-end" title={`${new Date(point.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} : ${point.total} avis, ${point.negative} négatifs`}>
                <div className="relative w-full overflow-hidden rounded-t-[3px] bg-[#ee6018]/80 transition-colors group-hover:bg-[#ee6018]" style={{ height: `${Math.max((point.total / max) * 100, point.total ? 4 : 0)}%` }}>
                  {point.negative > 0 && <div className="absolute inset-x-0 bottom-0 bg-rose-400" style={{ height: `${(point.negative / point.total) * 100}%` }} />}
                </div>
              </div>
            ))}
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
