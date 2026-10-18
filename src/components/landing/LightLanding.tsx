'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { ACCENT, ACCENT_INK, H2, INK, LINE, MUTED, R_CARD, SIGNUP } from './tokens'
import { REASSURANCE, STEPS, TESTIMONIALS } from './content'
import { MoreLink, PrimaryButton, Reveal, SecondaryButton, Section, UnderlineWord } from './primitives'
import { SiteShell } from './SiteShell'
import { AudienceCards, BetaBand, ComparisonTable, FaqSection, FinalCta, ProblemSection } from './sections'
import { DecisionAnimation } from './StepDemos'
import { WeeklyScreen } from './WeeklyScreen'
import { PricingCards } from '@/components/billing/PricingCards'
import { WidgetLiveDemo } from './WidgetLiveDemo'

/**
 * Landing (`/`) : le hero est adapté au texte actuel tout en conservant la mise en page
 * et la visualisation HeroScene (passage des avis aux décisions).
 */

export function LightLanding() {
  const [demoOpen, setDemoOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const onOpen = () => setDemoOpen(true)
    window.addEventListener('qualio:open-demo', onOpen)
    return () => window.removeEventListener('qualio:open-demo', onOpen)
  }, [])

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 1.5
  }, [])

  return (
    <SiteShell>
      {/* 1. Hero : une visualisation fixe explique le passage des avis aux décisions */}
      <section className="mx-auto max-w-6xl px-5 pb-10 text-center">
        <div className="flex min-h-[min(calc(100svh-4.5rem-7rem),46rem)] flex-col items-center justify-center py-12">
          <div className="hs-rise-now w-full">
            <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium" style={{ borderColor: LINE, color: MUTED }}>
              <span>Une lecture sourcée de vos avis</span>
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" style={{ color: ACCENT }} />
            </div>
            <h1 className="mx-auto text-[clamp(2.25rem,5.8vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.055em] [text-wrap:balance]">
              <span className="block lg:whitespace-nowrap">Des centaines d’avis</span>
              <span className="mt-2 block text-[#ee6018]">
                <span className="inline-block -skew-x-2 bg-[#fff1e9] px-3 py-1">
                  <span className="inline-block skew-x-2">Une direction plus claire</span>
                </span>
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: MUTED }}>
              Retrouvez les thèmes qui reviennent, les retours qui les expliquent et les pistes à examiner pour améliorer votre produit ou votre service.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryButton href={SIGNUP}>Commencer</PrimaryButton>
              <SecondaryButton onClick={() => setDemoOpen(true)}>Voir la démo</SecondaryButton>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium" style={{ color: MUTED }}>
              <Check size={14} className="text-emerald-600" aria-hidden="true" />
              <span>Sans carte bancaire</span>
              <span aria-hidden="true">·</span>
              <span>50 avis analysés gratuitement</span>
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs" style={{ color: MUTED }}>
              {['Import CSV', 'Widget sur votre site', 'Recommandations sourcées', 'Décisions humaines'].map((x) => (
                <span key={x} className="rounded-md border px-2.5 py-1" style={{ borderColor: LINE }}>{x}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl text-left">
          <p className="qualio-hero-note" aria-hidden="true">
            <svg width="34" height="22" viewBox="0 0 34 22" fill="none">
              <path d="M32 2C24 4 12 8 3 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M4 12l-1 7 7-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Qualio en 30 secondes
          </p>
          <div className="qualio-hero-frame">
            <div className="qualio-hero-video-wrap">
              <video
                ref={videoRef}
                className="qualio-hero-video"
                src="/qualio-final.mp4"
                autoPlay
                muted
                playsInline
                controls
                preload="metadata"
                aria-label="Démonstration de Qualio"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Bande de réassurance */}
      <section aria-label="En bref" className="border-y" style={{ borderColor: LINE }}>
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 py-4 text-[13px] font-medium" style={{ color: MUTED }}>
          {REASSURANCE.map((x) => (
            <li key={x} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} aria-hidden="true" />
              {x}
            </li>
          ))}
        </ul>
      </section>

      {/* 3. Le problème */}
      <ProblemSection />

      {/* 4. Comment ça marche : aperçu (version complète sur /produit) */}
      <Section id="produit" tone="soft">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className={H2}>De vos avis à la prochaine action, en quatre étapes.</h2>
            <p className="mt-5 text-base leading-relaxed" style={{ color: MUTED }}>
              Importez, collectez, repérez ce qui revient, puis décidez. Chaque conseil renvoie aux avis qui le justifient.
            </p>
            <ol className="mt-8 space-y-3">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-3 text-[15px]">
                  <span className="font-semibold" style={{ color: ACCENT_INK }}>{s.n}</span>
                  <span style={{ color: INK }}>{s.tag}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8"><MoreLink href="/produit">En savoir plus</MoreLink></div>
          </Reveal>
          <Reveal delay={0.08}>
            <DecisionAnimation mode="static" />
          </Reveal>
        </div>
      </Section>

      {/* 5. Ce que vous voyez chaque semaine : aperçu (version complète sur /exemple) */}
      <Section id="exemple">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className={H2}>Ce que vous voyez chaque semaine.</h2>
          <p className="mt-5 text-base leading-relaxed" style={{ color: MUTED }}>
            Une recommandation, les avis qui la prouvent, et votre décision. Rien de plus.
          </p>
        </Reveal>
        <Reveal delay={0.05} className="mx-auto mt-12 max-w-3xl">
          <WeeklyScreen full={false} />
        </Reveal>
        <Reveal delay={0.1} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryButton href={SIGNUP}>Commencer gratuitement</PrimaryButton>
          <SecondaryButton onClick={() => setDemoOpen(true)}>Voir la démo</SecondaryButton>
        </Reveal>
      </Section>

      {/* 6. Pourquoi pas un chat IA gratuit ? : aperçu (version complète sur /produit) */}
      <Section tone="soft">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className={H2}>Pourquoi pas un <UnderlineWord>chat IA gratuit</UnderlineWord> ?</h2>
          <p className="mt-5 text-base leading-relaxed" style={{ color: MUTED }}>
            Coller vos avis dans un chat marche une fois. Le suivi d’une semaine à l’autre, c’est ce que Qualio ajoute.
          </p>
        </Reveal>
        <Reveal delay={0.05} className="mx-auto mt-12 max-w-4xl">
          <ComparisonTable limit={3} />
        </Reveal>
        <div className="mt-8 text-center"><MoreLink href="/produit#chat-ia">En savoir plus</MoreLink></div>
      </Section>

      {/* 7. Pour qui : aperçu (version complète sur /produit) */}
      <Section>
        <Reveal className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className={H2}>Pensé pour ceux qui reçoivent des <UnderlineWord>avis</UnderlineWord>.</h2>
        </Reveal>
        <AudienceCards compact />
        <div className="mt-8 text-center"><MoreLink href="/produit#pour-qui">En savoir plus</MoreLink></div>
      </Section>

      {/* 8. Témoignages (seulement avec de vrais retours) ou bande « Bêta ouverte » */}
      {TESTIMONIALS.length > 0 ? (
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="grid gap-4 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delay={i * 0.05} className={`border bg-white p-7 ${R_CARD}`}>
                  <p className="text-lg leading-relaxed">« {t.quote} »</p>
                  <p className="mt-6 text-sm font-semibold">{t.name}</p>
                  <p className="text-xs" style={{ color: MUTED }}>{t.role}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <BetaBand />
      )}

      {/* 9. Tarifs */}
      <Section id="tarifs" tone="soft">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className={H2}>Commencez gratuitement. Payez quand vos avis deviennent un rythme.</h2>
        </Reveal>
        <PricingCards />
      </Section>

      {/* 10. Questions fréquentes */}
      <FaqSection />

      {/* 11. Appel final */}
      <FinalCta />

      {/* 12. Démo interactive du widget */}
      <WidgetLiveDemo isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </SiteShell>
  )
}
