'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Check, Quote } from 'lucide-react'
import { ACCENT, ACCENT_INK, H2, INK, LINE, MUTED, R_CARD, SIGNUP } from './tokens'
import { REASSURANCE, STEPS, TESTIMONIALS } from './content'
import { MoreLink, PrimaryButton, Reveal, SecondaryButton, Section, UnderlineWord } from './primitives'
import { SiteShell } from './SiteShell'
import { AudienceCards, BetaBand, ComparisonTable, DecisionLoopSection, FaqSection, FinalCta, ProblemSection, ReportsSection, TrendSection } from './sections'
import { DecisionAnimation } from './StepDemos'
import { WeeklyScreen } from './WeeklyScreen'
import { PricingCards } from '@/components/billing/PricingCards'
import { WidgetLiveDemo } from './WidgetLiveDemo'
import { HeroVideo } from './HeroVideo'
import { HeroFloaters, HeroFrame, HeroHeadline } from './HeroMotion'

/**
 * Landing (`/`) : le hero est adapté au texte actuel tout en conservant la mise en page
 * et la visualisation HeroScene (passage des avis aux décisions).
 */

export function LightLanding() {
  const [demoOpen, setDemoOpen] = useState(false)
  const [expandedTestimonials, setExpandedTestimonials] = useState<Set<string>>(new Set())
  // Témoignages : ceux saisis dans content.ts, plus ceux que l'admin a publiés (avec l'accord de leurs auteurs).
  const [testimonials, setTestimonials] = useState<{ quote: string; name: string; role: string }[]>(TESTIMONIALS)
  const [testimonialsLoaded, setTestimonialsLoaded] = useState(false)
  useEffect(() => {
    let cancelled = false
    fetch('/api/testimonials', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { testimonials?: { quote: string; name: string; role: string }[] } | null) => {
        if (!cancelled && body?.testimonials?.length) setTestimonials([...TESTIMONIALS, ...body.testimonials].slice(0, 6))
        if (!cancelled) setTestimonialsLoaded(true)
      })
      .catch(() => { if (!cancelled) setTestimonialsLoaded(true) })
    return () => { cancelled = true }
  }, [])

  function toggleTestimonial(key: string) {
    setExpandedTestimonials((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  useEffect(() => {
    const onOpen = () => setDemoOpen(true)
    window.addEventListener('qualio:open-demo', onOpen)
    return () => window.removeEventListener('qualio:open-demo', onOpen)
  }, [])

  return (
    <SiteShell>
      {/* 1. Hero : moment signature, des avis dispersés se resserrent en une décision suivie */}
      <section className="mx-auto max-w-6xl px-5 pb-10 text-center">
        <div className="lp-hero flex min-h-[min(calc(100svh-4.5rem-7rem),46rem)] flex-col items-center justify-center py-12">
          <HeroFloaters />
          <div className="w-full">
            <HeroHeadline />
            <p className="hs-rise-now mx-auto mt-7 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: MUTED, ['--d' as string]: '0.75s' }}>
              Qualio regroupe vos retours, fait émerger les thèmes qui reviennent, propose des recommandations sourcées et vous aide à suivre ce que votre équipe décide ensuite.
            </p>
            <div className="hs-rise-now mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ ['--d' as string]: '0.9s' }}>
              <PrimaryButton href={SIGNUP}>Commencer</PrimaryButton>
              <SecondaryButton onClick={() => setDemoOpen(true)}>Voir la démo</SecondaryButton>
            </div>
            <p className="hs-rise-now mt-4 flex items-center justify-center gap-1.5 text-xs font-medium" style={{ color: MUTED, ['--d' as string]: '1s' }}>
              <Check size={14} className="text-emerald-600" aria-hidden="true" />
              <span>Sans carte bancaire</span>
              <span aria-hidden="true">·</span>
              <span>50 avis analysés gratuitement</span>
            </p>
            <div className="hs-rise-now mt-6 flex flex-wrap items-center justify-center gap-2 text-xs" style={{ color: MUTED, ['--d' as string]: '1.1s' }}>
              {['Import CSV', 'Widget sur votre site', 'Recommandations sourcées', 'Décisions humaines'].map((x) => (
                <span key={x} className="rounded-md border bg-white px-2.5 py-1" style={{ borderColor: LINE }}>{x}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl text-left">
          <p className="qualio-hero-note hs-rise-now" aria-hidden="true" style={{ ['--d' as string]: '1.3s' }}>
            <svg width="34" height="22" viewBox="0 0 34 22" fill="none">
              <path d="M32 2C24 4 12 8 3 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M4 12l-1 7 7-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Qualio en moins d’une minute
          </p>
          <HeroFrame>
            <HeroVideo />
          </HeroFrame>
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

      {/* 4. La boucle produit : collecter, comprendre, décider, suivre */}
      <DecisionLoopSection />

      {/* 5. Comment ça marche : aperçu (version complète sur /produit) */}
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
          <Reveal delay={0.08} variant="focus">
            <DecisionAnimation />
          </Reveal>
        </div>
      </Section>

      {/* 5. Ce que vous voyez chaque semaine : aperçu (version complète sur /exemple) */}
      <Section id="exemple">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className={H2}>Ce que vous voyez chaque semaine.</h2>
          <p className="mt-5 text-base leading-relaxed" style={{ color: MUTED }}>
            Les nouveaux avis, les thèmes qui montent, les sources qui les expliquent et la prochaine action à examiner.
          </p>
        </Reveal>
        <Reveal delay={0.05} variant="focus" className="mx-auto mt-12 max-w-3xl">
          <WeeklyScreen full={false} />
        </Reveal>
        <Reveal delay={0.1} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryButton href={SIGNUP}>Commencer gratuitement</PrimaryButton>
          <SecondaryButton onClick={() => setDemoOpen(true)}>Voir la démo</SecondaryButton>
        </Reveal>
      </Section>

      {/* 7. Tendances et suivi */}
      <TrendSection />

      {/* 8. Décision humaine et rapports */}
      <ReportsSection />

      {/* 9. Pourquoi pas un chat IA gratuit ? : aperçu (version complète sur /produit) */}
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
      {!testimonialsLoaded ? null : testimonials.length > 0 ? (
        <section className="border-t" style={{ borderColor: LINE }}>
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
            <Reveal className="mx-auto mb-10 max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: ACCENT_INK }}>Premiers utilisateurs</p>
              <h2 className="mt-3 text-[clamp(2rem,3.7vw,3rem)] font-semibold leading-[1.08] tracking-[-0.035em] [text-wrap:balance]">Ce que nos utilisateurs pensent de <span className="relative inline-block whitespace-nowrap" style={{ color: ACCENT_INK }}>Qualio<span className="pointer-events-none absolute -bottom-1 left-0 h-px w-full bg-[#ee6018]/45" aria-hidden="true" /></span>.</h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed" style={{ color: MUTED }}>Des retours réels, publiés avec l’accord de leur auteur.</p>
            </Reveal>
            <div className="grid gap-8 md:grid-cols-3 md:gap-6">
              {testimonials.map((t, i) => (
                <Reveal key={`${t.name}-${i}`} delay={i * 0.05} className={`group relative flex flex-col justify-between gap-8 border bg-white px-7 pb-7 pt-8 shadow-[0_1px_0_rgba(11,11,12,0.03)] ${i === 1 ? 'md:translate-y-3' : i === 2 ? 'md:translate-y-6' : ''} ${R_CARD}`}>
                  <span className="pointer-events-none absolute -left-2 -top-2 text-gray-300" aria-hidden="true">＋</span>
                  {(() => {
                    const key = `${t.name}-${i}`
                    const expanded = expandedTestimonials.has(key)
                    return <button type="button" aria-expanded={expanded} aria-label={`${expanded ? 'Réduire' : 'Lire'} le témoignage de ${t.name}`} onClick={() => toggleTestimonial(key)} className="flex h-full flex-col justify-between gap-8 text-left">
                      <div className="flex gap-4">
                        <Quote className="mt-0.5 h-6 w-6 shrink-0 stroke-[1.2]" style={{ color: MUTED }} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <blockquote className={`overflow-hidden text-base leading-7 transition-[max-height] duration-500 ease-out ${expanded ? 'max-h-[30rem]' : 'max-h-36'}`} style={{ color: MUTED }}>« {t.quote} »</blockquote>
                          <span className="mt-3 inline-flex items-center text-xs font-semibold" style={{ color: ACCENT_INK }}>{expanded ? 'Réduire' : 'Lire la suite'}<ArrowRight className={`ml-1.5 h-3.5 w-3.5 transition-transform duration-300 ${expanded ? '-rotate-90' : 'rotate-0'}`} aria-hidden="true" /></span>
                        </div>
                      </div>
                      <figcaption className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1e9] text-sm font-semibold" style={{ color: ACCENT_INK }} aria-hidden="true">{t.name.trim().charAt(0).toUpperCase()}</span>
                        <span className="flex min-w-0 flex-col"><cite className="text-sm font-semibold not-italic" style={{ color: INK }}>{t.name}</cite><span className="text-xs" style={{ color: MUTED }}>{t.role}</span></span>
                      </figcaption>
                    </button>
                  })()}
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
