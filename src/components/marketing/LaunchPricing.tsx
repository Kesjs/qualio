'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { LAUNCH_OFFERS } from '@/lib/billing/launch-offers'
import { MarketingCard, REGISTER_URL } from './ui'

export function LaunchPricing() {
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  return <div className="mt-10"><div className="flex flex-wrap items-center justify-center gap-3"><div role="group" aria-label="Périodicité de l’abonnement" className="inline-flex rounded-md border border-border-strong bg-surface p-1">{([['month', 'Mensuel'], ['year', 'Annuel']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={interval === value} onClick={() => setInterval(value)} className={`min-h-10 rounded-md px-4 text-sm font-semibold ${interval === value ? 'bg-ink-primary text-surface' : 'text-ink-secondary hover:bg-elevated'}`}>{label}</button>)}</div><span className="text-xs text-ink-secondary">2 mois offerts avec l’annuel</span></div>
    <div className="mt-8 grid gap-5 md:grid-cols-2">{LAUNCH_OFFERS.map((plan) => <MarketingCard key={plan.id} className={`flex flex-col ${plan.id === 'pro' ? '!border-brand' : ''}`}><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">{plan.name}</h3></div><p className="mt-5 flex items-baseline gap-2"><strong className="text-5xl font-semibold tracking-tight">{plan.id === 'free' ? '0' : interval === 'month' ? plan.monthly : plan.annual} €</strong><span className="text-sm text-ink-secondary">{plan.id === 'free' ? 'sans limite de durée' : interval === 'month' ? '/ mois' : '/ an'}</span></p><p className="mt-3 text-sm text-ink-secondary">{plan.description}</p><ul className="mt-6 space-y-3 border-t border-border-strong pt-6 text-sm text-ink-secondary">{[`${plan.projects} projet${plan.projects > 1 ? 's' : ''}`, `${plan.feedback.toLocaleString('fr-FR')} avis par projet`, ...plan.features].map((feature) => <li key={feature} className="flex gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-ink-primary" aria-hidden /><span>{feature}</span></li>)}</ul><Link href={plan.id === 'free' ? REGISTER_URL : `/login?mode=register&plan=pro&interval=${interval}&redirectTo=${encodeURIComponent(`/pricing?plan=pro&interval=${interval}&checkout=1`)}`} className={`mt-8 flex min-h-11 items-center justify-center rounded-md px-4 py-3 text-sm font-semibold ${plan.id === 'pro' ? 'bg-brand text-white hover:bg-brand-hover' : 'border border-border-strong text-ink-primary hover:bg-elevated'}`}>{plan.id === 'free' ? 'Commencer gratuitement' : 'Commencer avec Pro'}</Link></MarketingCard>)}</div>
    <p className="mt-6 text-center text-xs leading-6 text-ink-secondary">Vos données sont conservées si vous repassez en Gratuit.</p>
    <p className="mx-auto mt-3 max-w-2xl text-center text-xs leading-6 text-ink-secondary">Le Gratuit inclut 2 synthèses par mois. Pro démarre après inscription et paiement sécurisé.</p>
  </div>
}
