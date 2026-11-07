'use client'

import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUp, Layers, ListChecks, MessageSquare, RotateCcw, Smile, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ACCENT, ACCENT_INK, ACCENT_SOFT, H2, INK, LINE, MUTED, R_CARD } from './tokens'
import { Reveal, Section } from './primitives'

/**
 * Le cycle expliqué par son résultat, pas par les fonctionnalités :
 * un avis bien traité → un client plus satisfait → de meilleurs avis.
 * L'étape portée par Qualio est mise en avant ; les autres sont le résultat chez le client.
 */

type Step = { icon: LucideIcon; title: string; text: string; qualio?: boolean }

const STEPS: Step[] = [
  { icon: MessageSquare, title: 'Un client s’exprime', text: 'Un avis, un message, un fichier importé : il dit ce qui a marché ou non.' },
  { icon: Layers, title: 'Les thèmes se dégagent', text: 'Qualio regroupe ce qui revient, avec les avis qui le prouvent.', qualio: true },
  { icon: ListChecks, title: 'Vous corrigez', text: 'Une recommandation devient une tâche que votre équipe accepte ou écarte.', qualio: true },
  { icon: Sparkles, title: 'L’expérience s’améliore', text: 'Le problème ne se reproduit plus pour le client suivant.' },
  { icon: Smile, title: 'Plus de clients satisfaits', text: 'Ils reviennent, ils recommandent, ils laissent de meilleurs avis.' },
  { icon: RotateCcw, title: 'Le cycle recommence', text: 'Chaque nouvel avis vous montre la prochaine chose à améliorer.' },
]

export function CycleSection() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const show = reduce || inView

  return (
    <Section id="cycle">
      <Reveal className="mx-auto max-w-3xl text-center">
        <h2 className={H2}>Un avis bien traité, c’est un client qui reste.</h2>
        <p className="mt-5 text-base leading-relaxed" style={{ color: MUTED }}>
          Plus vous corrigez vite ce qui revient dans vos avis, plus vos clients sont satisfaits, et plus les prochains avis parlent pour vous.
        </p>
      </Reveal>

      <div ref={ref} className="mx-auto mt-14 max-w-6xl">
        <ol className="grid gap-3 lg:grid-cols-6 lg:gap-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.li
                key={step.title}
                className="relative"
                initial={reduce ? false : { opacity: 1, y: 14 }}
                animate={show ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.55, delay: index * 0.14, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className={`flex h-full gap-4 border p-4 lg:flex-col lg:gap-3 ${R_CARD}`}
                  style={{
                    borderColor: step.qualio ? '#f8c9ad' : LINE,
                    background: step.qualio ? ACCENT_SOFT : '#fff',
                  }}
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                    style={{ background: step.qualio ? '#fff' : '#f4f4f5', color: step.qualio ? ACCENT_INK : MUTED }}
                    aria-hidden="true"
                  >
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold leading-snug tracking-tight" style={{ color: INK }}>{step.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed" style={{ color: MUTED }}>{step.text}</p>
                    {step.qualio && (
                      <span className="mt-2 inline-block text-xs font-semibold" style={{ color: ACCENT_INK }}>Là où Qualio agit</span>
                    )}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <ArrowRight
                    className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:-right-3 lg:block"
                    size={16}
                    style={{ color: step.qualio && STEPS[index + 1].qualio ? ACCENT : '#c4c4cc' }}
                    aria-hidden="true"
                  />
                )}
              </motion.li>
            )
          })}
        </ol>

        {/* Retour de la boucle : le dernier maillon ramène au premier (grand écran) */}
        <div
          className="relative mx-auto mt-3 hidden h-12 w-[calc(100%-6rem)] rounded-b-2xl border-x border-b lg:block"
          style={{ borderColor: '#f8c9ad' }}
          aria-hidden="true"
        >
          <ArrowUp className="absolute -left-[9px] -top-2 bg-white" size={16} style={{ color: ACCENT }} />
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-white px-3 text-[13px] font-medium" style={{ color: INK }}>
            Chaque avis traité attire les prochains clients.
          </span>
        </div>
        <p className="mt-5 text-center text-sm font-medium lg:hidden" style={{ color: INK }}>
          Chaque avis traité attire les prochains clients.
        </p>
      </div>
    </Section>
  )
}
