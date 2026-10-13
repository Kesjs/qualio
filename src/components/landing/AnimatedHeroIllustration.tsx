'use client'

/*
 * Illustration de hero animée (temps + scroll). Non utilisée aujourd'hui : le hero affiche
 * l'image fixe /qualio-hero-feedback-map.png. Conservée telle quelle pour pouvoir la réactiver.
 */
import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { Check } from 'lucide-react'
import { ACCENT, INK, LINE, MUTED, SOFT } from './tokens'

/* ───────────────────────── Hero illustration (animée : temps + scroll) ───────────────────────── */

/*
 * Une seule horloge `t` (0 → 12 s) pilote toute la scène.
 *  - Elle avance toute seule quand l'illustration est visible (boucle).
 *  - Le scroll la fait avancer / reculer (1000 px de scroll ≈ 12 s), puis la lecture
 *    automatique reprend 1,4 s après le dernier mouvement.
 *  - Avec « réduire les animations » activé, on affiche la scène complète, immobile.
 * Chaque élément est une fonction pure de `t` : c'est ce qui rend la boucle et le scroll
 * parfaitement cohérents.
 */

/* pure-start */
const LOOP = 12
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3)
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
const easeBack = (p: number) => 1 + 2.4 * Math.pow(p - 1, 3) + 1.4 * Math.pow(p - 1, 2)
const wrap = (t: number) => ((t % LOOP) + LOOP) % LOOP
const exitK = (t: number) => 1 - easeInOut(seg(t, 11, 11.8))

const REVIEWS = [
  { stars: 2, text: 'Mon paiement a été refusé deux fois. Je ne sais pas si ma carte a été débitée.', who: 'Camille R.', date: '12 mars', src: 'CSV', hit: false },
  { stars: 3, text: 'Je cherche la page de facturation depuis dix minutes, le lien est caché dans le menu.', who: 'Karim B.', date: '14 mars', src: 'Widget', hit: true },
  { stars: 5, text: 'Livraison rapide, colis bien emballé, merci !', who: 'Sophie L.', date: '18 mars', src: 'CSV', hit: false },
  { stars: 2, text: 'Impossible de retrouver mes factures sur mobile.', who: 'Julien M.', date: '21 mars', src: 'Widget', hit: true },
]

const BARS = [
  { label: 'Facturation', n: 14, pct: 77, hot: true },
  { label: 'Livraison', n: 9, pct: 49, hot: false },
  { label: 'Paiement mobile', n: 6, pct: 33, hot: false },
]

function cardOpacity(i: number, t: number) {
  const enter = easeOut(seg(t, 0.2 + 0.5 * i, 0.8 + 0.5 * i))
  const dim = 0.45 * easeInOut(seg(t, 3, 3.8)) * (REVIEWS[i].hit ? 1 - easeInOut(seg(t, 7.5, 8.2)) : 1)
  return enter * (1 - dim) * exitK(t)
}
function cardX(i: number, t: number) {
  return -70 * (1 - easeBack(seg(t, 0.2 + 0.5 * i, 0.9 + 0.5 * i))) - 50 * (1 - exitK(t))
}
function cardRing(i: number, t: number) {
  return REVIEWS[i].hit ? easeOut(seg(t, 7.5, 8.2)) * exitK(t) : 0
}
function linePath(i: number, t: number) {
  return easeInOut(seg(t, 3 + 0.12 * i, 4.4 + 0.12 * i))
}
function lineOpacity(i: number, t: number) {
  const draw = clamp01(seg(t, 3 + 0.12 * i, 3.2 + 0.12 * i) * 1)
  const fade = easeInOut(seg(t, 5.6, 6.4))
  const relight = easeOut(seg(t, 7.5, 8.2))
  const o = REVIEWS[i].hit ? 1 - 0.55 * fade + 0.55 * relight : 1 - fade
  return o * draw * exitK(t)
}
const synProgress = (t: number) => easeOut(seg(t, 5, 5.8)) * exitK(t)
const barProgress = (k: number, t: number) => easeOut(seg(t, 5.7 + 0.15 * k, 6.9 + 0.15 * k))
const totalCount = (t: number) => Math.round(40 * easeOut(seg(t, 5.3, 6.5)))
const proofOpacity = (t: number) => easeOut(seg(t, 8, 8.6))
const recProgress = (t: number) => easeOut(seg(t, 9, 9.6))
const cursorMove = (t: number) => easeInOut(seg(t, 9.3, 10.2))
const pressScale = (t: number) => 1 - 0.04 * (seg(t, 10.15, 10.3) - seg(t, 10.3, 10.45))
const acceptOut = (t: number) => 1 - easeOut(seg(t, 10.4, 10.8))
const doneIn = (t: number) => easeOut(seg(t, 10.5, 11))
/* pure-end */

const STAGE_W = 1360
const STAGE_H = 720
const CARD_X = 32
const CARD_W = 440
const CARD_H = 148
const CARD_TOPS = [44, 206, 368, 530]
const SYN_X = 632
const SYN_Y = 44
const SYN_W = 696
const SYN_MIN_H = 632
const DOT = { x: SYN_X, y: SYN_Y + 129 } // centre de la première barre

function useSceneClock(rootRef: RefObject<HTMLDivElement | null>) {
  const reduce = useReducedMotion()
  const t = useMotionValue(reduce ? 9.5 : 0)
  useEffect(() => {
    if (reduce) {
      t.set(9.5)
      return
    }
    let visible = false
    let pausedUntil = 0
    let last = performance.now()
    let lastY = window.scrollY
    let raf = 0
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }, { threshold: 0.15 })
    if (rootRef.current) io.observe(rootRef.current)
    const onScroll = () => {
      const y = window.scrollY
      const dy = y - lastY
      lastY = y
      if (visible && dy !== 0) {
        t.set(wrap(t.get() + dy * 0.012))
        pausedUntil = performance.now() + 1400
      }
    }
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (visible && now > pausedUntil && !document.hidden) t.set(wrap(t.get() + dt))
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [reduce, rootRef, t])
  return t
}

function ReviewCard({ i, t }: { i: number; t: MotionValue<number> }) {
  const r = REVIEWS[i]
  const opacity = useTransform(t, (v) => cardOpacity(i, v))
  const x = useTransform(t, (v) => cardX(i, v))
  const ring = useTransform(t, (v) => cardRing(i, v))
  return (
    <motion.div
      className="relative h-full rounded-[26px] border bg-white px-5 py-3.5"
      style={{ borderColor: LINE, opacity, x }}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[26px] border-2"
        style={{ borderColor: ACCENT, opacity: ring }}
      />
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: MUTED }}>
        <span>Avis reçu</span>
        <span className="rounded-full px-2.5 py-0.5 text-[10px]" style={{ background: SOFT }}>{r.src}</span>
      </div>
      <div className="mt-1.5 text-[14px] tracking-[3px]" style={{ color: INK }} aria-hidden="true">
        {'★'.repeat(r.stars)}
        <span style={{ color: '#d7d7dc' }}>{'★'.repeat(5 - r.stars)}</span>
      </div>
      <p className="mt-1 text-[17px] font-medium leading-snug tracking-[-0.01em]" style={{ color: INK }}>« {r.text} »</p>
      <p className="mt-1 text-[13px]" style={{ color: MUTED }}>{r.who} · {r.date}</p>
    </motion.div>
  )
}

function BarRow({ k, t }: { k: number; t: MotionValue<number> }) {
  const b = BARS[k]
  const p = useTransform(t, (v) => barProgress(k, v))
  const width = useTransform(p, (v) => `${b.pct * v}%`)
  const count = useTransform(p, (v) => `${Math.round(b.n * v)} avis`)
  return (
    <div className="flex h-7 items-center text-[15px] font-semibold">
      <span className="w-[112px] shrink-0 md:w-[180px]" style={{ color: INK }}>{b.label}</span>
      <div className="h-3.5 flex-1 overflow-hidden rounded-full" style={{ background: '#f0f0f2' }}>
        <motion.div className="h-full rounded-full" style={{ width, background: b.hot ? ACCENT : '#b8b8bf' }} />
      </div>
      <motion.span className="w-[68px] shrink-0 text-right md:w-[84px]" style={{ color: INK }}>{count}</motion.span>
    </div>
  )
}

function SynthesisCard({ t }: { t: MotionValue<number> }) {
  const syn = useTransform(t, synProgress)
  const scale = useTransform(syn, (v) => 0.97 + 0.03 * v)
  const title = useTransform(t, (v) => `Synthèse · ${totalCount(v)} avis`)
  const proof = useTransform(t, proofOpacity)
  const proofY = useTransform(proof, (v) => 8 * (1 - v))
  const rec = useTransform(t, recProgress)
  const recY = useTransform(rec, (v) => 14 * (1 - v))
  const accept = useTransform(t, (v) => acceptOut(v) * recProgress(v))
  const later = accept
  const press = useTransform(t, pressScale)
  const done = useTransform(t, doneIn)
  const cursorOpacity = useTransform(t, (v) => easeOut(seg(v, 9.3, 9.6)) * exitK(v))
  const cursorX = useTransform(t, (v) => 240 - 128 * cursorMove(v))
  const cursorY = useTransform(t, (v) => 70 - 40 * cursorMove(v))
  return (
    <motion.div
      className="rounded-[36px] border bg-white p-5 md:p-10"
      style={{ borderColor: LINE, opacity: syn, scale, minHeight: SYN_MIN_H, transformOrigin: 'center' }}
    >
      <div className="flex h-[38px] items-center justify-between">
        <motion.h3 className="text-[22px] font-bold tracking-[-0.02em] md:text-[26px]" style={{ color: INK }}>{title}</motion.h3>
        <span className="rounded-full px-3.5 py-1 text-[13px] font-semibold" style={{ background: SOFT, color: MUTED }}>Sourcée</span>
      </div>
      <div className="mt-9 space-y-9">
        {BARS.map((_, k) => <BarRow key={k} k={k} t={t} />)}
      </div>
      <motion.div className="mt-9" style={{ opacity: proof, y: proofY }}>
        <span className="inline-block rounded-full px-4 py-1.5 text-[14px] font-bold" style={{ background: '#fff1e9', color: ACCENT }}>
          Justifié par 14 avis sur 40
        </span>
      </motion.div>
      <div className="mt-8 border-t pt-8" style={{ borderColor: LINE }}>
        <motion.div style={{ opacity: rec, y: recY }}>
          <p className="text-[15px] font-bold tracking-[0.02em]" style={{ color: INK }}>Recommandation</p>
          <p className="mt-2 text-[20px] font-semibold leading-[1.3] tracking-[-0.02em] md:text-[24px]" style={{ color: INK }}>
            Rendre la facturation visible depuis le menu principal.
          </p>
          <div className="relative mt-8 h-[54px]">
            <motion.div
              className="absolute left-0 top-0 flex h-[54px] w-[176px] items-center justify-center rounded-full text-[16px] font-bold text-white"
              style={{ background: ACCENT, opacity: accept, scale: press }}
            >
              Accepter
            </motion.div>
            <motion.div
              className="absolute left-[188px] top-0 flex h-[54px] w-[150px] items-center justify-center rounded-full border text-[16px] font-bold"
              style={{ borderColor: LINE, color: INK, opacity: later }}
            >
              Plus tard
            </motion.div>
            <motion.div
              className="absolute left-0 top-0 flex h-[54px] items-center gap-2 whitespace-nowrap rounded-full px-6 text-[15px] font-semibold"
              style={{ background: SOFT, color: INK, opacity: done }}
            >
              <Check size={16} style={{ color: ACCENT }} />
              Acceptée par l’équipe
            </motion.div>
            <motion.svg
              aria-hidden="true"
              width="22"
              height="32"
              viewBox="0 0 22 32"
              className="pointer-events-none absolute left-0 top-0"
              style={{ x: cursorX, y: cursorY, opacity: cursorOpacity }}
            >
              <path d="M1 1 L1 25 L7 19.5 L11.5 30 L16 28 L11.5 18 L20 18 Z" fill="#0b0b0c" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
            </motion.svg>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function ConnectorLine({ i, t }: { i: number; t: MotionValue<number> }) {
  const pathLength = useTransform(t, (v) => linePath(i, v))
  const opacity = useTransform(t, (v) => lineOpacity(i, v))
  const x0 = CARD_X + CARD_W + 2
  const cy = CARD_TOPS[i] + CARD_H / 2
  return (
    <motion.path
      d={`M${x0} ${cy} C ${x0 + 70} ${cy}, ${DOT.x - 70} ${DOT.y}, ${DOT.x} ${DOT.y}`}
      fill="none"
      stroke={ACCENT}
      strokeWidth={2}
      strokeLinecap="round"
      style={{ pathLength, opacity }}
    />
  )
}

export function AnimatedHeroIllustration() {
  const rootRef = useRef<HTMLDivElement>(null)
  const fitRef = useRef<HTMLDivElement>(null)
  const t = useSceneClock(rootRef)
  const [scale, setScale] = useState(0.8)

  useEffect(() => {
    const el = fitRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / STAGE_W)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const dotOpacity = useTransform(t, (v) => easeOut(seg(v, 4.2, 4.8)) * exitK(v))
  const rippleScale = useTransform(t, (v) => 0.6 + 1.8 * seg(v, 4.4, 5.4))
  const rippleOpacity = useTransform(t, (v) => (seg(v, 4.4, 5.4) > 0 ? 0.5 * (1 - seg(v, 4.4, 5.4)) : 0))

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label="Animation : des avis clients arrivent, Qualio en tire des thèmes reliés aux avis qui les justifient, et l’équipe accepte une recommandation."
    >
      {/* Écrans moyens et grands : la scène complète, mise à l’échelle */}
      <div ref={fitRef} className="hidden w-full overflow-hidden md:block" style={{ height: STAGE_H * scale }} aria-hidden="true">
        <div
          className="relative overflow-hidden rounded-[36px] border"
          style={{ width: STAGE_W, height: STAGE_H, borderColor: LINE, background: '#fafafa', transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {REVIEWS.map((_, i) => (
            <div key={i} className="absolute" style={{ left: CARD_X, top: CARD_TOPS[i], width: CARD_W, height: CARD_H }}>
              <ReviewCard i={i} t={t} />
            </div>
          ))}
          <div className="absolute" style={{ left: SYN_X, top: SYN_Y, width: SYN_W }}>
            <SynthesisCard t={t} />
          </div>
          <svg className="pointer-events-none absolute left-0 top-0" width={STAGE_W} height={STAGE_H} viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} fill="none">
            {REVIEWS.map((_, i) => <ConnectorLine key={i} i={i} t={t} />)}
          </svg>
          <motion.span
            className="pointer-events-none absolute rounded-full"
            style={{ left: DOT.x - 6, top: DOT.y - 6, width: 12, height: 12, background: ACCENT, opacity: dotOpacity }}
          />
          <motion.span
            className="pointer-events-none absolute rounded-full border-2"
            style={{ left: DOT.x - 14, top: DOT.y - 14, width: 28, height: 28, borderColor: ACCENT, opacity: rippleOpacity, scale: rippleScale }}
          />
        </div>
      </div>

      {/* Petits écrans : version compacte (deux avis + la synthèse), à taille réelle */}
      <div className="space-y-3 overflow-hidden rounded-[28px] border p-3 md:hidden" style={{ borderColor: LINE, background: '#fafafa' }} aria-hidden="true">
        <ReviewCard i={1} t={t} />
        <ReviewCard i={3} t={t} />
        <SynthesisCard t={t} />
      </div>
    </div>
  )
}
