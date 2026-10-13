import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

export const REGISTER_URL = '/login?mode=register'

export function MarketingButton({ href, children, secondary = false, className = '' }: { href: string; children: ReactNode; secondary?: boolean; className?: string }) {
  return <Link href={href} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition-colors ${secondary ? 'border border-border-strong bg-surface text-ink-primary hover:bg-elevated' : 'bg-brand text-white hover:bg-brand-hover'} ${className}`}>{children}<ArrowRight aria-hidden className="h-4 w-4" /></Link>
}
export function MarketingCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border-strong bg-surface p-6 sm:p-8 ${className}`}>{children}</div>
}
export function MarketingBadge({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-md border border-border-strong bg-surface px-2.5 py-1 text-xs font-medium text-ink-secondary">{children}</span>
}
export function MarketingSection({ children, id, alternate = false, className = '' }: { children: ReactNode; id?: string; alternate?: boolean; className?: string }) {
  return <section id={id} className={`scroll-mt-20 ${alternate ? 'border-y border-border-strong bg-canvas' : 'bg-surface'} ${className}`}><div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">{children}</div></section>
}
export function MarketingHeading({ children, description }: { children: ReactNode; description?: string }) {
  return <div className="max-w-3xl"><h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{children}</h2>{description && <p className="mt-4 max-w-2xl text-base leading-7 text-ink-secondary">{description}</p>}</div>
}
export function MarketingFAQ({ question, answer }: { question: string; answer: string }) {
  return <details className="group border-b border-border-strong"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-5 text-base font-semibold"><span>{question}</span><ChevronDown aria-hidden className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary><p className="max-w-prose pb-6 text-sm leading-7 text-ink-secondary">{answer}</p></details>
}
