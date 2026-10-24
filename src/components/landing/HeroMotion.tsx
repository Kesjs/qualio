'use client'

import { useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'

/*
 * Moment signature du hero : « Des avis dispersés » → « Une décision suivie ».
 *  - Le titre arrive mot par mot (CSS pur, visible dès le premier rendu, sans dépendre de React).
 *  - Des fragments d'avis entrent dispersés autour du titre puis se resserrent (grand écran seulement).
 *  - La maquette sous le titre se redresse au défilement.
 *  - « Réduire les animations » : état final immédiat (voir globals.css).
 */

type Vars = CSSProperties & { [key: `--${string}`]: string | number }

const WORD_STEP = 0.07

function Words({ text, start }: { text: string; start: number }) {
  return (
    <>
      {text.split(' ').map((word, i, all) => (
        <span key={`${word}-${i}`}>
          <span className="lp-word" style={{ '--d': `${start + i * WORD_STEP}s` } as Vars}>{word}</span>
          {i < all.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

export function HeroHeadline() {
  const first = 'Des avis dispersés'
  const secondStart = 0.1 + first.split(' ').length * WORD_STEP + 0.12
  const markDelay = secondStart + 0.2
  return (
    <h1 className="mx-auto text-[clamp(2.25rem,5.8vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.04em] [text-wrap:balance]">
      <span className="block lg:whitespace-nowrap"><Words text={first} start={0.1} /></span>
      <span className="mt-2 block text-[#c2410c]">
        <span className="lp-mark" style={{ '--d': `${markDelay}s` } as Vars}>
          <Words text="Une décision suivie" start={secondStart} />
          <span className="lp-mark-dot" aria-hidden="true" style={{ '--d': `${markDelay + 0.85}s` } as Vars} />
        </span>
      </span>
    </h1>
  )
}

/** Fragments d'avis : positions en % du bloc hero, point de départ (dispersion) en px. */
const FRAGMENTS = [
  { text: '« Où sont mes factures ? »', left: '1%', top: '14%', fx: '-90px', fy: '-40px', r: '-6deg', c: '#ee6018', d: 0.35, f: 0 },
  { text: '« Livraison rapide, merci »', left: '3%', top: '62%', fx: '-110px', fy: '60px', r: '5deg', c: '#8a9a82', d: 0.55, f: 1.6 },
  { text: '« Paiement refusé deux fois »', right: '1%', top: '18%', fx: '100px', fy: '-50px', r: '6deg', c: '#ee6018', d: 0.45, f: 0.8 },
  { text: '« Support très réactif »', right: '4%', top: '66%', fx: '120px', fy: '50px', r: '-4deg', c: '#8a9a82', d: 0.65, f: 2.4 },
] as const

export function HeroFloaters() {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { amount: 0.1 })
  return (
    <div ref={ref} className="lp-floaters" aria-hidden="true" data-paused={visible ? 'false' : 'true'}>
      {FRAGMENTS.map((frag) => (
        <div
          key={frag.text}
          className="lp-frag-pos"
          style={{
            left: 'left' in frag ? frag.left : undefined,
            right: 'right' in frag ? frag.right : undefined,
            top: frag.top,
            '--fx': frag.fx, '--fy': frag.fy, '--r': frag.r, '--d': `${frag.d}s`,
          } as Vars}
        >
          <div className="lp-frag" style={{ '--c': frag.c, '--f': `${frag.f}s` } as Vars}>
            <i />
            {frag.text}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Cadre de la vidéo : incliné en arrivant, il se redresse quand on défile vers lui. */
export function HeroFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.35'] })
  const rotateX = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [14, 0])
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.94, 1])
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, 0])
  return (
    <div ref={ref} className="lp-perspective">
      <motion.div style={{ rotateX, scale, y, transformOrigin: '50% 0%' }} className="qualio-hero-frame will-change-transform">
        {children}
      </motion.div>
    </div>
  )
}
