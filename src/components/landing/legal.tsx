import type { ReactNode } from 'react'
import { SiteShell } from '@/components/landing/SiteShell'
import { Eyebrow } from '@/components/landing/primitives'
import { ACCENT_INK, H2, INK, LINE, MUTED } from '@/components/landing/tokens'

export { LEGAL } from '@/lib/legal'
import { LEGAL } from '@/lib/legal'

export function Fill({ value }: { value: string }) {
  if (value) return <>{value}</>
  return <mark className="rounded px-1.5 py-0.5 text-[0.85em] font-semibold" style={{ background: '#fff1e9', color: ACCENT_INK }}>À compléter</mark>
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight" style={{ color: INK }}>{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-7" style={{ color: MUTED }}>{children}</div>
    </section>
  )
}

export function LegalPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-5 py-20">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className={`mt-5 ${H2}`}>{title}</h1>
        <p className="mt-5 text-base leading-7" style={{ color: MUTED }}>{intro}</p>
        <p className="mt-3 text-xs" style={{ color: MUTED }}>Dernière mise à jour : {LEGAL.updatedAt}</p>
        <div className="mt-2 border-t pt-2" style={{ borderColor: LINE }}>{children}</div>
        <p className="mt-12 text-sm" style={{ color: MUTED }}>
          Une question sur ce texte ? Écrivez à <a href={`mailto:${LEGAL.email}`} className="font-semibold underline" style={{ color: INK }}>{LEGAL.email}</a>.
        </p>
      </article>
    </SiteShell>
  )
}
