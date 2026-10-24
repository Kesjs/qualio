'use client'

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import type { Sentiment } from '@/lib/feedback/types'
import { sentimentLabels } from '@/lib/feedback/types'
import { getUsageLevel } from '@/lib/billing/usage'

export const card = 'rounded-xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]'

/** Anneau de focus visible au clavier (accessibilité de base, doc 3.9 règle 5). */
export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2410c]'
/** Retour au toucher : léger rétrécissement, désactivé si l'utilisateur réduit les animations. */
export const pressable = 'transition duration-150 ease-out motion-safe:active:scale-[0.98] motion-reduce:transition-none'

/** Doc 3.8 : un seul bouton mis en avant, neutre. L'orange sert à la priorité et aux alertes. */
export const primaryButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 text-sm font-semibold text-white ${pressable} hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-950 dark:hover:bg-zinc-200 ${focusRing}`
export const secondaryButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 ${pressable} hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-transparent dark:text-zinc-100 dark:hover:border-white/30 ${focusRing}`
export const dangerButton = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 ${pressable} hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/30 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-500/10 ${focusRing}`

export const inputClass = `min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-950 dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:focus:border-white ${focusRing}`
export const selectClass = `h-10 rounded-lg border border-gray-300 bg-white px-2.5 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-950 dark:border-white/15 dark:bg-[#16181E] dark:text-zinc-200 dark:focus:border-white ${focusRing}`

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-zinc-400">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-gray-950 dark:text-white sm:text-[28px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-gray-100 motion-reduce:animate-none dark:bg-white/[0.06] ${className}`} />
}

export function EmptyState({ title, body, href, label, onClick }: { title: string; body: string; href?: string; label?: string; onClick?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-8 dark:border-white/10 dark:bg-white/[0.03]">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 dark:text-zinc-400">{body}</p>
      {href && label && <Link href={href} className={`${primaryButton} mt-5`}>{label}<ArrowRightIcon className="h-4 w-4" aria-hidden /></Link>}
      {onClick && label && <button type="button" onClick={onClick} className={`${secondaryButton} mt-5`}>{label}</button>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
      <p>{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className={`${secondaryButton} mt-3`}>Réessayer</button>}
    </div>
  )
}

/** Onglets accessibles : flèches, Début et Fin pour naviguer, seul l'onglet actif est dans l'ordre de tabulation. */
export function Tabs<T extends string>({ label, tabs, value, onChange }: { label: string; tabs: ReadonlyArray<{ id: T; label: string; locked?: boolean; attention?: boolean }>; value: T; onChange: (id: T) => void }) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = tabs.length - 1
    let next = -1
    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    if (next < 0) return
    event.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-white/[0.08]">
      {tabs.map((tab, index) => {
        const selected = tab.id === value
        return (
          <button
            key={tab.id}
            ref={(element) => { refs.current[index] = element }}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`relative inline-flex min-h-11 shrink-0 items-center gap-1.5 px-3 text-sm font-semibold transition-colors duration-150 ${focusRing} ${selected ? 'text-gray-950 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'}`}
          >
            {tab.label}
            {tab.attention && <span className="h-2.5 w-2.5 rounded-full bg-[#ee6018]" aria-label="Notification à configurer" />}
            {tab.locked && <><LockClosedIcon className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">(avec Pro)</span></>}
            <span aria-hidden className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gray-950 transition-transform duration-200 motion-reduce:transition-none dark:bg-white ${selected ? 'scale-x-100' : 'scale-x-0'}`} />
          </button>
        )
      })}
    </div>
  )
}

/** Panneau latéral : Échap ferme, le focus entre dans le panneau et revient au déclencheur. */
export function SidePanel({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea')?.focus()
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') closeRef.current() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); previous?.focus?.() }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Fermer le panneau" tabIndex={-1} className="absolute inset-0 bg-gray-900/30 backdrop-blur-[2px] motion-safe:animate-[qualio-fade_150ms_ease-out] dark:bg-black/60" onClick={onClose} />
      <aside ref={panelRef} role="dialog" aria-modal="true" aria-label={label} className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-gray-200 bg-white p-5 shadow-2xl motion-safe:animate-[qualio-slide-in_200ms_ease-out] sm:p-6 dark:border-white/[0.08] dark:bg-[#111216]">
        {children}
      </aside>
    </div>
  )
}

/** Compteur d'usage (doc 2.4) : neutre, orange dès 80 %, rouge à 100 %. */
export function UsageMeter({ used, limit, label }: { used: number; limit: number; label: string }) {
  const level = getUsageLevel(used, limit)
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const text = level === 'full' ? 'text-red-600 dark:text-red-400' : level === 'warn' ? 'text-[#c2410c] dark:text-orange-300' : 'text-gray-600 dark:text-zinc-400'
  const bar = level === 'full' ? 'bg-red-600' : level === 'warn' ? 'bg-[#c2410c]' : 'bg-gray-500 dark:bg-zinc-400'
  return (
    <div className="min-w-40">
      <div className={`flex items-baseline justify-between gap-3 text-xs font-medium ${text}`}>
        <span><span className="font-mono tabular-nums">{used}</span> / <span className="font-mono tabular-nums">{limit}</span> {label}</span>
        {level === 'warn' && <span className="font-semibold">Vous approchez de la limite</span>}
        {level === 'full' && <span className="font-semibold">Limite atteinte</span>}
      </div>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used} aria-label={label} className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
        <div className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const sentimentStyles: Record<Sentiment, string> = {
  positive: 'bg-emerald-500',
  neutral: 'bg-gray-400 dark:bg-zinc-500',
  negative: 'bg-rose-500',
}

/** Point de couleur du sentiment (doc 3.4) : le libellé reste accessible hors de la couleur. */
export function SentimentDot({ sentiment }: { sentiment: Sentiment | null }) {
  if (!sentiment) return <span className="inline-block h-2 w-2 rounded-full border border-gray-300 dark:border-zinc-600" title="Sentiment non déterminé" aria-label="Sentiment non déterminé" />
  return <span className={`inline-block h-2 w-2 rounded-full ${sentimentStyles[sentiment]}`} title={sentimentLabels[sentiment]} aria-label={sentimentLabels[sentiment]} />
}

export function SentimentBadge({ sentiment }: { sentiment: Sentiment | null }) {
  if (!sentiment) return <span className="text-[11px] text-gray-400 dark:text-zinc-500">—</span>
  return <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-zinc-300"><SentimentDot sentiment={sentiment} />{sentimentLabels[sentiment]}</span>
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
    <span className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold tabular-nums ${good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
      <Icon className="h-3 w-3 stroke-[2.5]" aria-hidden />{Math.abs(value)}{suffix}
    </span>
  )
}

export function Sparkline({ values, className = 'h-7 w-20' }: { values: number[]; className?: string }) {
  const max = Math.max(...values, 1)
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${100 - (value / max) * 90 - 5}`).join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={`${className} text-gray-700 dark:text-zinc-300`} aria-hidden>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function PeriodSelect({ days, onChange }: { days: 7 | 30 | 90; onChange: (days: 7 | 30 | 90) => void }) {
  return (
    <div role="group" aria-label="Période" className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 dark:border-white/[0.1] dark:bg-transparent">
      {([7, 30, 90] as const).map((value) => (
        <button key={value} type="button" onClick={() => onChange(value)} aria-pressed={days === value}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition duration-150 ${focusRing} ${days === value ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950' : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white'}`}>
          {value} j
        </button>
      ))}
    </div>
  )
}
