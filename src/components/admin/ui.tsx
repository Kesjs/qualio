import Link from 'next/link'
import type { ReactNode } from 'react'
import { pageCount } from '@/lib/admin/format'
import { AdminSelect } from '@/components/admin/AdminSelect'

/** Anneau de focus commun : visible sur fond sombre comme sur le panneau clair de la connexion. */
export const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff8a50]'
export const BTN_PRIMARY = `inline-flex min-h-11 items-center justify-center rounded-lg bg-[#c2410c] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#9a3412] disabled:opacity-60 ${FOCUS}`
export const BTN_SECONDARY = `inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-[#eeeeee] transition-colors hover:bg-white/[0.08] disabled:opacity-60 ${FOCUS}`
export const FIELD = `min-h-11 w-full rounded-lg border border-white/20 bg-[#161413] px-3 text-sm text-[#eeeeee] placeholder:text-stone-400 ${FOCUS}`
export const TH = 'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-stone-400'
export const TH_RIGHT = 'whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.1em] text-stone-400'
export const TD = 'px-4 py-3 align-middle'

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent'

const TONES: Record<Tone, string> = {
  neutral: 'border-white/15 bg-white/[0.06] text-stone-200',
  success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  danger: 'border-red-400/30 bg-red-400/10 text-red-300',
  info: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  accent: 'border-[#ee6018]/40 bg-[#ee6018]/10 text-[#ff9a66]',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}>{children}</span>
}

export function statusTone(status: string): Tone {
  if (status === 'new') return 'accent'
  if (status === 'in_progress') return 'info'
  if (status === 'planned') return 'warning'
  if (status === 'done') return 'success'
  return 'neutral'
}

export function emailTone(status: string): Tone {
  if (status === 'sent') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'pending') return 'warning'
  return 'neutral'
}

export function PageHeader({ eyebrow, title, description, aside }: { eyebrow: string; title: string; description?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#ff9a66]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">{description}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
  )
}

export function Panel({ id, title, description, action, children, flush }: { id: string; title: string; description?: string; action?: ReactNode; children: ReactNode; flush?: boolean }) {
  return (
    <section aria-labelledby={`${id}-titre`} className="rounded-2xl border border-white/10 bg-[#1d1a18]">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-4">
        <div>
          <h2 id={`${id}-titre`} className="text-lg font-semibold">{title}</h2>
          {description && <p className="mt-1 text-sm text-stone-400">{description}</p>}
        </div>
        {action}
      </div>
      <div className={flush ? '' : 'px-5 pb-5'}>{children}</div>
    </section>
  )
}

export function StatCard({ label, value, hint, href, tone = 'neutral' }: { label: string; value: ReactNode; hint?: string; href?: string; tone?: Tone }) {
  const body = (
    <>
      <p className="text-sm font-medium text-stone-400">{label}</p>
      <p className={`mt-3 font-mono text-3xl font-semibold ${tone === 'danger' ? 'text-red-300' : tone === 'accent' ? 'text-[#ff9a66]' : ''}`}>{value}</p>
      {hint && <p className="mt-2 text-xs text-stone-400">{hint}</p>}
    </>
  )
  const base = 'block rounded-2xl border border-white/10 bg-[#1d1a18] p-5'
  return href ? <Link href={href} className={`${base} transition-colors hover:border-white/25 hover:bg-[#232019] ${FOCUS}`}>{body}</Link> : <div className={base}>{body}</div>
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Notice({ tone = 'warning', children }: { tone?: 'warning' | 'danger' | 'info'; children: ReactNode }) {
  return <div role={tone === 'danger' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm leading-6 ${TONES[tone]}`}>{children}</div>
}

/** Tableau défilant : la zone est atteignable au clavier et annoncée comme une région nommée. */
export function TableRegion({ label, children }: { label: string; children: ReactNode }) {
  return <div role="region" aria-label={label} tabIndex={0} className={`overflow-x-auto rounded-xl border border-white/10 ${FOCUS}`}>{children}</div>
}

export function FilterBar({ label, resetHref, children }: { label: string; resetHref: string; children: ReactNode }) {
  return (
    <form method="get" role="search" aria-label={label} className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-[#1d1a18] p-4">
      {children}
      <div className="flex gap-2">
        <button type="submit" className={BTN_PRIMARY}>Filtrer</button>
        <Link href={resetHref} className={BTN_SECONDARY}>Réinitialiser</Link>
      </div>
    </form>
  )
}

export { AdminSelect } from '@/components/admin/AdminSelect'

export function SelectField({ label, name, value, options, allLabel }: { label: string; name: string; value: string; options: Array<{ value: string; label: string }>; allLabel: string }) {
  const id = `filtre-${name}`
  const allOptions = [{ value: '', label: allLabel }, ...options]
  return (
    <div className="min-w-[10rem] flex-1">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-stone-300">{label}</label>
      <AdminSelect id={id} name={name} defaultValue={value} options={allOptions} />
    </div>
  )
}

export function SearchField({ label, name, value, placeholder }: { label: string; name: string; value: string; placeholder?: string }) {
  const id = `filtre-${name}`
  return (
    <div className="min-w-[14rem] flex-[2]">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-stone-300">{label}</label>
      <input id={id} name={name} type="search" defaultValue={value} placeholder={placeholder} maxLength={120} className={FIELD} />
    </div>
  )
}

export function Pagination({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (page: number) => string }) {
  const pages = pageCount(total, pageSize)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const link = `inline-flex min-h-11 items-center rounded-lg border border-white/20 px-4 text-sm font-semibold hover:bg-white/[0.08] ${FOCUS}`
  const off = 'inline-flex min-h-11 items-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-stone-500'
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-stone-400">{total === 0 ? 'Aucun résultat' : <>Résultats <span className="font-mono text-stone-200">{from}–{to}</span> sur <span className="font-mono text-stone-200">{total}</span></>}</p>
      {pages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 ? <Link href={hrefFor(page - 1)} rel="prev" className={link}>Précédent</Link> : <span aria-disabled="true" className={off}>Précédent</span>}
          <span className="px-2 font-mono text-sm text-stone-300">Page {page} / {pages}</span>
          {page < pages ? <Link href={hrefFor(page + 1)} rel="next" className={link}>Suivant</Link> : <span aria-disabled="true" className={off}>Suivant</span>}
        </div>
      )}
    </nav>
  )
}
