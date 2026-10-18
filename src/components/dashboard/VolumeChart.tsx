'use client'

import { card } from '@/components/dashboard/ui'
import type { OverviewReady } from '@/lib/feedback/types'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const formatDate = (value: string) => new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

export function VolumeChart({ series, days }: { series: OverviewReady['series']; days: number }) {
  const data = series.map((point) => ({ ...point, label: formatDate(point.date) }))
  const max = Math.max(...data.map((point) => point.total), 1)
  const empty = data.every((point) => point.total === 0)
  return <section className={`${card} p-5`}>
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-sm font-semibold text-gray-950 dark:text-white">Volume d’avis</h2>
      <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-zinc-400"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#ee6018]" />Avis</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" />Dont négatifs</span></div>
    </div>
    {empty ? <p className="py-10 text-center text-sm text-gray-500 dark:text-zinc-400">Aucun avis sur cette période.</p> : <div className="mt-4 h-56 w-full" role="img" aria-label={`Volume quotidien d’avis sur ${days} jours`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,.2)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} domain={[0, Math.max(max, 1)]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={30} />
          <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''} formatter={(value, name) => [value, name === 'total' ? 'Avis' : 'Avis négatifs']} contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 8px 24px rgba(15,23,42,.12)' }} />
          <Legend formatter={(value) => value === 'total' ? 'Avis' : 'Dont négatifs'} wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="total" name="total" stroke="#ee6018" strokeWidth={3} dot={{ r: 3, fill: '#fff', stroke: '#ee6018', strokeWidth: 2 }} activeDot={{ r: 5 }} animationDuration={650} />
          <Line type="monotone" dataKey="negative" name="negative" stroke="#fb7185" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2, fill: '#fff', stroke: '#fb7185', strokeWidth: 2 }} activeDot={{ r: 4 }} animationDuration={650} />
        </LineChart>
      </ResponsiveContainer>
    </div>}
  </section>
}
