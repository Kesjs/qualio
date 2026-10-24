'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { ACCENT, ACCENT_INK, FOCUS, INK, LINE, MUTED, R_BUTTON, R_CARD, R_CHIP, SOFT } from './tokens'

const EASE_OUT = [0.16, 1, 0.3, 1] as const

/**
 * Apparition au défilement (désactivée si l'utilisateur demande moins d'animations).
 *  - `rise` : montée douce (texte).
 *  - `focus` : mise au point, du flou au net (visuels de produit).
 *  - `unveil` : dévoilement par le bas (grands blocs sombres).
 */
export function Reveal({ children, delay = 0, className, variant = 'rise' }: { children: ReactNode; delay?: number; className?: string; variant?: 'rise' | 'focus' | 'unveil' }) {
  const reduce = useReducedMotion()
  const initial = reduce
    ? false
    : variant === 'focus'
      ? { opacity: 0, scale: 0.97, filter: 'blur(10px)' }
      : variant === 'unveil'
        ? { opacity: 0, clipPath: 'inset(12% 4% 0% 4% round 24px)' }
        : { opacity: 0, y: 18 }
  const animate = variant === 'focus'
    ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
    : variant === 'unveil'
      ? { opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 16px)' }
      : { opacity: 1, y: 0 }
  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: variant === 'rise' ? 0.6 : 0.9, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  )
}

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 text-xs font-medium ${R_CHIP}`}
      style={dark ? { borderColor: 'rgba(255,255,255,0.18)', color: '#e4e4e7' } : { borderColor: LINE, color: INK, background: '#fff' }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
      {children}
    </span>
  )
}

/** Trait dessiné pour mettre en valeur un mot-clé dans un titre : il se trace quand le titre apparaît. */
export function UnderlineWord({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span className="relative z-[1]">{children}</span>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[0.08em] left-[-0.04em] h-[0.24em] w-[108%]"
        viewBox="0 0 120 12"
        fill="none"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M2 8.5C24 5.8 47 10.2 69 7.2c18-2.4 31-1.7 49-3.4"
          stroke="#ee6018"
          strokeWidth="3.2"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.65, 0, 0.35, 1] }}
        />
      </svg>
    </span>
  )
}

function ButtonArrow() {
  return <ArrowRight aria-hidden="true" size={16} strokeWidth={2.25} className="lp-btn-arrow" />
}

export function PrimaryButton({ href, children, dark = false }: { href: string; children: ReactNode; dark?: boolean }) {
  const tone = dark ? 'bg-white text-[#0b0b0c] hover:bg-[#f4f4f5]' : 'lp-btn-primary bg-[#c2410c] text-white hover:bg-[#a8370a]'
  const className = `lp-btn inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold ${tone} ${R_BUTTON} ${FOCUS}`
  if (href.startsWith('#')) {
    return (
      <a href={href} className={className}>
        {children}
        <ButtonArrow />
      </a>
    )
  }
  return (
    <Link href={href} className={className}>
      {children}
      <ButtonArrow />
    </Link>
  )
}

export function SecondaryButton({ href, children, onClick }: { href?: string; children: ReactNode; onClick?: () => void }) {
  const className = `lp-btn inline-flex items-center justify-center border border-[#e6e6ea] bg-white px-5 py-3 text-sm font-semibold text-[#0b0b0c] hover:border-[#d4d4d8] hover:bg-[#f4f4f5] ${R_BUTTON} ${FOCUS}`
  const style = undefined
  if (onClick && !href) {
    return (
      <button type="button" onClick={onClick} className={className} style={style}>
        {children}
      </button>
    )
  }
  if (href?.startsWith('#')) {
    return (
      <a href={href} onClick={onClick} className={className} style={style}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href || '#'} onClick={onClick} className={className} style={style}>
      {children}
    </Link>
  )
}

/** Lien « En savoir plus → » des aperçus. */
export function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  const className = `inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline ${R_CHIP} ${FOCUS}`
  if (href.startsWith('#')) {
    return (
      <a href={href} className={className} style={{ color: INK }}>
        {children}
        <span aria-hidden="true" style={{ color: ACCENT }}>→</span>
      </a>
    )
  }
  return (
    <Link href={href} className={className} style={{ color: INK }}>
      {children}
      <span aria-hidden="true" style={{ color: ACCENT }}>→</span>
    </Link>
  )
}

/** Cadre commun des illustrations. */
export function Demo({ children, label, action }: { children: ReactNode; label: string; action?: ReactNode }) {
  return (
    <div className={`border p-4 sm:p-5 ${R_CARD}`} style={{ borderColor: LINE, background: SOFT }}>
      <div className="mb-4 flex min-h-6 items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: MUTED }}>{label}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

/** Section de landing : titre, texte, contenu, fond clair ou blanc en alternance. */
export function Section({
  id, tone = 'white', children, className = '',
}: { id?: string; tone?: 'white' | 'soft'; children: ReactNode; className?: string }) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 ${tone === 'soft' ? 'border-y' : ''} ${className}`}
      style={tone === 'soft' ? { borderColor: LINE, background: SOFT } : undefined}
    >
      <div className="mx-auto max-w-6xl px-5 py-20">{children}</div>
    </section>
  )
}

/** Carte standard. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border bg-white ${R_CARD} ${className}`} style={{ borderColor: LINE }}>
      {children}
    </div>
  )
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className={`inline-flex w-fit items-center gap-2 border px-2.5 py-1 text-xs font-medium ${R_CHIP}`} style={{ borderColor: LINE, color: INK }}>
      {children}
    </span>
  )
}
