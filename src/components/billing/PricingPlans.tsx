'use client'

import { SiteShell } from '@/components/landing/SiteShell'
import { Eyebrow } from '@/components/landing/primitives'
import { H2, MUTED } from '@/components/landing/tokens'
import { PricingCards } from './PricingCards'

/** Page /pricing : même carte de tarif que la landing, dans le cadre commun du site. */
export function PricingPlans() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Tarifs</Eyebrow>
          <h1 className={`mt-5 ${H2}`}>Commencez gratuitement. Payez quand vos avis deviennent un rythme.</h1>
          <p className="mt-5 text-base leading-relaxed" style={{ color: MUTED }}>
            Deux offres. Le plan Gratuit n’a pas de limite de durée et ne demande pas de carte bancaire.
          </p>
        </div>
        <PricingCards />
      </div>
    </SiteShell>
  )
}
