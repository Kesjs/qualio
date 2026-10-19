'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, ChevronDown, Minus } from 'lucide-react'
import { ACCENT, ACCENT_INK, DARK, FOCUS, H2, INK, LINE, MUTED, R_CARD, R_CHIP, SIGNUP, SOFT } from './tokens'
import { AUDIENCES, COMPARISON, FAQ, PROBLEMS } from './content'
import { Eyebrow, Reveal, PrimaryButton, Section, UnderlineWord } from './primitives'

const LOOP_ITEMS = [
  ['01', 'Collecter', 'CSV, widget ou ajout manuel.'],
  ['02', 'Comprendre', 'Les thèmes et les avis qui les prouvent.'],
  ['03', 'Décider', 'Accepter, reporter ou écarter une piste.'],
  ['04', 'Suivre', 'Voir ce qui évolue après la décision.'],
] as const

export function DecisionLoopSection() {
  const reduce = useReducedMotion()
  return (
    <Section tone="soft">
      <Reveal className="mx-auto max-w-3xl text-center">
        <Eyebrow>La boucle Qualio</Eyebrow>
        <h2 className={`mt-5 ${H2}`}>De l’avis reçu à la décision suivie.</h2>
        <p className="mt-5 text-base leading-relaxed" style={{ color: MUTED }}>Qualio garde le fil entre ce que vos clients disent, ce que votre équipe choisit et ce qui change ensuite.</p>
      </Reveal>
      <div className="mx-auto mt-12 grid max-w-5xl gap-3 md:grid-cols-4">
        {LOOP_ITEMS.map(([number, title, text], index) => (
          <Reveal key={number} delay={index * 0.06} className="relative h-full">
            <motion.div whileHover={reduce ? undefined : { y: -4 }} className={`h-full border bg-white p-6 ${R_CARD}`} style={{ borderColor: LINE }}>
              <span className="font-mono text-xs font-semibold" style={{ color: ACCENT_INK }}>{number}</span>
              <h3 className="mt-8 text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>{text}</p>
            </motion.div>
            {index < LOOP_ITEMS.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:block" size={18} style={{ color: ACCENT }} aria-hidden="true" />}
          </Reveal>
        ))}
      </div>
    </Section>
  )
}

export function TrendSection() {
  return (
    <Section tone="soft">
      <div className="grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
        <Reveal><Eyebrow>Suivi hebdomadaire</Eyebrow><h2 className={`mt-5 ${H2}`}>Ne regardez pas seulement ce qui est dit. Regardez ce qui évolue.</h2><p className="mt-5 text-base leading-relaxed" style={{ color: MUTED }}>Une synthèse garde sa date, ses avis sources et les recommandations qui en découlent. La tendance vous aide à savoir quoi examiner maintenant.</p><div className="mt-7 flex flex-wrap gap-2 text-xs" style={{ color: MUTED }}>{['Avis positifs', 'Avis négatifs', 'Thèmes en hausse', 'Nouveaux avis'].map((item) => <span key={item} className="border px-2.5 py-1.5" style={{ borderColor: LINE }}>{item}</span>)}</div></Reveal>
        <Reveal delay={0.08}><div className={`border bg-white p-5 sm:p-7 ${R_CARD}`} style={{ borderColor: LINE }}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: MUTED }}>Aperçu de démonstration</p><p className="mt-2 text-3xl font-semibold tracking-tight">Une tendance en hausse</p></div><span className="rounded-md px-2 py-1 text-xs font-semibold" style={{ color: ACCENT_INK, background: '#fff1e9' }}>Exemple</span></div><div className="mt-8 h-40" aria-label="Aperçu démonstratif d’une tendance des avis" role="img"><svg viewBox="0 0 560 150" className="h-full w-full" fill="none" preserveAspectRatio="none"><path d="M0 122 C60 116 78 98 130 104 S210 70 260 82 S330 46 380 62 S450 32 560 40" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" /><path d="M0 122 C60 116 78 98 130 104 S210 70 260 82 S330 46 380 62 S450 32 560 40 V150 H0 Z" fill={ACCENT} fillOpacity="0.08" /><path d="M0 145 H560" stroke={LINE} /></svg></div><div className="mt-4 flex items-center justify-between text-xs" style={{ color: MUTED }}><span>Il y a 4 semaines</span><span>Aujourd’hui</span></div><div className="mt-6 border-t pt-4" style={{ borderColor: LINE }}><p className="text-sm font-medium">Thème en hausse</p><p className="mt-1 text-sm" style={{ color: MUTED }}>La facturation revient dans 3 avis d’exemple.</p></div></div></Reveal>
      </div>
    </Section>
  )
}

export function ReportsSection() {
  return (
    <Section>
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal><div className={`border bg-[#18181b] p-6 text-white sm:p-8 ${R_CARD}`}><div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.14)' }}><span className="text-sm font-semibold">Recommandation · Facturation</span><span className="text-xs" style={{ color: '#a1a1aa' }}>3 avis sources</span></div><p className="mt-7 text-xl font-semibold tracking-tight">Rendre les factures plus faciles à retrouver.</p><p className="mt-3 text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>Les avis convergent vers un même obstacle. Votre équipe choisit la suite.</p><div className="mt-7 flex flex-wrap gap-2"><span className="border px-3 py-2 text-xs" style={{ borderColor: 'rgba(255,255,255,0.18)' }}>Accepter</span><span className="border px-3 py-2 text-xs" style={{ borderColor: 'rgba(255,255,255,0.18)' }}>Plus tard</span><span className="border px-3 py-2 text-xs" style={{ borderColor: ACCENT, color: '#ffb08d' }}>Écarter</span></div><p className="mt-6 text-xs" style={{ color: '#a1a1aa' }}>Décision conservée dans le suivi du projet.</p></div></Reveal>
        <Reveal delay={0.08}><Eyebrow>Décision humaine</Eyebrow><h2 className={`mt-5 ${H2}`}>L’IA propose. Votre équipe garde la main.</h2><p className="mt-5 text-base leading-relaxed" style={{ color: MUTED }}>Chaque recommandation reste reliée aux avis qui la justifient. Vous pouvez l’accepter, la reporter ou l’écarter, puis partager le résultat avec votre équipe ou votre client.</p><div className="mt-7 flex flex-wrap gap-2 text-xs" style={{ color: MUTED }}><span className="border px-2.5 py-1.5" style={{ borderColor: LINE }}>Notifications</span><span className="border px-2.5 py-1.5" style={{ borderColor: LINE }}>Rapport partageable</span><span className="border px-2.5 py-1.5" style={{ borderColor: LINE }}>Export CSV</span></div></Reveal>
      </div>
    </Section>
  )
}

/* ───────── Le problème (bloc sombre, statique) ───────── */

export function ProblemSection() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <div className={`grid gap-12 p-8 sm:p-14 lg:grid-cols-[1fr_1.15fr] lg:gap-16 ${R_CARD}`} style={{ background: DARK, color: '#fff' }}>
          <div>
            <Eyebrow dark>Le problème</Eyebrow>
            <h2 className={`mt-5 ${H2}`}>Les <UnderlineWord>avis</UnderlineWord> s’accumulent. Les décisions, elles, attendent.</h2>
          </div>
          <ul>
            {PROBLEMS.map(([t, d]) => (
              <li key={t} className="flex gap-4 border-t py-6 first:border-t-0 first:pt-0 last:pb-0" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
                <ArrowRight size={20} className="mt-1 shrink-0" style={{ color: ACCENT }} aria-hidden="true" />
                <div>
                  <h3 className="text-[20px] font-semibold tracking-tight">{t}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: '#a1a1aa' }}>{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  )
}

/* ───────── Pour qui ───────── */

export function AudienceCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {AUDIENCES.map((a, i) => (
        <Reveal key={a.tag} delay={i * 0.06} className="h-full">
          <div className={`flex h-full flex-col border bg-white p-7 ${R_CARD}`} style={{ borderColor: LINE }}>
            <span className={`inline-block w-fit px-2.5 py-1 text-xs font-medium text-white ${R_CHIP}`} style={{ background: '#3f3f46' }}>{a.tag}</span>
            <h3 className="mt-6 text-[22px] font-semibold leading-tight tracking-tight">{a.title}</h3>
            {!compact && <p className="mt-3 text-[15px] leading-relaxed" style={{ color: MUTED }}>{a.body}</p>}
            <div className="mt-auto flex flex-wrap gap-2 pt-8">
              {a.chips.map((c) => (
                <span key={c} className={`border px-2 py-1 text-[13px] ${R_CHIP}`} style={{ borderColor: LINE }}>{c}</span>
              ))}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  )
}

/* ───────── Pourquoi pas un chat IA gratuit ? ───────── */

export function ComparisonTable({ limit }: { limit?: number }) {
  const rows = limit ? COMPARISON.slice(0, limit) : COMPARISON
  return (
    <div className={`overflow-hidden border bg-white ${R_CARD}`} style={{ borderColor: LINE }}>
      <table className="w-full border-collapse text-left text-[14px] sm:text-[15px]">
        <caption className="sr-only">Comparaison entre un chat IA gratuit et Qualio</caption>
        <thead>
          <tr style={{ background: SOFT }}>
            <th scope="col" className="w-[40%] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] sm:px-6" style={{ color: MUTED }}><span className="sr-only">Critère</span></th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Un <UnderlineWord>chat IA gratuit</UnderlineWord></th>
            <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: ACCENT_INK }}>Qualio</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, chat, qualio]) => (
            <tr key={label} className="border-t align-top" style={{ borderColor: LINE }}>
              <th scope="row" className="px-4 py-4 font-medium sm:px-6" style={{ color: INK }}>{label}</th>
              <td className="px-4 py-4" style={{ color: MUTED }}>
                <span className="flex gap-2"><Minus size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{chat}</span>
              </td>
              <td className="px-4 py-4 font-medium" style={{ color: INK }}>
                <span className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0" style={{ color: ACCENT }} aria-hidden="true" />{qualio}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ───────── Bêta ouverte (à la place des témoignages) ───────── */

export function BetaBand() {
  return (
    <section className="px-5 pb-20">
      <Reveal className="mx-auto max-w-6xl">
        <div className={`flex flex-col items-start justify-between gap-6 border p-8 sm:flex-row sm:items-center sm:p-10 ${R_CARD}`} style={{ borderColor: LINE, background: SOFT }}>
          <div>
            <Eyebrow>Bêta ouverte</Eyebrow>
            <p className="mt-4 max-w-xl text-[20px] font-semibold leading-snug tracking-tight">
              Qualio est en bêta ouverte. Rejoignez les premiers utilisateurs et aidez-nous à le façonner.
            </p>
          </div>
          <PrimaryButton href={SIGNUP}>Commencer gratuitement</PrimaryButton>
        </div>
      </Reveal>
    </section>
  )
}

/* ───────── FAQ ───────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  return (
    <div className="border-b" style={{ borderColor: LINE }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-4 py-5 text-left ${FOCUS}`}
      >
        <span className="text-base font-medium" style={{ color: INK }}>{q}</span>
        <ChevronDown size={18} className="shrink-0 transition-transform" style={{ color: MUTED, transform: open ? 'rotate(180deg)' : 'none' }} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.25 }} className="overflow-hidden">
            <p className="pb-5 pr-8 text-sm leading-relaxed" style={{ color: MUTED }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 lg:grid-cols-[1fr_1.7fr] lg:gap-16">
        <Reveal>
          <div className="lg:sticky lg:top-28">
            <h2 className={H2}>Questions fréquentes</h2>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: MUTED }}>
              Une autre question ? <Link href="/contact" className="underline underline-offset-4" style={{ color: INK }}>Écrivez-nous</Link>.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="border-t" style={{ borderColor: LINE }}>
            {FAQ.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ───────── Appel final (bloc sombre) ───────── */

export function FinalCta({ title = 'Transformez chaque avis en prochaine décision.', text = 'Importez vos avis ou installez le widget. Votre première synthèse arrive dès qu’il y a assez de matière.' }: { title?: string; text?: string }) {
  return (
    <section className="px-5 pb-20">
      <Reveal className="mx-auto max-w-6xl">
        <div className={`px-6 py-16 text-center sm:px-16 sm:py-24 ${R_CARD}`} style={{ background: DARK, color: '#fff' }}>
          <h2 className="mx-auto max-w-3xl text-[clamp(2rem,4.8vw,3.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] [text-wrap:balance]">
            {title === 'Transformez chaque avis en prochaine décision.' ? <>Transformez chaque <UnderlineWord>avis</UnderlineWord> en prochaine décision.</> : title}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base" style={{ color: '#a1a1aa' }}>{text}</p>
          <div className="mt-10">
            <PrimaryButton href={SIGNUP} dark>Commencer gratuitement</PrimaryButton>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
