import type { Metadata } from 'next'
import { SiteShell } from '@/components/landing/SiteShell'
import { Eyebrow, Reveal, Section } from '@/components/landing/primitives'
import { H2, MUTED } from '@/components/landing/tokens'
import { WeeklyLegend, WeeklyScreen } from '@/components/landing/WeeklyScreen'
import { FinalCta } from '@/components/landing/sections'

export const metadata: Metadata = {
  title: 'Exemple — Qualio',
  description: 'Voici ce que vous voyez chaque semaine : une recommandation, les avis qui la prouvent, et votre décision.',
}

export default function ExemplePage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-5 pb-6 pt-20 text-center">
        <Reveal>
          <Eyebrow>Exemple</Eyebrow>
          <h1 className={`mx-auto mt-5 max-w-4xl ${H2}`}>Ce que vous voyez chaque semaine.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: MUTED }}>
            L’écran « Cette semaine », avec des avis d’exemple : une recommandation, les avis qui la prouvent, votre décision.
          </p>
        </Reveal>
      </section>

      <Section className="pt-8">
        <div className="grid items-start gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <Reveal>
            <WeeklyScreen />
          </Reveal>
          <Reveal delay={0.08} className="lg:sticky lg:top-28">
            <WeeklyLegend />
          </Reveal>
        </div>
      </Section>

      <FinalCta />
    </SiteShell>
  )
}
