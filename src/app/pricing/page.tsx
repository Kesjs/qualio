import type { Metadata } from 'next'
import { PricingPlans } from '@/components/billing/PricingPlans'

export const metadata: Metadata = {
  title: 'Tarifs — Qualio',
  description: 'Un plan Gratuit sans limite de durée, Pro à 19 $ par mois et Agence à 49 $ par mois.',
}

export default function PricingPage() {
  return <PricingPlans />
}
