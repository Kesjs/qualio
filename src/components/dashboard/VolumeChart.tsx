'use client'

import type { OverviewReady } from '@/lib/feedback/types'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const COLORS = { other: '#ee6018', pending: '#cbd5e1', negative: '#e11d48' } as const

// « AAAA-MM-JJ » est une date locale : on la lit par composants pour éviter le décalage d'un jour lié à l'UTC.
const toDate = (value: string) => { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d) }
const short = (value: string) => toDate(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const long = (value: string) => toDate(value).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

type Point = OverviewReady['series'][number] & { other: number }

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Point }> }) {
  const point = active ? payload?.[0]?.payload : undefined
  if (!point) return null
  return <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-zinc-900">
    <p className="font-semibold capitalize text-gray-950 dark:text-white">{long(point.date)}</p>
    <p className="mt-1 text-gray-700 dark:text-zinc-300">{point.total === 0 ? 'Aucun avis' : plural(point.total, 'avis')}</p>
    {point.negative > 0 && <p className="text-rose-600 dark:text-rose-400">dont {plural(point.negative, 'négatif')}</p>}
    {point.pending > 0 && <p className="text-gray-500 dark:text-zinc-400">dont {point.pending} pas encore classé{point.pending > 1 ? 's' : ''}</p>}
  </div>
}

/** Avis reçus par jour : une barre = un jour réel, calculée côté serveur sur les mêmes avis que les compteurs. */
export function VolumeChart({ series, days }: { series: OverviewReady['series']; days: number }) {
  const data: Point[] = series.map((point) => ({ ...point, other: point.positive + point.neutral }))
  const total = data.reduce((sum, point) => sum + point.total, 0)
  const negative = data.reduce((sum, point) => sum + point.negative, 0)
  const pending = data.reduce((sum, point) => sum + point.pending, 0)
  const peak = data.reduce((best, point) => (point.total > best.total ? point : best), data[0])
  const max = Math.max(...data.map((point) => point.total), 1)
  const steps = Math.min(max, 4)
  const ticks = [...new Set(Array.from({ length: steps + 1 }, (_, i) => Math.round((i * max) / steps)))]
  const legend = [{ label: 'Avis', color: COLORS.other, show: total - negative - pending > 0 }, { label: 'Négatifs', color: COLORS.negative, show: negative > 0 }, { label: 'Pas encore classés', color: COLORS.pending, show: pending > 0 }].filter((item) => item.show)

  return <section className="rounded-2xl border border-gray-200/80 bg-white p-5 dark:border-white/[0.08] dark:bg-[#181B21]" aria-labelledby="volume-title">
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
      <div>
        <h3 id="volume-title" className="text-sm font-semibold text-gray-950 dark:text-white">Avis reçus par jour</h3>
        <p className="mt-1 text-xs text-gray-600 dark:text-zinc-400">
          {plural(total, 'avis')} sur {days} jours
          {negative > 0 && <> · <span className="font-medium text-rose-600 dark:text-rose-400">{plural(negative, 'négatif')}</span></>}
          {peak?.total > 0 && <> · pic le {short(peak.date)} ({peak.total})</>}
        </p>
      </div>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-zinc-400">
        {legend.map((item) => <li key={item.label} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} aria-hidden />{item.label}</li>)}
      </ul>
    </div>
    <div className="mt-4 h-48 w-full" role="img" aria-label={`Avis reçus par jour sur ${days} jours : ${total} au total, dont ${negative} négatifs`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,.25)" />
          <XAxis dataKey="date" tickFormatter={short} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} minTickGap={32} />
          <YAxis allowDecimals={false} ticks={ticks} domain={[0, max]} tick={{ fontSize: 11, fill: '#6b7280' }} tickLine={false} axisLine={false} width={28} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,.12)' }} />
          <Bar dataKey="other" stackId="v" fill={COLORS.other} maxBarSize={28} isAnimationActive={false} />
          <Bar dataKey="pending" stackId="v" fill={COLORS.pending} maxBarSize={28} isAnimationActive={false} />
          <Bar dataKey="negative" stackId="v" fill={COLORS.negative} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </section>
}
