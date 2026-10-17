'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, ChevronDown, Minus } from 'lucide-react'
import { ACCENT, ACCENT_INK, DARK, FOCUS, H2, INK, LINE, MUTED, R_CARD, R_CHIP, SIGNUP, SOFT } from './tokens'
import { AUDIENCES, COMPARISON, FAQ, PROBLEMS } from './content'
import { Eyebrow, Reveal, PrimaryButton, UnderlineWord } from './primitives'

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
