'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check } from 'lucide-react'
import type { PaidPlan } from '@/lib/billing/plans'
import { BILLING_PLANS } from '@/lib/billing/plans'
import { ACCENT, ACCENT_INK, FOCUS, INK, LINE, MUTED, R_BUTTON, R_CARD, R_CHIP, SIGNUP } from '@/components/landing/tokens'

type Interval = 'month' | 'year'

const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || '$'

/**
 * Le paiement n'est proposé que lorsque NEXT_PUBLIC_BILLING_ENABLED=true (Stripe branché).
 * Sinon les cartes payantes gardent un bouton « Me prévenir » vers la page Contact (doc 9.1).
 */
const BILLING_ENABLED = process.env.NEXT_PUBLIC_BILLING_ENABLED === 'true'

/** Carte de tarif partagée par la landing, la page tarifs et les réglages. */
export function PricingCards() {
  const [interval, setInterval] = useState<Interval>('month')
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function checkoutPlan(plan: PaidPlan) {
    setLoadingPlan(plan)
    setError(null)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      })
      const result = await response.json().catch(() => ({}))
      if (response.status === 401) {
        window.location.assign(`/login?mode=register&redirectTo=${encodeURIComponent(`/pricing?plan=${plan}`)}`)
        return
      }
      if (!response.ok || !result.url) {
        setError(result.error ?? 'Le paiement n’est pas encore disponible.')
        return
      }
      window.location.assign(result.url)
    } catch {
      setError('Impossible d’ouvrir le paiement. Réessayez dans un instant.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const free = BILLING_PLANS.free
  const pro = BILLING_PLANS.pro
  const agency = BILLING_PLANS.agency
  const annual = interval === 'year'

  return (
    <div>
      <div className="mt-10 flex justify-center">
        <div role="group" aria-label="Période de facturation" className={`inline-flex border p-1 ${R_BUTTON}`} style={{ borderColor: LINE, background: '#fff' }}>
          {([['month', 'Mensuel'], ['year', 'Annuel']] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setInterval(value)}
              aria-pressed={interval === value}
              className={`px-4 py-2 text-sm font-semibold transition ${R_CHIP} ${FOCUS}`}
              style={interval === value ? { background: INK, color: '#fff' } : { color: MUTED }}
            >
              {label}
              {value === 'year' && <span className="ml-1.5 text-[11px] font-medium" style={{ color: interval === value ? '#fdba74' : ACCENT_INK }}>2 mois offerts</span>}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className={`mx-auto mt-6 max-w-xl border p-3 text-center text-sm ${R_BUTTON}`} style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' }}>{error}</p>
      )}

      <div className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Gratuit */}
        <article className={`flex flex-col border bg-white p-7 ${R_CARD}`} style={{ borderColor: LINE }}>
          <h3 className="text-base font-semibold">{free.label}</h3>
          <p className="mt-4 text-5xl font-semibold tracking-tight">0 {CURRENCY}</p>
          <p className="mt-3 text-sm" style={{ color: MUTED }}>Pour commencer avec vos avis. Sans limite de durée.</p>
          <ul className="mt-6 space-y-3 border-t pt-6 text-sm" style={{ borderColor: LINE }}>
            {free.features.map((f) => (
              <li key={f} className="flex gap-2.5">
                <Check size={16} className="mt-0.5 shrink-0" style={{ color: INK }} aria-hidden="true" />
                <span style={{ color: MUTED }}>{f}</span>
              </li>
            ))}
          </ul>
          <div className="flex-1" />
          <Link href={SIGNUP} className={`mt-8 block border py-3 text-center text-sm font-semibold transition hover:bg-[#f4f4f5] ${R_BUTTON} ${FOCUS}`} style={{ borderColor: LINE, color: INK }}>
            Commencer gratuitement
          </Link>
        </article>

        {/* Pro */}
        <article className={`relative flex flex-col bg-white p-7 ${R_CARD}`} style={{ border: `2px solid ${ACCENT}` }}>
          <span className={`absolute -top-3 left-7 px-2.5 py-1 text-[11px] font-semibold text-white ${R_CHIP}`} style={{ background: ACCENT_INK }}>Recommandé</span>
          <h3 className="text-base font-semibold">{pro.label}</h3>
          <p className="mt-4 text-5xl font-semibold tracking-tight">
            {annual ? pro.annualPriceEur : pro.priceEur} {CURRENCY}
            <span className="text-sm font-normal" style={{ color: MUTED }}> /{annual ? 'an' : 'mois'}</span>
          </p>
          <p className="mt-3 text-sm" style={{ color: MUTED }}>
            {annual ? '2 mois offerts par rapport au mensuel.' : 'Pour suivre vos avis chaque semaine.'}
          </p>
          <ul className="mt-6 space-y-3 border-t pt-6 text-sm" style={{ borderColor: LINE }}>
            {pro.features.map((f) => (
              <li key={f} className="flex gap-2.5">
                <Check size={16} className="mt-0.5 shrink-0" style={{ color: ACCENT }} aria-hidden="true" />
                <span style={{ color: MUTED }}>{f}</span>
              </li>
            ))}
          </ul>
          <div className="flex-1" />
          {BILLING_ENABLED ? (
            <button
              type="button"
              onClick={() => checkoutPlan('pro')}
              disabled={loadingPlan !== null}
              className={`mt-8 block w-full py-3 text-center text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 ${R_BUTTON} ${FOCUS}`}
              style={{ background: ACCENT_INK }}
            >
              {loadingPlan === 'pro' ? 'Ouverture du paiement…' : 'Commencer avec Pro'}
            </button>
          ) : (
            <Link href="/contact" className={`mt-8 block py-3 text-center text-sm font-semibold text-white transition hover:opacity-90 ${R_BUTTON} ${FOCUS}`} style={{ background: ACCENT_INK }}>
              Me prévenir
            </Link>
          )}
        </article>

        {/* Agence */}
        <article className={`relative flex flex-col bg-white p-7 border ${R_CARD}`} style={{ borderColor: INK }}>
          <span className={`absolute -top-3 left-7 px-2.5 py-1 text-[11px] font-semibold text-white ${R_CHIP}`} style={{ background: INK }}>Équipes & Agences</span>
          <h3 className="text-base font-semibold">{agency.label}</h3>
          <p className="mt-4 text-5xl font-semibold tracking-tight">
            {annual ? agency.annualPriceEur : agency.priceEur} {CURRENCY}
            <span className="text-sm font-normal" style={{ color: MUTED }}> /{annual ? 'an' : 'mois'}</span>
          </p>
          <p className="mt-3 text-sm" style={{ color: MUTED }}>
            {annual ? '2 mois offerts par rapport au mensuel.' : 'Pour gérer plusieurs clients et présenter des rapports sourcés.'}
          </p>
          <ul className="mt-6 space-y-3 border-t pt-6 text-sm" style={{ borderColor: LINE }}>
            {agency.features.map((f) => (
              <li key={f} className="flex gap-2.5">
                <Check size={16} className="mt-0.5 shrink-0" style={{ color: INK }} aria-hidden="true" />
                <span style={{ color: MUTED }}>{f}</span>
              </li>
            ))}
          </ul>
          <div className="flex-1" />
          {BILLING_ENABLED ? (
            <button
              type="button"
              onClick={() => checkoutPlan('agency')}
              disabled={loadingPlan !== null}
              className={`mt-8 block w-full py-3 text-center text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 ${R_BUTTON} ${FOCUS}`}
              style={{ background: INK }}
            >
              {loadingPlan === 'agency' ? 'Ouverture du paiement…' : 'Commencer avec Agence'}
            </button>
          ) : (
            <Link href="/contact?plan=agency" className={`mt-8 block py-3 text-center text-sm font-semibold text-white transition hover:opacity-90 ${R_BUTTON} ${FOCUS}`} style={{ background: INK }}>
              Me prévenir
            </Link>
          )}
        </article>
      </div>

      <p className="mt-8 text-center text-xs" style={{ color: MUTED }}>Vos données sont conservées si vous repassez en Gratuit.</p>
    </div>
  )
}
