'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { LockClosedIcon } from '@heroicons/react/24/outline'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2410c]'

/** Un seul bouton mis en avant à la fois (doc 3.8) : le principal est neutre, la couleur est réservée à la priorité et aux alertes. */
export const btnPrimary = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-950 dark:hover:bg-zinc-200 ${FOCUS}`
export const btnSecondary = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-800 transition hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-transparent dark:text-zinc-100 dark:hover:border-white/30 ${FOCUS}`
export const btnQuiet = `inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-semibold text-gray-600 underline-offset-2 hover:text-gray-950 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-zinc-400 dark:hover:text-white ${FOCUS}`
export const surface = 'rounded-2xl border border-gray-200/80 bg-white dark:border-white/[0.08] dark:bg-[#181B21]'

const TONES = {
  info: 'border-gray-200 bg-gray-50 text-gray-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-200',
  warn: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100',
  alert: 'border-red-200 bg-red-50 text-red-900 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100',
} as const

/** Bandeau : information, avertissement ou alerte, avec une action facultative. */
export function Banner({ tone = 'info', children, action }: { tone?: keyof typeof TONES; children: ReactNode; action?: ReactNode }) {
  return (
    <div role={tone === 'alert' ? 'alert' : 'status'} className={`flex flex-col gap-3 rounded-xl border p-4 text-sm sm:flex-row sm:items-center sm:justify-between ${TONES[tone]}`}>
      <p className="leading-6">{children}</p>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Fonction d'un plan supérieur : cadenas, phrase claire, bouton (doc 3.1 et 3.7). */
export function LockedFeature({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className={`${surface} flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between`}>
      <div className="flex items-start gap-3">
        <LockClosedIcon className="mt-0.5 h-5 w-5 shrink-0 text-gray-500 dark:text-zinc-400" aria-hidden="true" />
        <div>
          <h3 className="text-base font-semibold text-gray-950 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">Disponible avec Pro.{children && <> {children}</>}</p>
        </div>
      </div>
      <Link href="/pricing" className={btnPrimary}>Passer à Pro</Link>
    </section>
  )
}

/** Indicateur de génération : le seul élément qui bouge sur les écrans de travail (doc 3.8). */
export function GeneratingPanel() {
  return (
    <div role="status" aria-live="polite" className={`${surface} flex items-center gap-4 p-6`}>
      <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 motion-reduce:animate-none dark:border-white/20 dark:border-t-white" aria-hidden="true" />
      <div>
        <p className="text-base font-semibold text-gray-950 dark:text-white">Lecture de vos avis…</p>
        <p className="mt-0.5 text-sm text-gray-600 dark:text-zinc-400">Cela prend quelques secondes.</p>
      </div>
    </div>
  )
}

const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Paris' })
export function formatDayMonth(value: string | Date | null | undefined): string | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : dayMonth.format(date)
}
