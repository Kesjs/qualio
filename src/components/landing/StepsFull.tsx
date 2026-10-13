'use client'

import { ACCENT_INK, INK, LINE, MUTED, R_CARD, R_CHIP } from './tokens'
import { STEPS } from './content'
import { Reveal } from './primitives'
import { DecisionAnimation, ImportAnimation, ThemesAnimation, WidgetAnimation } from './StepDemos'
import type { DemoMode } from './StepDemos'

/**
 * Comment ça marche : 4 étapes complètes avec leurs animations (page `/produit`).
 * Fichier séparé : la landing (`/`) n'importe plus les 4 démos, seule la page Produit les charge (doc 4.7, légèreté).
 */

const STEP_DEMOS = [ImportAnimation, WidgetAnimation, ThemesAnimation, DecisionAnimation]

export function StepsFull({ mode = 'play' }: { mode?: DemoMode }) {
  return (
    <div className="mt-14 grid gap-4 lg:grid-cols-2">
      {STEPS.map((s, i) => {
        const Demo = STEP_DEMOS[i]
        return (
          <Reveal key={s.n} className="h-full">
            <div className={`flex h-full flex-col border bg-white p-7 ${R_CARD}`} style={{ borderColor: LINE }}>
              <span className={`inline-flex w-fit items-center gap-2 border px-2.5 py-1 text-xs font-medium ${R_CHIP}`} style={{ borderColor: LINE, color: INK }}>
                <span style={{ color: ACCENT_INK }}>{s.n}</span>
                {s.tag}
              </span>
              <h3 className="mt-5 text-[22px] font-semibold leading-tight tracking-tight">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed" style={{ color: MUTED }}>{s.body}</p>
              <div className="mt-6 flex-1"><Demo mode={mode} /></div>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

