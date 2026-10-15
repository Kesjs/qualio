'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { Check, RotateCcw } from 'lucide-react'
import { ACCENT, ACCENT_INK, ACCENT_SOFT, FOCUS, INK, LINE, MUTED, R_BUTTON, R_CHIP, SOFT } from './tokens'
import { Demo } from './primitives'

/*
 * Animations des quatre étapes (doc 4.7).
 *  - Elles démarrent quand la section entre à l'écran et se jouent une seule fois.
 *  - À la fin, l'image reste lisible ; un bouton « Rejouer » est proposé.
 *  - `mode="static"` (aperçus de la landing) et « réduire les animations » affichent directement l'état final.
 *  - Aucune information ne passe uniquement par le mouvement : le texte de l'étape dit la même chose.
 *  - Pas de boucle, pas de vidéo, pas de bibliothèque en plus ; la hauteur est réservée à l'avance.
 */

export type DemoMode = 'play' | 'static'

function usePlayOnce(timings: readonly number[], mode: DemoMode) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [run, setRun] = useState(0)
  const last = timings.length
  const instant = mode === 'static' || Boolean(reduce)
  const [phase, setPhase] = useState(mode === 'static' ? last : 0)

  useEffect(() => {
    if (instant) {
      setPhase(last)
      return
    }
    setPhase(0)
    if (!inView) return
    const ids = timings.map((ms, i) => window.setTimeout(() => setPhase(i + 1), ms))
    return () => ids.forEach((id) => window.clearTimeout(id))
  }, [instant, inView, run, last, timings])

  return { ref, phase, done: phase >= last, instant, replay: () => setRun((r) => r + 1) }
}

function ReplayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium transition before:absolute before:-inset-2 before:content-[''] hover:bg-white ${R_CHIP} ${FOCUS}`}
      style={{ color: MUTED }}
    >
      <RotateCcw size={12} aria-hidden="true" />
      Rejouer
    </button>
  )
}

function Stage({
  label, minH, mode, timings, children,
}: {
  label: string
  minH: number
  mode: DemoMode
  timings: readonly number[]
  children: (phase: number) => ReactNode
}) {
  const { ref, phase, done, instant, replay } = usePlayOnce(timings, mode)
  const showReplay = done && !instant
  return (
    <div ref={ref} className="qualio-demo">
      <Demo label={label} action={showReplay ? <ReplayButton onClick={replay} /> : undefined}>
        <div aria-hidden="true" style={{ minHeight: minH }}>{children(phase)}</div>
      </Demo>
    </div>
  )
}

const fade = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.3 } }

/* ───────── 1. Importer ───────── */

const IMPORT_ROWS = [
  ['12/03', 'Commande', '« Colis reçu en retard »'],
  ['14/03', 'Support', '« Très bon accueil »'],
  ['18/03', 'Widget', '« Facturation introuvable »'],
  ['21/03', 'Support', '« Impossible de retrouver mes factures »'],
] as const
const IMPORT_COUNT = [0, 10, 22, 31, 40]
const IMPORT_TIMINGS = [250, 800, 1300, 1800] as const

export function ImportAnimation({ mode = 'play' }: { mode?: DemoMode }) {
  return (
    <Stage label="Import CSV" minH={250} mode={mode} timings={IMPORT_TIMINGS}>
      {(phase) => (
        <>
          <div className="mb-3 flex items-center justify-between border bg-white p-3" style={{ borderColor: LINE, borderRadius: 8 }}>
            <AnimatePresence>
              {phase >= 1 ? (
                <motion.span key="file" {...fade} className="text-xs font-medium" style={{ color: INK }}>avis_2025.csv</motion.span>
              ) : (
                <motion.span key="hint" {...fade} className="text-xs" style={{ color: MUTED }}>Déposez votre fichier CSV</motion.span>
              )}
            </AnimatePresence>
            <span className={`px-2.5 py-1 text-[11px] font-semibold ${R_CHIP}`} style={{ background: phase >= 1 ? ACCENT_SOFT : SOFT, color: phase >= 1 ? ACCENT_INK : MUTED }}>
              {IMPORT_COUNT[phase]} avis
            </span>
          </div>
          <div className="overflow-hidden border bg-white" style={{ borderColor: LINE, borderRadius: 8 }}>
            {IMPORT_ROWS.map((r, i) => (
              <div key={r[2]} className={`border-b last:border-b-0 ${i === 3 ? 'hidden sm:block' : ''}`} style={{ borderColor: LINE }}>
                <AnimatePresence initial={false}>
                  {phase >= i + 1 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-[48px_1fr] gap-3 overflow-hidden px-3 py-2.5 text-xs sm:grid-cols-[48px_80px_1fr]"
                      style={{ color: INK }}
                    >
                      <span style={{ color: MUTED }}>{r[0]}</span>
                      <span className="hidden sm:block" style={{ color: MUTED }}>{r[1]}</span>
                      <span className="truncate">{r[2]}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            {phase === 0 && <div className="p-6 text-center text-xs" style={{ color: MUTED }}>Aucun avis importé</div>}
          </div>
        </>
      )}
    </Stage>
  )
}

/* ───────── 2. Collecter ───────── */

const WIDGET_TIMINGS = [300, 1000, 1900, 2500] as const

export function WidgetAnimation({ mode = 'play' }: { mode?: DemoMode }) {
  return (
    <Stage label="Widget de collecte" minH={290} mode={mode} timings={WIDGET_TIMINGS}>
      {(phase) => (
        <>
          <div className="relative h-[150px] overflow-hidden border bg-white" style={{ borderColor: LINE, borderRadius: 8 }}>
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
              {phase >= 1 && phase < 3 && (
                <motion.div
                  key="panel"
                  {...fade}
                  className="absolute bottom-12 right-3 w-[calc(100%-1.5rem)] max-w-[260px] border bg-white p-3 shadow-sm"
                  style={{ borderColor: LINE, borderRadius: 8 }}
                >
                  <p className="mb-1.5 text-[11px] font-semibold" style={{ color: INK }}>Votre avis</p>
                  <p className="mb-2 text-[11px] tracking-[2px]" style={{ color: phase >= 2 ? ACCENT : '#d7d7dc' }}>{'★★'}<span style={{ color: '#d7d7dc' }}>★★★</span></p>
                  <p className="min-h-[32px] text-[11px] leading-snug" style={{ color: INK }}>
                    {phase >= 2 ? 'Facturation introuvable depuis mon téléphone.' : <span style={{ color: MUTED }}>Qu’est-ce qui pourrait être mieux ?</span>}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <span className={`absolute bottom-3 right-3 px-3 py-1.5 text-[11px] font-semibold text-white ${R_BUTTON}`} style={{ background: ACCENT_INK }}>
              Donner mon avis
            </span>
          </div>

          <div className="mt-3 space-y-2">
            <AnimatePresence initial={false}>
              {phase >= 4 && (
                <motion.div
                  key="new"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 border bg-white p-3 text-xs"
                  style={{ borderColor: ACCENT, borderRadius: 8 }}
                >
                  <span className={`mt-0.5 px-1.5 py-0.5 font-semibold ${R_CHIP}`} style={{ background: ACCENT_SOFT, color: ACCENT_INK }}>Widget</span>
                  <span style={{ color: INK }}>Facturation introuvable depuis mon téléphone.</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-start gap-3 border bg-white p-3 text-xs" style={{ borderColor: LINE, borderRadius: 8 }}>
              <span className={`mt-0.5 px-1.5 py-0.5 font-semibold ${R_CHIP}`} style={{ background: SOFT, color: MUTED }}>CSV</span>
              <span style={{ color: INK }}>Le lien vers la facturation est difficile à trouver.</span>
            </div>
          </div>
        </>
      )}
    </Stage>
  )
}

/* ───────── 3. Repérer ───────── */

const THEME_LINES = [
  ['« Je ne trouve pas la page de facturation. »', 0],
  ['« Livraison plus lente que prévu. »', 1],
  ['« Le lien est caché dans le menu. »', 0],
  ['« Mon paiement a été refusé deux fois. »', 2],
] as const
const THEMES = [
  { name: 'Facturation', n: 14, pct: 77, hot: true },
  { name: 'Délais de livraison', n: 9, pct: 49, hot: false },
  { name: 'Paiement mobile', n: 6, pct: 33, hot: false },
]
const THEME_DOT = [ACCENT, '#71717a', '#b8b8bf']
const THEMES_TIMINGS = [300, 1300, 2200] as const

export function ThemesAnimation({ mode = 'play' }: { mode?: DemoMode }) {
  return (
    <Stage label="Synthèse sourcée" minH={230} mode={mode} timings={THEMES_TIMINGS}>
      {(phase) => (
        <div className="grid">
          <div className="space-y-2 [grid-area:1/1]" style={{ opacity: phase >= 3 ? 0 : 1, transition: 'opacity .35s', pointerEvents: 'none' }}>
            {THEME_LINES.map(([text, theme], i) => (
              <motion.div
                key={text}
                initial={false}
                animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 8 }}
                transition={{ delay: phase >= 1 ? i * 0.12 : 0, duration: 0.3 }}
                className="flex items-center gap-3 border bg-white px-3 py-2.5 text-xs"
                style={{ borderColor: LINE, borderRadius: 8, color: INK }}
              >
                <span className="h-2 w-2 shrink-0 rounded-full transition-colors" style={{ background: phase >= 2 ? THEME_DOT[theme] : '#d7d7dc' }} />
                <span className="truncate">{text}</span>
              </motion.div>
            ))}
          </div>
          <div className="space-y-3 [grid-area:1/1]" style={{ opacity: phase >= 3 ? 1 : 0, transition: 'opacity .35s .15s' }}>
            {THEMES.map((t, i) => (
              <div key={t.name} className="flex items-center gap-3 text-xs">
                <span className="w-28 shrink-0 truncate font-medium sm:w-36" style={{ color: INK }}>{t.name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: '#ececef' }}>
                  <div className="h-full rounded-full" style={{ width: phase >= 3 ? `${t.pct}%` : 0, background: THEME_DOT[i], transition: `width .8s ${0.2 + i * 0.12}s` }} />
                </div>
                <span className="w-14 shrink-0 text-right font-semibold" style={{ color: INK }}>{t.n} avis</span>
              </div>
            ))}
            <p className={`mt-4 inline-block px-3 py-1.5 text-[12px] font-semibold ${R_CHIP}`} style={{ background: ACCENT_SOFT, color: ACCENT_INK }}>
              Justifié par 14 avis sur 40
            </p>
          </div>
        </div>
      )}
    </Stage>
  )
}

/* ───────── 4. Décider ───────── */

const DECISION_TIMINGS = [300, 1400, 2200] as const

function RecoCard({ rank, title, basis, quotes, pressed = false }: { rank: number; title: string; basis: string; quotes: string[]; pressed?: boolean }) {
  return (
    <div className="border bg-white p-4" style={{ borderColor: LINE, borderRadius: 12 }}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Recommandation n°{rank}</span>
        <span className={`px-2 py-0.5 text-[10px] font-semibold ${R_CHIP}`} style={{ background: ACCENT_SOFT, color: ACCENT_INK }}>Priorité haute</span>
      </div>
      <p className="mt-2 text-[16px] font-semibold leading-snug tracking-tight" style={{ color: INK }}>{title}</p>
      <p className="mt-1 text-xs" style={{ color: MUTED }}>{basis}</p>
      <ul className="mt-3 space-y-1">
        {quotes.map((q, i) => (
          <li key={q} className={`text-xs ${i > 0 ? 'hidden sm:block' : ''}`} style={{ color: INK }}>▸ {q}</li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`px-3.5 py-1.5 text-[12px] font-semibold text-white transition-transform ${R_BUTTON}`} style={{ background: ACCENT_INK, transform: pressed ? 'scale(0.94)' : 'none' }}>Accepter</span>
        <span className={`border px-3.5 py-1.5 text-[12px] font-semibold ${R_BUTTON}`} style={{ borderColor: LINE, color: INK }}>Plus tard</span>
        <span className={`px-3.5 py-1.5 text-[12px] font-medium ${R_BUTTON}`} style={{ color: MUTED }}>Écarter</span>
      </div>
    </div>
  )
}

export function DecisionAnimation({ mode = 'play' }: { mode?: DemoMode }) {
  return (
    <Stage label="Recommandations" minH={330} mode={mode} timings={DECISION_TIMINGS}>
      {(phase) => (
        <div className="space-y-3">
          <AnimatePresence initial={false} mode="popLayout">
            {phase >= 3 && (
              <motion.div
                key="accepted"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 border bg-white px-3 py-2.5 text-xs font-medium"
                style={{ borderColor: LINE, borderRadius: 8, color: INK }}
              >
                <Check size={14} style={{ color: ACCENT }} aria-hidden="true" />
                <span className="truncate">Acceptée par l’équipe · Rendre la facturation visible dans le menu</span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait" initial={false}>
            {phase >= 3 ? (
              <motion.div key="next" {...fade}>
                <RecoCard rank={1} title="Réduire le délai de livraison annoncé" basis="9 avis sur 40 mentionnent ce point." quotes={['« Livraison plus lente que prévu. » — 11/10', '« Colis arrivé avec une semaine de retard. » — 05/10']} />
              </motion.div>
            ) : phase >= 1 ? (
              <motion.div key="first" {...fade}>
                <RecoCard rank={1} title="Rendre la facturation visible dans le menu" basis="14 avis sur 40 mentionnent la difficulté à retrouver leurs factures." quotes={['« Je n’arrive jamais à retrouver ma facture » — 12/10', '« Où sont les factures ? » — 09/10']} pressed={phase === 2} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}
    </Stage>
  )
}
