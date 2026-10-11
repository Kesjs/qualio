'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'
import { ArrowRight, Check, ChevronDown, Menu, X } from 'lucide-react'
import { BILLING_PLANS } from '@/lib/billing/plans'

const ACCENT = '#ee6018'
const INK = '#0b0b0c'
const MUTED = '#62626b'
const LINE = '#e6e6ea'
const SOFT = '#f6f6f7'

/*
 * Témoignages : remplissez ce tableau avec de vrais retours (avec accord écrit).
 * Tant qu'il est vide, la section ne s'affiche pas.
 */
const TESTIMONIALS: { quote: string; name: string; role: string }[] = []

const SIGNUP = '/login?mode=register'

const FAQ = [
  {
    q: 'Faut-il installer quelque chose sur mon site ?',
    a: 'Non. Vous copiez un script et le placez dans votre site. Le widget collecte les nouveaux avis sans modifier votre code.',
  },
  {
    q: 'Puis-je importer mes anciens avis ?',
    a: 'Oui, par import CSV. Vos avis passés gardent leur date, leur source et leur contexte, et sont analysés avec les nouveaux.',
  },
  {
    q: 'Comment savoir d’où vient une synthèse ?',
    a: 'Chaque thème renvoie aux avis qui le justifient. Les faits et les éléments incertains sont séparés, pour que vous puissiez vérifier.',
  },
  {
    q: 'L’IA décide-t-elle à ma place ?',
    a: 'Non. Qualio propose des recommandations sourcées. Votre équipe accepte, reporte ou écarte chacune d’elles.',
  },
  {
    q: 'Combien coûte le plan gratuit ?',
    a: 'Rien. Le plan gratuit inclut un projet, une synthèse par mois, vos avis conservés, l’import CSV et le widget.',
  },
]

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`

const PLANS = [
  {
    id: 'free' as const,
    audience: 'Pour commencer avec vos avis',
    synth: `${BILLING_PLANS.free.monthlySyntheses} synthèse par mois`,
    features: BILLING_PLANS.free.features,
    featured: false,
  },
  {
    id: 'pro' as const,
    audience: 'Pour suivre vos avis chaque semaine',
    synth: 'Synthèse automatique chaque semaine',
    features: BILLING_PLANS.pro.features,
    featured: true,
  },
].map((p) => ({
  ...p,
  name: BILLING_PLANS[p.id].label,
  price: String(BILLING_PLANS[p.id].priceEur),
  projects: plural(BILLING_PLANS[p.id].projects, 'projet', 'projets'),
}))

/* ───────────────────────── Primitives ───────────────────────── */

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
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
function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-[12px] border px-2.5 py-1 text-xs font-medium"
      style={dark ? { borderColor: 'rgba(255,255,255,0.18)', color: '#e4e4e7' } : { borderColor: LINE, color: INK, background: '#fff' }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
      {children}
    </span>
  )
}

function PrimaryButton({ href, children, dark = false }: { href: string; children: ReactNode; dark?: boolean }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-[14px] px-5 py-3 text-sm font-semibold transition hover:opacity-90"
      style={dark ? { background: '#fff', color: INK } : { background: ACCENT, color: '#fff' }}
    >
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  )
}

function Demo({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="rounded-[24px] border p-4 sm:p-5" style={{ borderColor: LINE, background: SOFT }}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: MUTED }}>{label}</span>
      </div>
      {children}
    </div>
  )
}

/* ───────────────────────── Navbar (barre flottante en pilule) ───────────────────────── */

function Navbar() {
  const [open, setOpen] = useState(false)
  const links = [
    ['#fonctionnement', 'Fonctionnement'],
    ['#pour-qui', 'Pour qui'],
    ['#tarifs', 'Tarifs'],
    ['#faq', 'FAQ'],
  ]
  return (
    <header className="sticky top-0 z-50 px-3 pt-3">
      <nav
        className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full border bg-white/85 pl-5 pr-2 backdrop-blur-md"
        style={{ borderColor: LINE }}
        aria-label="Navigation principale"
      >
        <Link href="/" className="flex items-center" aria-label="Qualio, accueil">
          <img src="/qualio-logo/export/lockup/lockup-light.svg" alt="Qualio" className="h-7" />
        </Link>
        <div className="hidden items-center gap-1 text-[14px] md:flex">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="rounded-full px-3.5 py-2 transition hover:bg-[#f4f4f5]" style={{ color: MUTED }}>
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Link href="/login" className="hidden rounded-full px-3.5 py-2 text-[14px] transition hover:bg-[#f4f4f5] sm:inline" style={{ color: MUTED }}>
            Se connecter
          </Link>
          <Link href={SIGNUP} className="rounded-full px-4 py-2.5 text-[14px] font-semibold text-white transition hover:opacity-90" style={{ background: ACCENT }}>
            Commencer
          </Link>
          <button
            type="button"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="mx-auto mt-2 max-w-5xl rounded-[28px] border bg-white p-2 md:hidden" style={{ borderColor: LINE }}>
          {[...links, ['/login', 'Se connecter']].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block rounded-[18px] px-4 py-3 text-[15px] hover:bg-[#f4f4f5]" style={{ color: INK }}>
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}

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

function HeroIllustration() {
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

/* ───────────────────────── Import illustration ───────────────────────── */

function ImportDemo() {
  const [step, setStep] = useState(2)
  const rows = [
    ['12 mars', 'Commande', '« Colis reçu en retard »'],
    ['14 mars', 'Support', '« Très bon accueil »'],
    ['18 mars', 'Widget', '« Facturation introuvable »'],
  ]
  return (
    <Demo label="Import CSV">
      <div className="mb-3 flex items-center justify-between rounded-xl border p-3" style={{ borderColor: LINE }}>
        <span className="text-xs" style={{ color: INK }}>avis_2025.csv</span>
        <button
          type="button"
          onClick={() => setStep((s) => (s + 1) % 3)}
          className="rounded-full px-3 py-1 text-[11px] font-semibold text-white"
          style={{ background: ACCENT }}
        >
          {step === 0 ? 'Importer' : step === 1 ? 'Classement…' : 'Importé · relancer'}
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border" style={{ borderColor: LINE }}>
        {rows.map((r, i) => (
          <AnimatePresence key={r[2]}>
            {step >= 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: step === 1 ? i * 0.2 : 0 }}
                className="grid grid-cols-[72px_1fr] gap-3 border-b px-3 py-2.5 text-xs last:border-b-0 sm:grid-cols-[80px_90px_1fr]"
                style={{ borderColor: LINE, color: INK }}
              >
                <span style={{ color: MUTED }}>{r[0]}</span>
                <span className="hidden sm:block" style={{ color: MUTED }}>{r[1]}</span>
                <span className="truncate">{r[2]}</span>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
        {step === 0 && <div className="p-4 text-center text-xs" style={{ color: MUTED }}>Aucun avis importé</div>}
      </div>
    </Demo>
  )
}

/* ───────────────────────── Widget illustration ───────────────────────── */

function WidgetDemo() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [rating, setRating] = useState(4)
  const [items, setItems] = useState([
    { id: 1, rating: 2, text: 'Le lien vers la facturation est difficile à trouver.' },
  ])

  const submit = () => {
    if (!draft.trim()) return
    setItems((prev) => [{ id: Date.now(), rating, text: draft.trim() }, ...prev])
    setDraft('')
    setOpen(false)
  }

  return (
    <Demo label="Widget de collecte">
      <div className="relative overflow-hidden rounded-xl border" style={{ borderColor: LINE }}>
        <div className="flex items-center gap-1.5 border-b px-3 py-2" style={{ borderColor: LINE }}>
          <span className="h-2 w-2 rounded-full bg-[#e5e5e7]" />
          <span className="h-2 w-2 rounded-full bg-[#e5e5e7]" />
          <span className="h-2 w-2 rounded-full bg-[#e5e5e7]" />
        </div>
        <div className="space-y-2 p-4">
          <div className="h-3 w-1/2 rounded bg-[#eeeef0]" />
          <div className="h-2 w-full rounded bg-[#f3f3f5]" />
          <div className="h-2 w-5/6 rounded bg-[#f3f3f5]" />
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-14 right-3 w-[calc(100%-1.5rem)] max-w-xs rounded-xl border bg-white p-3 sm:w-72"
              style={{ borderColor: LINE }}
            >
              <p className="mb-2 text-xs font-semibold" style={{ color: INK }}>Votre avis</p>
              <div className="mb-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} sur 5`}
                    className="h-7 w-7 rounded-md border text-xs"
                    style={{
                      borderColor: LINE,
                      background: n <= rating ? ACCENT : '#fff',
                      color: n <= rating ? '#fff' : MUTED,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Qu’est-ce qui pourrait être mieux ?"
                rows={2}
                className="mb-2 w-full resize-none rounded-md border p-2 text-xs outline-none focus:border-[#ee6018]"
                style={{ borderColor: LINE }}
              />
              <button
                type="button"
                onClick={submit}
                className="w-full rounded-md py-2 text-xs font-semibold text-white"
                style={{ background: ACCENT }}
              >
                Envoyer
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="absolute bottom-3 right-3 rounded-full px-3.5 py-2 text-xs font-semibold text-white"
          style={{ background: ACCENT }}
        >
          Donner mon avis
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-lg border p-3 text-xs"
              style={{ borderColor: LINE }}
            >
              <span className="mt-0.5 rounded px-1.5 py-0.5 font-semibold" style={{ background: SOFT, color: INK }}>{it.rating}/5</span>
              <span style={{ color: INK }}>{it.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Demo>
  )
}

/* ───────────────────────── Synthesis illustration ───────────────────────── */

const THEMES = [
  {
    name: 'Facturation',
    count: 14,
    quotes: ['« Je ne trouve pas la page de facturation. »', '« Le lien est caché dans le menu. »'],
  },
  {
    name: 'Délais de livraison',
    count: 9,
    quotes: ['« Livraison plus lente que prévu. »'],
  },
  {
    name: 'Paiement mobile',
    count: 6,
    quotes: ['« Mon paiement a été refusé deux fois. »'],
  },
]

function SynthesisDemo() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const theme = THEMES[active]
  return (
    <Demo label="Synthèse sourcée">
      <div className="mb-4 flex flex-wrap gap-2">
        {THEMES.map((t, i) => (
          <button
            key={t.name}
            type="button"
            onClick={() => setActive(i)}
            className="rounded-full border px-3 py-1.5 text-xs transition"
            style={{
              borderColor: i === active ? ACCENT : LINE,
              background: i === active ? ACCENT : '#fff',
              color: i === active ? '#fff' : INK,
            }}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="mb-4 space-y-2">
        {THEMES.map((t, i) => (
          <div key={t.name} className="flex items-center gap-3 text-xs">
            <span className="w-32 shrink-0 truncate" style={{ color: MUTED }}>{t.name}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: SOFT }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: i === active ? ACCENT : '#c9c9cf' }}
                initial={reduce ? false : { width: 0 }}
                whileInView={{ width: `${(t.count / 40) * 100 * 2.2}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
              />
            </div>
            <span className="w-8 text-right" style={{ color: INK }}>{t.count}</span>
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={theme.name}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl p-4"
          style={{ background: SOFT }}
        >
          <p className="mb-2 text-[11px] uppercase tracking-wide" style={{ color: MUTED }}>
            Justifié par {theme.count} avis sur 40
          </p>
          {theme.quotes.map((q) => (
            <p key={q} className="text-sm leading-relaxed" style={{ color: INK }}>{q}</p>
          ))}
        </motion.div>
      </AnimatePresence>
    </Demo>
  )
}

/* ───────────────────────── Recommendations (human decision) ───────────────────────── */

const RECS = [
  { title: 'Rendre la facturation visible depuis le menu principal', basis: '14 avis sur 40 mentionnent ce point' },
  { title: 'Vérifier le message d’erreur du paiement mobile', basis: '6 avis sur 40, dont 4 cette semaine' },
]

function RecommendationDemo() {
  const [decisions, setDecisions] = useState<Record<number, 'accepted' | 'later' | undefined>>({})
  return (
    <Demo label="Recommandations">
      <div className="space-y-3">
        {RECS.map((r, i) => {
          const d = decisions[i]
          return (
            <div key={r.title} className="rounded-xl border p-4" style={{ borderColor: LINE }}>
              <p className="text-sm font-medium leading-snug" style={{ color: INK }}>{r.title}</p>
              <p className="mt-1 text-xs" style={{ color: MUTED }}>{r.basis}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {d ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: SOFT, color: INK }}>
                    {d === 'accepted' ? <Check size={12} /> : null}
                    {d === 'accepted' ? 'Acceptée par l’équipe' : 'Reportée'}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setDecisions((p) => ({ ...p, [i]: 'accepted' }))}
                      className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-white"
                      style={{ background: ACCENT }}
                    >
                      Accepter
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecisions((p) => ({ ...p, [i]: 'later' }))}
                      className="rounded-full border px-3 py-1.5 text-[11px]"
                      style={{ borderColor: LINE, color: INK }}
                    >
                      Plus tard
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => setDecisions({})}
        className="mt-4 text-[11px] underline underline-offset-2"
        style={{ color: MUTED }}
      >
        Réinitialiser l’exemple
      </button>
    </Demo>
  )
}

/* ───────────────────────── FAQ ───────────────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b" style={{ borderColor: LINE }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-base font-medium" style={{ color: INK }}>{q}</span>
        <ChevronDown size={18} className="shrink-0 transition-transform" style={{ color: MUTED, transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="pb-5 pr-8 text-sm leading-relaxed" style={{ color: MUTED }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ───────────────────────── Page ───────────────────────── */

const H2 = 'text-[clamp(2rem,4.4vw,3.5rem)] font-semibold leading-[1.12] tracking-[-0.03em] [text-wrap:balance]'
const DARK = '#18181b'

const PROBLEMS = [
  ['Éparpillés', 'Un CSV ici, un message là, un commentaire dans un outil de support. Personne n’a la vue d’ensemble.'],
  ['Trop longs à lire', 'Relire des centaines d’avis à la main prend des heures, alors on se fie aux trois derniers.'],
  ['Sans preuve', 'Une conclusion sans les avis qui la soutiennent ne convainc personne en réunion.'],
]

function StepCard({
  n, tag, title, body, children, className = '',
}: { n: string; tag: string; title: string; body: string; children: ReactNode; className?: string }) {
  return (
    <Reveal className={`h-full ${className}`}>
      <div className="flex h-full flex-col rounded-[36px] border bg-white p-7" style={{ borderColor: LINE }}>
        <span className="inline-flex w-fit items-center gap-2 rounded-[12px] border px-2.5 py-1 text-xs font-medium" style={{ borderColor: LINE, color: INK }}>
          <span style={{ color: ACCENT }}>{n}</span>
          {tag}
        </span>
        <h3 className="mt-5 text-[22px] font-semibold leading-tight tracking-tight">{title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed" style={{ color: MUTED }}>{body}</p>
        <div className="mt-6 flex-1">{children}</div>
      </div>
    </Reveal>
  )
}

const AUDIENCES = [
  { tag: 'Équipes produit', title: 'Les retours deviennent des décisions.', body: 'Import CSV, widget ou ajout manuel : Qualio réunit vos avis dans un espace classé par thème, pour que la réunion produit parte de faits.', chips: ['Import CSV', 'Widget', 'Ajout manuel'] },
  { tag: 'Agences et freelances', title: 'Un projet par client, un rapport par période.', body: 'Chaque client a son espace avec ses sources, ses avis et ses synthèses. Vous gardez une vue claire de ce qui remonte, projet par projet.', chips: ['Un espace par client', 'Sources', 'Synthèses'] },
  { tag: 'Boutiques en ligne', title: 'Voyez la friction avant qu’elle ne coûte des ventes.', body: 'Livraison, paiement, retours : repérez les sujets qui reviennent dans les avis et traitez d’abord ceux qui touchent le plus de clients.', chips: ['Livraison', 'Paiement', 'Retours'] },
]

export function LightLanding() {
  return (
    <div className="min-h-screen bg-white font-sans" style={{ color: INK, scrollBehavior: 'smooth' }}>
      <Navbar />

      <main>
        {/* Hero: centré dans le premier écran, produit animé juste dessous */}
        <section className="mx-auto max-w-6xl px-5 pb-10 text-center">
          <div className="flex min-h-[min(calc(100svh-4.5rem),52rem)] flex-col items-center justify-center py-12">
            <Reveal className="w-full">
              <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium" style={{ borderColor: LINE, color: MUTED }}>
                <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: ACCENT }}>New</span>
                <span>Une lecture sourcée de vos avis</span>
                <span aria-hidden="true" style={{ color: ACCENT }}>→</span>
              </div>
              <h1 className="mx-auto text-[clamp(2.25rem,5.8vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.055em] [text-wrap:balance]">
                <span className="block sm:whitespace-nowrap">Transformez vos avis clients</span>
                <span className="mt-2 block text-[#ee6018]">
                  <span className="inline-block -skew-x-2 bg-[#fff1e9] px-3 py-1">
                    <span className="inline-block skew-x-2">en décisions claires.</span>
                  </span>
                </span>
              </h1>
              <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: MUTED }}>
                Fini les centaines d’avis relus à la main. Qualio regroupe les thèmes qui reviennent
                et cite les avis qui les justifient.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <PrimaryButton href={SIGNUP}>Commencer gratuitement</PrimaryButton>
                <a href="#fonctionnement" className="inline-flex items-center justify-center rounded-[14px] border px-5 py-3 text-sm font-semibold transition hover:bg-[#f4f4f5]" style={{ borderColor: LINE }}>
                  Voir comment ça marche
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs" style={{ color: MUTED }}>
                {['Import CSV', 'Widget de collecte', 'IA sourcée', 'Décisions humaines'].map((x) => (
                  <span key={x} className="rounded-[12px] border px-2.5 py-1" style={{ borderColor: LINE }}>{x}</span>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="mx-auto max-w-6xl text-left">
            <HeroIllustration />
          </Reveal>
        </section>

        {/* Problème : bloc sombre inversé, liste à flèches */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <div className="grid gap-12 rounded-[36px] p-8 sm:p-14 lg:grid-cols-[1fr_1.15fr] lg:gap-16" style={{ background: DARK, color: '#fff' }}>
              <div>
                <Eyebrow dark>Le problème</Eyebrow>
                <h2 className={`mt-5 ${H2}`}>Les avis s’accumulent. Les décisions, elles, attendent.</h2>
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

        {/* Fonctionnement : grille asymétrique, la synthèse en grande carte */}
        <section id="fonctionnement" className="border-y" style={{ borderColor: LINE, background: SOFT }}>
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Reveal className="mx-auto max-w-3xl text-center">
              <Eyebrow>Fonctionnement</Eyebrow>
              <h2 className={`mt-5 ${H2}`}>De vos avis à la prochaine action, en quatre étapes.</h2>
            </Reveal>
            <div className="mt-14 grid gap-4 lg:grid-cols-6">
              <StepCard
                className="lg:col-span-3"
                n="01"
                tag="Import"
                title="Importez vos avis existants."
                body="Un fichier CSV suffit. Chaque avis garde sa date, sa source et son contexte, pour que l’historique serve dès le premier jour."
              >
                <ImportDemo />
              </StepCard>
              <StepCard
                className="lg:col-span-3"
                n="02"
                tag="Collecte"
                title="Recueillez les prochains avis sur votre site."
                body="Copiez un script, placez-le dans votre site. Vos clients donnent leur avis dans leur parcours, et il arrive dans le même espace."
              >
                <WidgetDemo />
              </StepCard>
              <StepCard
                className="lg:col-span-4"
                n="03"
                tag="Synthèse"
                title="Repérez ce qui revient, avec les avis à l’appui."
                body="Qualio regroupe les thèmes récurrents et montre, pour chacun, les avis qui le justifient et leur nombre."
              >
                <SynthesisDemo />
              </StepCard>
              <StepCard
                className="lg:col-span-2"
                n="04"
                tag="Décision"
                title="Décidez, avec des recommandations sourcées."
                body="Votre équipe accepte ou reporte. Rien n’est appliqué automatiquement."
              >
                <RecommendationDemo />
              </StepCard>
            </div>
          </div>
        </section>

        {/* Pour qui : trois cartes avec tags */}
        <section id="pour-qui">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Reveal className="mx-auto mb-14 max-w-3xl text-center">
              <h2 className={H2}>Pensé pour ceux qui reçoivent des avis.</h2>
            </Reveal>
            <div className="grid gap-4 md:grid-cols-3">
              {AUDIENCES.map((a, i) => (
                <Reveal key={a.tag} delay={i * 0.06} className="h-full">
                  <div className="flex h-full flex-col rounded-[36px] border bg-white p-7" style={{ borderColor: LINE }}>
                    <span className="inline-block w-fit rounded-[12px] px-2.5 py-1 text-xs font-medium text-white" style={{ background: '#3f3f46' }}>{a.tag}</span>
                    <h3 className="mt-6 text-[22px] font-semibold leading-tight tracking-tight">{a.title}</h3>
                    <p className="mt-3 text-[15px] leading-relaxed" style={{ color: MUTED }}>{a.body}</p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-8">
                      {a.chips.map((c) => (
                        <span key={c} className="rounded-[12px] border px-2 py-1 text-[13px]" style={{ borderColor: LINE }}>{c}</span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Témoignages : affichés seulement quand TESTIMONIALS est rempli */}
        {TESTIMONIALS.length > 0 && (
          <section className="border-t" style={{ borderColor: LINE }}>
            <div className="mx-auto max-w-6xl px-5 py-20">
              <div className="grid gap-4 md:grid-cols-3">
                {TESTIMONIALS.map((t, i) => (
                  <Reveal key={t.name} delay={i * 0.05} className="rounded-[36px] border bg-white p-7">
                    <p className="text-lg leading-relaxed">« {t.quote} »</p>
                    <p className="mt-6 text-sm font-semibold">{t.name}</p>
                    <p className="text-xs" style={{ color: MUTED }}>{t.role}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Tarifs : l'orange reste sur le plan recommandé */}
        <section id="tarifs" className="border-y" style={{ borderColor: LINE, background: SOFT }}>
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Reveal className="mx-auto max-w-3xl text-center">
              <h2 className={H2}>Commencez gratuitement. Payez quand vos avis deviennent un rythme.</h2>
            </Reveal>
            <div className="mt-14 grid gap-4 md:grid-cols-2">
              {PLANS.map((p, i) => (
                <Reveal key={p.name} delay={i * 0.05} className="flex">
                  <div
                    className="relative flex flex-1 flex-col rounded-[36px] bg-white p-7"
                    style={p.featured ? { border: `2px solid ${ACCENT}` } : { border: `1px solid ${LINE}` }}
                  >
                    {p.featured && (
                      <span className="absolute -top-3 left-7 rounded-[12px] px-2.5 py-1 text-[11px] font-semibold text-white" style={{ background: ACCENT }}>
                        Recommandé
                      </span>
                    )}
                    <h3 className="text-base font-semibold">{p.name}</h3>
                    <p className="mt-4 text-5xl font-semibold tracking-tight">
                      {p.price}€<span className="text-sm font-normal" style={{ color: MUTED }}> /mois</span>
                    </p>
                    <p className="mt-3 text-sm" style={{ color: MUTED }}>{p.audience}</p>
                    <div className="mt-6 space-y-1 border-t pt-6 text-sm font-medium" style={{ borderColor: LINE }}>
                      <p>{p.projects}</p>
                      <p>{p.synth}</p>
                    </div>
                    <ul className="mt-4 space-y-3 text-sm">
                      {p.features.map((f) => (
                        <li key={f} className="flex gap-2.5">
                          <Check size={16} className="mt-0.5 shrink-0" style={{ color: p.featured ? ACCENT : INK }} />
                          <span style={{ color: MUTED }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8 flex-1" />
                    <Link
                      href={SIGNUP}
                      className="mt-8 block rounded-[14px] py-3 text-center text-sm font-semibold transition hover:opacity-85"
                      style={p.featured ? { background: ACCENT, color: '#fff' } : { border: `1px solid ${LINE}`, color: INK }}
                    >
                      Commencer avec {p.name}
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
            <p className="mt-8 text-center text-xs" style={{ color: MUTED }}>
              Vos données sont conservées si vous repassez en Gratuit.
            </p>
          </div>
        </section>

        {/* FAQ : titre à gauche, questions à droite */}
        <section id="faq">
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

        {/* Appel final : carte sombre, un seul point orange */}
        <section className="px-5 pb-20">
          <Reveal className="mx-auto max-w-6xl">
            <div className="rounded-[36px] px-6 py-16 text-center sm:px-16 sm:py-24" style={{ background: DARK, color: '#fff' }}>
              <span className="mx-auto mb-8 block h-3 w-3 rounded-full" style={{ background: ACCENT }} aria-hidden="true" />
              <h2 className="mx-auto max-w-3xl text-[clamp(2rem,4.8vw,3.75rem)] font-semibold leading-[1.1] tracking-[-0.03em] [text-wrap:balance]">
                Transformez chaque avis en prochaine décision.
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-base" style={{ color: '#a1a1aa' }}>
                Importez vos avis ou installez le widget. Votre première synthèse arrive dès qu’il y a assez de matière.
              </p>
              <div className="mt-10">
                <PrimaryButton href={SIGNUP} dark>Commencer gratuitement</PrimaryButton>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t" style={{ borderColor: LINE }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between">
          <div>
            <img src="/qualio-logo/export/lockup/lockup-light.svg" alt="Qualio" className="h-7" />
            <p className="mt-3 text-sm" style={{ color: MUTED }}>Une vue fiable des avis qui comptent.</p>
          </div>
          <nav className="flex flex-wrap gap-6 text-sm" style={{ color: MUTED }} aria-label="Pied de page">
            <Link href="/pricing" className="hover:text-[#ee6018]">Tarifs</Link>
            <Link href="/contact" className="hover:text-[#ee6018]">Contact</Link>
            <Link href="/login" className="hover:text-[#ee6018]">Se connecter</Link>
          </nav>
          <span className="text-xs" style={{ color: MUTED }}>© 2026 Qualio</span>
        </div>
      </footer>
    </div>
  )
}
