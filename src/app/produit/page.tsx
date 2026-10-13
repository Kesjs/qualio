import type { Metadata } from 'next'
import { SiteShell } from '@/components/landing/SiteShell'
import { Eyebrow, Reveal, Section } from '@/components/landing/primitives'
import { H2, MUTED } from '@/components/landing/tokens'
import { AudienceCards, ComparisonTable, FinalCta } from '@/components/landing/sections'
import { StepsFull } from '@/components/landing/StepsFull'

export const metadata: Metadata = {
  title: 'Produit — Qualio',
  description: 'Importez vos avis, repérez ce qui revient avec les avis à l’appui, puis décidez : Qualio transforme vos avis clients en recommandations sourcées.',
}

export default function ProduitPage() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-5 pb-6 pt-20 text-center">
        <Reveal>
          <Eyebrow>Produit</Eyebrow>
          <h1 className={`mx-auto mt-5 max-w-4xl ${H2}`}>De vos avis à la prochaine action, en quatre étapes.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: MUTED }}>
            Qualio lit vos avis clients avec une IA, regroupe ce qui revient et cite les avis qui justifient chaque conseil. Vous décidez.
          </p>
        </Reveal>
      </section>

      <Section id="fonctionnement" className="pt-0">
        <StepsFull />
      </Section>

      <Section id="pour-qui" tone="soft">
        <Reveal className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className={H2}>Pensé pour ceux qui reçoivent des avis.</h2>
        </Reveal>
        <AudienceCards />
      </Section>

      <Section id="chat-ia">
        <Reveal className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className={H2}>Pourquoi pas un chat IA gratuit ?</h2>
          <p className="mt-5 text-base leading-relaxed" style={{ color: MUTED }}>
            Coller vos avis dans un chat marche une fois. Le suivi d’une semaine à l’autre, c’est ce que Qualio ajoute.
          </p>
        </Reveal>
        <Reveal>
          <ComparisonTable />
        </Reveal>
      </Section>

      <FinalCta />
    </SiteShell>
  )
}
