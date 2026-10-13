import type { Metadata } from 'next'
import { PricingPlans } from '@/components/billing/PricingPlans'

export const metadata: Metadata = {
  title: 'Tarifs — Qualio',
  description: 'Un plan Gratuit sans limite de durée, et Pro à 19 € par mois ou 190 € par an.',
}

export default function PricingPage() {
  return <PricingPlans />
}
