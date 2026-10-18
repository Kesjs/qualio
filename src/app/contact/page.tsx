import type { Metadata } from 'next'
import { SiteShell } from '@/components/landing/SiteShell'
import { ContactClient } from './ContactClient'

export const metadata: Metadata = {
  title: 'Contact & Support — Qualio',
  description: 'Une question sur la collecte d’avis, le widget ou les plans Qualio ? Écrivez à l’équipe. Réponse sous 24h ouvrées.',
}

export default function ContactPage() {
  return (
    <SiteShell>
      <ContactClient />
    </SiteShell>
  )
}
