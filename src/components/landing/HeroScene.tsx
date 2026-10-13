'use client'

import { useRef } from 'react'
import type { CSSProperties } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Check } from 'lucide-react'
import { ACCENT, ACCENT_INK, ACCENT_SOFT, INK, LINE, MUTED, SAGE } from './tokens'

/*
 * Scène du hero : les avis arrivent, Qualio en tire un thème (« Facturation », 14 avis),
 * puis une recommandation apparaît. Remplace l'ancienne image PNG de 1,7 Mo.
 *
 *  - Tout est en HTML/SVG : net à toutes les tailles, texte réel, quelques Ko.
 *  - Entrée jouée UNE SEULE fois, ~4 s, quand la scène entre à l'écran (pas de boucle).
 *    Les animations sont en CSS pur (classes `hs-*` dans globals.css) : aucun re-render React.
 *  - Au défilement : léger parallaxe (décor, halo, scène). Transforms seulement, jamais sur
 *    les éléments animés en CSS (calques séparés).
 *  - « Réduire les animations » : état final immédiat, parallaxe coupé.
 *  - Aucune information ne passe uniquement par le mouvement (état final lisible, aria-label).
 *  - Grand écran : scène horizontale mise à l'échelle avec les unités `cqw` (pas de JS de mesure).
 *    Petit écran : version verticale, 3 avis → thème → recommandation.
 */

type Review = { who: string; stars: number; text: string; hit: boolean }

const REVIEWS: readonly Review[] = [
  { who: 'K', stars: 3, text: '« Je ne trouve pas la facturation »', hit: true },
  { who: 'M', stars: 2, text: '« Où sont mes factures ? »', hit: true },
  { who: 'S', stars: 5, text: '« Livraison rapide, merci ! »', hit: false },
  { who: 'J', stars: 2, text: '« Paiement refusé deux fois »', hit: false },
]

/** Repères de la scène large, en % de la scène (3:1,5). Le SVG utilise le même rapport (1000 × 667). */
const BUBBLE_LEFT = 5
const BUBBLE_W = 27
const BUBBLE_H = 18
const BUBBLE_TOPS = [7, 28, 49, 70] as const
const THEME = { left: 40, top: 33, w: 30, h: 28 } as const
const RECO = { left: 73, top: 33, w: 24, h: 28 } as const
const VB_W = 1000
const VB_H = 667

const GREEN_INK = '#4f6b43'
const GREEN_SOFT = '#e4ebde'
const CARD_SHADOW = '0 .8em 2em -1.2em rgba(24,24,27,.35)'

type Vars = CSSProperties & { [key: `--${string}`]: string | number }
const vars = (d: number, dur?: number, extra: CSSProperties = {}): Vars => ({
  '--d': `${d}s`,
  ...(dur ? { '--dur': `${dur}s` } : {}),
  ...extra,
})

function Stars({ n, hit }: { n: number; hit: boolean }) {
  return (
    <span style={{ fontSize: '.9em', letterSpacing: '.08em', color: hit ? ACCENT : SAGE }}>
      {'★'.repeat(n)}
      <span style={{ color: '#dcdce0' }}>{'★'.repeat(5 - n)}</span>
    </span>
  )
}

function Bubble({ r, delay, className, style }: { r: Review; delay: number; className: string; style?: CSSProperties }) {
  return (
    <div
      className={`hs-a hs-in-left hs-card ${className}`}
      style={vars(delay, undefined, {
        ...style,
        border: `1px solid ${r.hit ? '#f8c9ad' : LINE}`,
        borderRadius: '1.1em',
        padding: '.8em 1em',
        boxShadow: CARD_SHADOW,
      })}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6em' }}>
        <span
          style={{
            display: 'grid', placeItems: 'center', width: '1.9em', height: '1.9em', borderRadius: '50%',
            fontSize: '.8em', fontWeight: 700,
            background: r.hit ? ACCENT_SOFT : '#eef0ea', color: r.hit ? ACCENT_INK : '#5f6b57',
          }}
        >
          {r.who}
        </span>
        <Stars n={r.stars} hit={r.hit} />
      </div>
      <p style={{ margin: '.5em 0 0', fontSize: '.95em', fontWeight: 600, lineHeight: 1.3, color: INK, textWrap: 'balance' }}>{r.text}</p>
    </div>
  )
}

function ThemeCard({ delay, className, style }: { delay: number; className: string; style?: CSSProperties }) {
  return (
    <div
      className={`hs-a hs-pop hs-card ${className}`}
      style={vars(delay, undefined, {
        ...style,
        border: '1px solid #f8c9ad',
        borderRadius: '1.2em',
        padding: '1.1em 1.3em',
        boxShadow: '0 1.2em 3em -1.4em rgba(238,96,24,.55)',
      })}
    >
      <p style={{ margin: 0, fontSize: '.72em', fontWeight: 700, letterSpacing: '.1em', color: ACCENT_INK }}>ANALYSE / THÈME</p>
      <p style={{ margin: '.3em 0 0', fontSize: '1.55em', fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.1, color: INK }}>Facturation</p>
      <p style={{ margin: '.35em 0 0', fontSize: '.85em', color: MUTED }}>
        <span className="hs-a hs-count" style={vars(delay + 0.1, 1)} /> avis concernés
      </p>
    </div>
  )
}

function RecoCard({ delay, className, style }: { delay: number; className: string; style?: CSSProperties }) {
  return (
    <div
      className={`hs-a hs-pop hs-card ${className}`}
      style={vars(delay, undefined, {
        ...style,
        border: `1px solid ${LINE}`,
        borderRadius: '1.2em',
        padding: '1.1em 1.2em',
        boxShadow: CARD_SHADOW,
      })}
    >
      <svg className="hs-spark" viewBox="0 0 30 30" width="3em" height="3em" fill="none" aria-hidden="true">
        {['M6 16 V9', 'M10.6 17.4 L14.6 11.7', 'M13.5 21.3 L20.1 18.9'].map((d, i) => (
          <path key={d} d={d} pathLength={1} className="hs-a hs-draw hs-line" style={vars(delay + 0.6 + i * 0.1, 0.35)} stroke={ACCENT} strokeWidth="2" strokeLinecap="round" />
        ))}
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6em' }}>
        <span className="hs-a hs-check" style={vars(delay + 0.4, 0.4, { display: 'grid', placeItems: 'center', flexShrink: 0, width: '1.8em', height: '1.8em', borderRadius: '.5em', background: GREEN_SOFT, color: GREEN_INK })}>
          <Check size="1.1em" strokeWidth={3} />
        </span>
        <span style={{ fontSize: '.72em', fontWeight: 700, letterSpacing: '.06em', whiteSpace: 'nowrap', color: GREEN_INK }}>RECOMMANDATION</span>
      </div>
      <p style={{ margin: '.7em 0 0', fontSize: '1em', fontWeight: 700, lineHeight: 1.25, color: INK }}>Rendre la facturation visible dans le menu</p>
    </div>
  )
}

/** Positionnement en % de la scène large. */
const box = (b: { left: number; top: number; w: number; h: number }): CSSProperties => ({
  left: `${b.left}%`, top: `${b.top}%`, width: `${b.w}%`, height: `${b.h}%`,
})

const centerY = (top: number, h: number) => ((top + h / 2) / 100) * VB_H
const THEME_X = (THEME.left / 100) * VB_W
const THEME_Y = centerY(THEME.top, THEME.h)
const BUBBLE_X = ((BUBBLE_LEFT + BUBBLE_W) / 100) * VB_W

/* Calendrier de la scène large (secondes) */
const T = { bubble: (i: number) => 0.15 + i * 0.28, line: (i: number) => 1.2 + i * 0.12, theme: 1.9, arrow: 2.8, reco: 3.1 }

export function HeroScene() {
  const rootRef = useRef<HTMLDivElement>(null)
  const playing = useInView(rootRef, { once: true, amount: 0.3 })
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ['start end', 'end start'] })
  const decorY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [36, -36])
  const haloY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-18, 18])
  const sceneY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [10, -10])

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label="Animation : des avis clients arrivent, Qualio en tire le thème « Facturation » (14 avis concernés), puis propose la recommandation « Rendre la facturation visible dans le menu »."
      className={`hs-stage ${playing ? 'hs-play' : ''}`}
    >
      {/* ───── Grand écran : scène horizontale ───── */}
      <div className="hs-desktop" aria-hidden="true">
        <div className="hs-scene" style={{ borderColor: LINE }}>
          <motion.div className="hs-layer" style={{ y: decorY }}>
            <span className="hs-arc" style={{ right: '-9%', top: '-34%', width: '42%', border: '4cqw solid #fdeadb' }} />
            <span className="hs-arc" style={{ left: '-8%', bottom: '-38%', width: '34%', border: '3cqw solid #e9ece4' }} />
          </motion.div>

          <div className="hs-halo-pos" style={{ left: `${THEME.left + THEME.w / 2}%`, top: `${THEME.top + THEME.h / 2}%`, width: '46%' }}>
            <motion.div className="hs-halo" style={{ y: haloY }} />
          </div>
          <span
            className="hs-a hs-ring"
            style={vars(T.theme + 0.1, 1.2, { left: `${THEME.left + THEME.w / 2}%`, top: `${THEME.top + THEME.h / 2}%`, width: '30%' })}
          />

          <motion.div className="hs-layer" style={{ y: sceneY }}>
            <svg className="hs-lines" viewBox={`0 0 ${VB_W} ${VB_H}`} fill="none">
              {BUBBLE_TOPS.map((top, i) => {
                const y = centerY(top, BUBBLE_H)
                const hit = REVIEWS[i].hit
                const stroke = hit ? ACCENT : SAGE
                return (
                  <g key={top}>
                    <path
                      d={`M${BUBBLE_X} ${y} C ${BUBBLE_X + 45} ${y}, ${THEME_X - 45} ${THEME_Y}, ${THEME_X} ${THEME_Y}`}
                      pathLength={1}
                      className={`hs-a hs-draw hs-line ${hit ? '' : 'hs-line--dim'}`}
                      style={vars(T.line(i), 0.6)}
                      stroke={stroke}
                      strokeWidth={hit ? 2.6 : 2}
                      strokeLinecap="round"
                    />
                    <circle className="hs-a hs-fade" style={vars(T.line(i), 0.3)} cx={BUBBLE_X} cy={y} r={4.5} fill={stroke} />
                  </g>
                )
              })}
              <circle className="hs-a hs-fade" style={vars(T.line(3), 0.3)} cx={THEME_X} cy={THEME_Y} r={5} fill={ACCENT} />
              <path d={`M${THEME_X + (THEME.w / 100) * VB_W} ${THEME_Y} H ${(RECO.left / 100) * VB_W - 4}`} pathLength={1} className="hs-a hs-draw hs-line" style={vars(T.arrow, 0.4)} stroke={ACCENT} strokeWidth={2.6} strokeLinecap="round" />
              <path
                d={`M${(RECO.left / 100) * VB_W - 12} ${THEME_Y - 7} L ${(RECO.left / 100) * VB_W - 3} ${THEME_Y} L ${(RECO.left / 100) * VB_W - 12} ${THEME_Y + 7}`}
                pathLength={1}
                className="hs-a hs-draw hs-line"
                style={vars(T.arrow + 0.3, 0.25)}
                stroke={ACCENT}
                strokeWidth={2.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {REVIEWS.map((r, i) => (
              <Bubble
                key={r.text}
                r={r}
                delay={T.bubble(i)}
                className="hs-abs"
                style={{ left: `${BUBBLE_LEFT}%`, top: `${BUBBLE_TOPS[i]}%`, width: `${BUBBLE_W}%`, height: `${BUBBLE_H}%` }}
              />
            ))}
            <ThemeCard delay={T.theme} className="hs-abs" style={box(THEME)} />
            <RecoCard delay={T.reco} className="hs-abs" style={box(RECO)} />
          </motion.div>
        </div>
      </div>

      {/* ───── Petit écran : version verticale, mêmes éléments en plus compact ───── */}
      <div className="hs-mobile" aria-hidden="true" style={{ borderColor: LINE }}>
        <div className="hs-stack">
          {REVIEWS.slice(0, 3).map((r, i) => (
            <Bubble key={r.text} r={r} delay={0.15 + i * 0.3} className="hs-rel" />
          ))}
        </div>
        <div className="hs-a hs-grow hs-vline" style={vars(1.1, 0.4)} />
        <ThemeCard delay={1.4} className="hs-rel" />
        <div className="hs-a hs-grow hs-vline" style={vars(2.3, 0.4)} />
        <RecoCard delay={2.6} className="hs-rel" />
      </div>
    </div>
  )
}
