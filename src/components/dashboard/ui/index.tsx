'use client'

import Link from 'next/link'
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon } from '@heroicons/react/24/outline'
import type { Sentiment } from '@/lib/feedback/types'
import { sentimentLabels } from '@/lib/feedback/types'

export const card = 'rounded-xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]'
export const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-lg bg-[#ee6018] px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#ee6018]/20 transition hover:bg-[#d95514] disabled:cursor-not-allowed disabled:opacity-50'
export const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.1] dark:bg-transparent dark:text-zinc-300 dark:hover:border-white/30'

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c95720] dark:text-orange-300">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-gray-950 dark:text-white sm:text-[28px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.06] ${className}`} />
}

export function EmptyState({ title, body, href, label, onClick }: { title: string; body: string; href?: string; label?: string; onClick?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-8 dark:border-white/10 dark:bg-white/[0.03]">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 dark:text-zinc-400">{body}</p>
      {href && label && <Link href={href} className={`${primaryButton} mt-5`}>{label}<ArrowRightIcon className="h-4 w-4" /></Link>}
      {onClick && label && <button type="button" onClick={onClick} className={`${primaryButton} mt-5`}>{label}</button>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
      <p>{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-3 text-xs font-bold underline">Réessayer</button>}
    </div>
  )
}

const sentimentStyles: Record<Sentiment, string> = {
  positive: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  neutral: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-zinc-300',
  negative: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
}

export function SentimentBadge({ sentiment }: { sentiment: Sentiment | null }) {
  if (!sentiment) return <span className="text-[11px] text-gray-400 dark:text-zinc-500">—</span>
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${sentimentStyles[sentiment]}`}>{sentimentLabels[sentiment]}</span>
}

const priorityStyles = {
  high: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  medium: 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300',
  low: 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-zinc-300',
} as const
const priorityLabels = { high: 'Priorité haute', medium: 'Priorité moyenne', low: 'Priorité basse' } as const

export function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${priorityStyles[priority]}`}>{priorityLabels[priority]}</span>
}

/** Évolution vs période précédente. `inverse` : une hausse est mauvaise (ex. avis négatifs). */
export function Delta({ value, suffix = '', inverse = false }: { value: number | null; suffix?: string; inverse?: boolean }) {
  if (value === null || value === 0) return <span className="text-[11px] font-medium text-gray-400 dark:text-zinc-500">stable</span>
  const up = value > 0
  const good = inverse ? !up : up
  const Icon = up ? ArrowUpIcon : ArrowDownIcon
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
      <Icon className="h-3 w-3 stroke-[2.5]" />{Math.abs(value)}{suffix}
    </span>
  )
}

export function Sparkline({ values, className = 'h-7 w-20' }: { values: number[]; className?: string }) {
  const max = Math.max(...values, 1)
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${100 - (value / max) * 90 - 5}`).join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={`${className} text-[#ee6018]`} aria-hidden>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function PeriodSelect({ days, onChange }: { days: 7 | 30 | 90; onChange: (days: 7 | 30 | 90) => void }) {
  return (
    <div role="group" aria-label="Période" className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 dark:border-white/[0.1] dark:bg-transparent">
      {([7, 30, 90] as const).map((value) => (
        <button key={value} type="button" onClick={() => onChange(value)} aria-pressed={days === value}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${days === value ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950' : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'}`}>
          {value} j
        </button>
      ))}
    </div>
  )
}
