'use client'
import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function LaunchButton({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  return <button type="button" className={`launch-${variant} ${className}`} {...props} />
}
export function LaunchCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-border-strong bg-surface ${className}`}>{children}</section>
}
export function LaunchBanner({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warning' | 'danger' }) {
  const tones = { neutral: 'border-border-strong bg-elevated text-ink-secondary', warning: 'border-warning/40 bg-warning/10 text-ink-primary', danger: 'border-danger/40 bg-danger/10 text-ink-primary' }
  return <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4 text-sm ${tones[tone]}`}>{children}</div>
}
export function LaunchEmpty({ title, body, href, label }: { title: string; body: string; href: string; label: string }) {
  return <LaunchCard className="p-6"><h2 className="text-lg font-semibold text-ink-primary">{title}</h2><p className="mt-2 max-w-prose text-sm leading-6 text-ink-secondary">{body}</p><Link href={href} className="launch-primary mt-5">{label}</Link></LaunchCard>
}
export function UsageBar({ value, limit, label }: { value: number; limit: number; label: string }) {
  const percent = limit > 0 ? Math.min(100, value / limit * 100) : 100
  return <div className="mt-4"><div className="flex flex-wrap justify-between gap-2 text-xs text-ink-secondary"><span>{label}</span><span className="font-mono">{value} / {limit}</span></div><div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={Math.min(value, limit)} className="mt-2 h-1.5 overflow-hidden rounded bg-elevated"><div className={`h-full ${percent >= 100 ? 'bg-danger' : percent >= 80 ? 'bg-warning' : 'bg-ink-muted'}`} style={{ width: `${percent}%` }} /></div>{percent >= 80 && <p className="mt-2 text-xs text-ink-secondary">{percent >= 100 ? 'Limite atteinte.' : 'Vous approchez de la limite.'}</p>}</div>
}
export function LaunchTabs<T extends string>({ value, onChange, items }: { value: T; onChange: (value: T) => void; items: Array<{ value: T; label: string }> }) {
  return <div role="group" aria-label="Vue de Cette semaine" className="flex gap-1 border-b border-border">{items.map((item) => <button key={item.value} type="button" aria-pressed={value === item.value} onClick={() => onChange(item.value)} className={`min-h-11 border-b-2 px-4 text-sm font-semibold ${value === item.value ? 'border-ink-primary text-ink-primary' : 'border-transparent text-ink-secondary hover:bg-elevated'}`}>{item.label}</button>)}</div>
}
