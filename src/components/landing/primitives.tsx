'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ACCENT, ACCENT_INK, FOCUS, INK, LINE, MUTED, R_BUTTON, R_CARD, R_CHIP, SOFT } from './tokens'

/** Apparition au défilement (désactivée si l'utilisateur demande moins d'animations). */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
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

export function PrimaryButton({ href, children, dark = false }: { href: string; children: ReactNode; dark?: boolean }) {
  const className = `inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold transition hover:opacity-90 ${R_BUTTON} ${FOCUS}`
  const style = dark ? { background: '#fff', color: INK } : { background: ACCENT_INK, color: '#fff' }
  if (href.startsWith('#')) {
    return (
      <a href={href} className={className} style={style}>
        {children}
        <span aria-hidden="true">→</span>
      </a>
    )
  }
  return (
    <Link href={href} className={className} style={style}>
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  )
}

export function SecondaryButton({ href, children, onClick }: { href?: string; children: ReactNode; onClick?: () => void }) {
  const className = `inline-flex items-center justify-center border px-5 py-3 text-sm font-semibold transition hover:bg-[#f4f4f5] ${R_BUTTON} ${FOCUS}`
  const style = { borderColor: LINE, color: INK }
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
