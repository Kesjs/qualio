import type { Metadata } from 'next'
import { SiteShell } from '@/components/landing/SiteShell'
import { Eyebrow, PrimaryButton } from '@/components/landing/primitives'
import { H2, MUTED } from '@/components/landing/tokens'
import { LEGAL } from '@/components/landing/legal'

export const metadata: Metadata = {
  title: 'Contact — Qualio',
  description: 'Une question sur la collecte, l’import de vos avis ou leur transformation en décisions ? Écrivez-nous.',
}

export default function ContactPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-5 py-24">
        <Eyebrow>Contact</Eyebrow>
        <h1 className={`mt-5 ${H2}`}>Parler de vos avis clients</h1>
        <p className="mt-6 max-w-2xl text-base leading-7" style={{ color: MUTED }}>
          Une question sur la collecte, l’import de vos avis ou leur transformation en décisions ? Écrivez-nous. Vous voulez être prévenu quand le plan Pro ouvre ? Dites-le-nous aussi.
        </p>
        <div className="mt-8">
          <PrimaryButton href={`mailto:${LEGAL.email}`}>Écrire à l’équipe</PrimaryButton>
        </div>
      </div>
    </SiteShell>
  )
}
