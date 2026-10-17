'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, ChevronDown } from 'lucide-react'
import type { PaidPlan } from '@/lib/billing/plans'
import { BILLING_PLANS, isPaidPlan } from '@/lib/billing/plans'
import { ACCENT, ACCENT_INK, FOCUS, INK, LINE, MUTED, R_BUTTON, R_CARD, R_CHIP } from '@/components/landing/tokens'

type Interval = 'month' | 'year'

const CURRENCY = '€'

/** Carte de tarif partagée par la landing, la page tarifs et les réglages. */
export function PricingCards() {
  const searchParams = useSearchParams()
  const [interval, setInterval] = useState<Interval>('month')
  const [loadingPlan, setLoadingPlan] = useState<PaidPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const checkoutStarted = useRef(false)

  async function checkoutPlan(plan: PaidPlan, requestedInterval: Interval = interval) {
    setLoadingPlan(plan)
    setError(null)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval: requestedInterval }),
      })
      const result = await response.json().catch(() => ({}))
      if (response.status === 401) {
        window.location.assign(`/login?mode=register&plan=${plan}&redirectTo=${encodeURIComponent(`/pricing?plan=${plan}&interval=${requestedInterval}&checkout=1`)}`)
        return
      }
      if (!response.ok || !result.url) {
        setError(result.error ?? 'Le paiement n’est pas encore disponible.')
        return
      }
      // Keep Qualio available while the hosted GeniusPay checkout is open.
      // If the browser blocks a new tab, fall back to the current tab.
      const paymentWindow = window.open(result.url, '_blank', 'noopener,noreferrer')
      if (!paymentWindow) window.location.assign(result.url)
    } catch {
      setError('Impossible d’ouvrir le paiement. Réessayez dans un instant.')
    } finally {
      setLoadingPlan(null)
    }
  }

  async function choosePlan(plan: PaidPlan) {
    // Le bouton doit toujours suivre le vrai parcours d’abonnement :
    // authentification si nécessaire, puis Checkout Stripe.
    await checkoutPlan(plan)
  }

  // Après l’authentification, reprendre automatiquement l’intention payante
  // au lieu de renvoyer l’utilisateur vers un dashboard Gratuit.
  useEffect(() => {
    const requestedPlan = searchParams.get('plan')
    const requestedInterval = searchParams.get('interval')
    if (searchParams.get('checkout') !== '1' || !isPaidPlan(requestedPlan) || checkoutStarted.current) return
    const nextInterval = requestedInterval === 'month' || requestedInterval === 'year' ? requestedInterval : 'month'
    if (requestedInterval === 'month' || requestedInterval === 'year') setInterval(requestedInterval)
    checkoutStarted.current = true
    void checkoutPlan(requestedPlan, nextInterval)
  }, [searchParams])

  const free = BILLING_PLANS.free
  const pro = BILLING_PLANS.pro
  const agency = BILLING_PLANS.agency
  const annual = interval === 'year'
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const comparisonRows = [
    ['Projets actifs', '1', '5', '15'],
    ['Avis par projet', '50', '2 000', '10 000'],
    ['Synthèses manuelles', '2 par mois', '1 par jour', '1 par jour'],
    ['Synthèse automatique', '—', 'Chaque semaine', 'Chaque semaine'],
    ['Widget de collecte', 'Oui (50 avis analysés)', 'Oui', 'Oui, sur 15 sites'],
    ['Avis reçus au-delà de la limite', 'Conservés en attente, jusqu’à 100', 'Analysés', 'Analysés'],
    ['Email du lundi', 'Court, 2 par mois max', 'Complet', 'Complet, tous projets'],
    ['Alerte thème négatif', '—', 'Oui', 'Oui'],
    ['Historique et effet des décisions', '—', 'Oui', 'Oui'],
    ['Rapport client partageable', '—', '—', 'Oui'],
    ['Export CSV des avis', '—', '—', 'Oui'],
  ] as const

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
          <Link href="/login?mode=register&plan=free" className={`mt-8 block border py-3 text-center text-sm font-semibold transition hover:bg-[#f4f4f5] ${R_BUTTON} ${FOCUS}`} style={{ borderColor: LINE, color: INK }}>
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
          <button
            type="button"
            onClick={() => choosePlan('pro')}
            disabled={loadingPlan !== null}
            className={`mt-8 block w-full py-3 text-center text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 ${R_BUTTON} ${FOCUS}`}
            style={{ background: ACCENT_INK }}
          >
            {loadingPlan === 'pro' ? 'Chargement…' : 'Commencer avec Pro'}
          </button>
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
          <button
            type="button"
            onClick={() => choosePlan('agency')}
            disabled={loadingPlan !== null}
            className={`mt-8 block w-full py-3 text-center text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 ${R_BUTTON} ${FOCUS}`}
            style={{ background: INK }}
          >
            {loadingPlan === 'agency' ? 'Chargement…' : 'Commencer avec Agence'}
          </button>
        </article>
      </div>

      <p className="mt-8 text-center text-xs" style={{ color: MUTED }}>Vos données sont conservées si vous repassez en Gratuit.</p>
      <div className="mx-auto mt-8 max-w-5xl border-t pt-8" style={{ borderColor: LINE }}>
        <button
          type="button"
          aria-expanded={comparisonOpen}
          aria-controls="plan-comparison"
          onClick={() => setComparisonOpen((value) => !value)}
          className={`mx-auto flex min-h-11 items-center gap-2 border px-4 py-2.5 text-sm font-semibold transition hover:bg-[#f4f4f5] ${R_BUTTON} ${FOCUS}`}
          style={{ borderColor: LINE, color: INK }}
        >
          {comparisonOpen ? 'Masquer le comparatif' : 'Comparer les offres'}
          <ChevronDown size={17} aria-hidden="true" className="transition-transform" style={{ transform: comparisonOpen ? 'rotate(180deg)' : undefined }} />
        </button>
        {comparisonOpen && (
          <div id="plan-comparison" className="mt-6 overflow-x-auto border bg-white" style={{ borderColor: LINE }}>
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <caption className="sr-only">Comparatif des offres Gratuit, Pro et Agence</caption>
              <thead>
                <tr style={{ background: '#f7f7f7' }}>
                  <th scope="col" className="w-[34%] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Fonctionnalité</th>
                  <th scope="col" className="px-4 py-3 text-sm font-semibold">Gratuit</th>
                  <th scope="col" className="px-4 py-3 text-sm font-semibold" style={{ color: ACCENT_INK }}>Pro</th>
                  <th scope="col" className="px-4 py-3 text-sm font-semibold">Agence</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([label, freeValue, proValue, agencyValue]) => (
                  <tr key={label} className="border-t align-top" style={{ borderColor: LINE }}>
                    <th scope="row" className="px-4 py-3.5 font-medium" style={{ color: INK }}>{label}</th>
                    <td className="px-4 py-3.5" style={{ color: MUTED }}>{freeValue}</td>
                    <td className="px-4 py-3.5 font-medium" style={{ color: INK }}>{proValue}</td>
                    <td className="px-4 py-3.5" style={{ color: MUTED }}>{agencyValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
