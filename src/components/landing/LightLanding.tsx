'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronDown, Menu, X } from 'lucide-react'
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
    a: 'Rien. Le plan gratuit inclut un projet et une synthèse d’essai, puis une par mois, pour tester Qualio sur vos vrais avis avant de passer à un plan payant.',
  },
]

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`

const PLANS = [
  {
    id: 'free' as const,
    audience: 'Pour découvrir Qualio sur vos avis',
    synth: '1 synthèse d’essai, puis 1 par mois',
    featured: false,
  },
  {
    id: 'essential' as const,
    audience: 'Pour suivre vos avis chaque semaine',
    synth: `${BILLING_PLANS.essential.monthlySyntheses} synthèses par mois`,
    featured: true,
  },
  {
    id: 'pro' as const,
    audience: 'Pour gérer plusieurs clients',
    synth: `${BILLING_PLANS.pro.monthlySyntheses} synthèses par mois et par projet`,
    featured: false,
  },
].map((p) => ({
  ...p,
  name: BILLING_PLANS[p.id].label,
  price: String(BILLING_PLANS[p.id].priceEur),
  projects: plural(BILLING_PLANS[p.id].projects, 'projet', 'projets'),
}))

const PLAN_FEATURES = [
  'Import CSV de vos avis passés',
  'Widget de collecte pour votre site',
  'Thèmes avec exemples sourcés',
  'Recommandations validées par votre équipe',
]

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
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: ACCENT }}>
      {children}
    </span>
  )
}

function PrimaryButton({ href, children, dark = false }: { href: string; children: ReactNode; dark?: boolean }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition hover:opacity-85"
      style={dark ? { background: '#fff', color: INK } : { background: INK, color: '#fff' }}
    >
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  )
}

function Demo({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-6" style={{ borderColor: LINE }}>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.1em]" style={{ color: MUTED }}>{label}</span>
      </div>
      {children}
    </div>
  )
}

/* ───────────────────────── Navbar ───────────────────────── */

function Navbar() {
  const [open, setOpen] = useState(false)
  const links = [
    ['#fonctionnement', 'Fonctionnement'],
    ['#pour-qui', 'Pour qui'],
    ['#tarifs', 'Tarifs'],
    ['#faq', 'FAQ'],
  ]
  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur" style={{ borderColor: LINE }}>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5" aria-label="Navigation principale">
        <Link href="/" className="flex items-center">
          <img src="/qualio-logo/export/lockup/lockup-light.svg" alt="Qualio" className="h-7" />
        </Link>
        <div className="hidden items-center gap-7 text-sm md:flex" style={{ color: MUTED }}>
          {links.map(([href, label]) => (
            <a key={href} href={href} className="transition hover:text-black">{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm sm:inline" style={{ color: MUTED }}>Se connecter</Link>
          <Link href={SIGNUP} className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: INK }}>
            Commencer
          </Link>
          <button
            type="button"
            className="p-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-t px-5 py-3 md:hidden" style={{ borderColor: LINE }}>
          {links.map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="block py-3 text-sm" style={{ color: INK }}>
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}

/* ───────────────────────── Hero illustration ───────────────────────── */

function HeroIllustration() {
  const reduce = useReducedMotion()
  const avis = [
    { text: 'Mon paiement a été refusé deux fois.', src: 'CSV' },
    { text: 'Où est la page de facturation ?', src: 'Widget' },
    { text: 'Livraison rapide, merci !', src: 'CSV' },
  ]
  const bars = [
    { label: 'Facturation', w: 77, n: 14 },
    { label: 'Livraison', w: 49, n: 9 },
    { label: 'Paiement', w: 33, n: 6 },
  ]
  return (
    <div className="rounded-3xl border bg-[#fafafa] p-5 sm:p-7" style={{ borderColor: LINE }}>
      <div className="grid gap-4 md:grid-cols-[1fr_44px_1fr] md:items-center">
        <div className="space-y-3">
          {avis.map((a, i) => (
            <motion.div
              key={a.text}
              initial={reduce ? false : { opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.25, duration: 0.5 }}
              className="rounded-xl border bg-white p-3"
              style={{ borderColor: LINE }}
            >
              <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wide" style={{ color: MUTED }}>
                <span>Avis reçu</span>
                <span>{a.src}</span>
              </div>
              <p className="text-sm" style={{ color: INK }}>« {a.text} »</p>
            </motion.div>
          ))}
        </div>

        <svg viewBox="0 0 44 220" className="mx-auto hidden h-56 w-11 md:block" aria-hidden="true">
          {[40, 110, 180].map((y, i) => (
            <motion.path
              key={y}
              d={`M2 ${y} C 22 ${y}, 22 110, 42 110`}
              fill="none"
              stroke={ACCENT}
              strokeWidth={1.5}
              strokeLinecap="round"
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.8 + i * 0.2, duration: 0.7 }}
            />
          ))}
          <motion.circle
            cx={42}
            cy={110}
            r={3}
            fill={ACCENT}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
          />
        </svg>

        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="rounded-xl border bg-white p-5"
          style={{ borderColor: LINE }}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: INK }}>Synthèse · 40 avis</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: SOFT, color: MUTED }}>Sourcée</span>
          </div>
          <div className="space-y-3">
            {bars.map((b, i) => (
              <div key={b.label}>
                <div className="mb-1 flex justify-between text-xs" style={{ color: MUTED }}>
                  <span>{b.label}</span>
                  <span>{b.n} avis</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: SOFT }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: i === 0 ? ACCENT : INK }}
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${b.w}%` }}
                    transition={{ delay: 1.5 + i * 0.15, duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t pt-4" style={{ borderColor: LINE }}>
            <p className="text-xs font-semibold" style={{ color: INK }}>Recommandation</p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: MUTED }}>
              Rendre la facturation visible depuis le menu principal.
            </p>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full px-3 py-1 text-[11px] font-medium text-white" style={{ background: INK }}>Accepter</span>
              <span className="rounded-full border px-3 py-1 text-[11px]" style={{ borderColor: LINE, color: MUTED }}>Plus tard</span>
            </div>
          </div>
        </motion.div>
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
          style={{ background: INK }}
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
                      background: n <= rating ? INK : '#fff',
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
                className="mb-2 w-full resize-none rounded-md border p-2 text-xs outline-none focus:border-black"
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
          style={{ background: INK }}
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
              borderColor: i === active ? INK : LINE,
              background: i === active ? INK : '#fff',
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
                      style={{ background: INK }}
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

function FeatureRow({
  n, title, body, visual, flip = false,
}: { n: string; title: string; body: string; visual: ReactNode; flip?: boolean }) {
  return (
    <div className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:gap-20 lg:py-20">
      <Reveal className={flip ? 'lg:order-2' : ''}>
        <span className="text-sm font-semibold" style={{ color: ACCENT }}>{n}</span>
        <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{title}</h3>
        <p className="mt-4 max-w-md leading-relaxed" style={{ color: MUTED }}>{body}</p>
      </Reveal>
      <Reveal delay={0.08} className={flip ? 'lg:order-1' : ''}>
        <div className="rounded-3xl p-4 sm:p-8" style={{ background: SOFT }}>{visual}</div>
      </Reveal>
    </div>
  )
}

const AUDIENCES = [
  { id: 'equipes', tab: 'Équipes produit', title: 'Les retours arrivent de partout. Lisez-les au même endroit.', body: 'Email, formulaire, support : Qualio réunit tout dans un espace, classé par thème, pour que la réunion produit parte de faits et non d’impressions.' },
  { id: 'agences', tab: 'Agences et freelances', title: 'Un projet par client, un rapport par période.', body: 'Chaque client a son espace avec ses sources, ses avis et ses synthèses. Vous gardez une vue claire de ce qui remonte, projet par projet.' },
  { id: 'boutiques', tab: 'Boutiques en ligne', title: 'Voyez la friction avant qu’elle ne coûte des ventes.', body: 'Livraison, paiement, retours : repérez les sujets qui reviennent dans les avis et traitez d’abord ceux qui touchent le plus de clients.' },
]

function AudienceTabs() {
  const [active, setActive] = useState(0)
  const a = AUDIENCES[active]
  return (
    <div>
      <div role="tablist" className="mx-auto flex max-w-full flex-wrap justify-center gap-2">
        {AUDIENCES.map((x, i) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={i === active}
            type="button"
            onClick={() => setActive(i)}
            className="rounded-full border px-5 py-2.5 text-sm font-medium transition"
            style={{ borderColor: i === active ? INK : LINE, background: i === active ? INK : '#fff', color: i === active ? '#fff' : INK }}
          >
            {x.tab}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={a.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="mx-auto mt-10 max-w-2xl text-center"
        >
          <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{a.title}</h3>
          <p className="mt-4 leading-relaxed" style={{ color: MUTED }}>{a.body}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export function LightLanding() {
  return (
    <div className="min-h-screen bg-white font-sans" style={{ color: INK, scrollBehavior: 'smooth' }}>
      <Navbar />

      <main>
        {/* Hero: centré, produit en grand dessous */}
        <section className="mx-auto max-w-6xl px-5 pt-16 text-center sm:pt-24">
          <Reveal>
            <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Vos avis clients, en décisions claires.
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: MUTED }}>
              Importez les avis que vous avez déjà, recueillez les prochains avec un widget, et voyez quels
              thèmes méritent l’attention de votre équipe, chacun relié aux avis qui le justifient.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryButton href={SIGNUP}>Commencer gratuitement</PrimaryButton>
              <a href="#fonctionnement" className="inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold" style={{ borderColor: LINE }}>
                Voir comment ça marche
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs" style={{ color: MUTED }}>
              <span>Import CSV</span>
              <span>Widget de collecte</span>
              <span>Synthèses sourcées</span>
              <span>Plan gratuit</span>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="mx-auto mt-14 max-w-5xl text-left">
            <HeroIllustration />
          </Reveal>
        </section>

        {/* Problème : trois constats */}
        <section className="mx-auto max-w-6xl px-5 py-28">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Les avis s’accumulent. Les décisions, elles, attendent.
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              ['Éparpillés', 'Un CSV ici, un message là, un commentaire dans un outil de support. Personne n’a la vue d’ensemble.'],
              ['Trop longs à lire', 'Relire des centaines d’avis à la main prend des heures, alors on se fie aux trois derniers.'],
              ['Sans preuve', 'Une conclusion sans les avis qui la soutiennent ne convainc personne en réunion.'],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.06}>
                <h3 className="text-xl font-semibold tracking-tight">{t}</h3>
                <p className="mt-3 leading-relaxed" style={{ color: MUTED }}>{d}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Fonctionnement : une ligne par fonctionnalité */}
        <section id="fonctionnement" className="border-t" style={{ borderColor: LINE }}>
          <div className="mx-auto max-w-6xl px-5 pt-24">
            <Reveal className="mx-auto max-w-3xl text-center">
              <Eyebrow>Fonctionnement</Eyebrow>
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
                De vos avis à la prochaine action, en quatre étapes.
              </h2>
            </Reveal>
            <FeatureRow
              n="01"
              title="Importez vos avis existants."
              body="Un fichier CSV suffit. Chaque avis garde sa date, sa source et son contexte, pour que l’historique serve dès le premier jour."
              visual={<ImportDemo />}
            />
            <FeatureRow
              n="02"
              title="Recueillez les prochains avis sur votre site."
              body="Copiez un script, placez-le dans votre site. Vos clients donnent leur avis dans leur parcours, et il arrive dans le même espace."
              visual={<WidgetDemo />}
              flip
            />
            <FeatureRow
              n="03"
              title="Repérez ce qui revient, avec les avis à l’appui."
              body="Qualio regroupe les thèmes récurrents et montre, pour chacun, les avis qui le justifient et leur nombre."
              visual={<SynthesisDemo />}
            />
            <FeatureRow
              n="04"
              title="Décidez, avec des recommandations sourcées."
              body="Qualio sépare l’avis reçu, la synthèse produite et la recommandation proposée. Votre équipe accepte ou reporte, rien n’est appliqué automatiquement."
              visual={<RecommendationDemo />}
              flip
            />
          </div>
        </section>

        {/* Pour qui : onglets */}
        <section id="pour-qui" className="border-t" style={{ borderColor: LINE, background: SOFT }}>
          <div className="mx-auto max-w-6xl px-5 py-28">
            <Reveal className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Pensé pour ceux qui reçoivent des avis.
              </h2>
            </Reveal>
            <Reveal><AudienceTabs /></Reveal>
          </div>
        </section>

        {/* Témoignages : affichés seulement quand TESTIMONIALS est rempli */}
        {TESTIMONIALS.length > 0 && (
          <section className="border-t" style={{ borderColor: LINE }}>
            <div className="mx-auto max-w-6xl px-5 py-28">
              <div className="grid gap-6 md:grid-cols-3">
                {TESTIMONIALS.map((t, i) => (
                  <Reveal key={t.name} delay={i * 0.05} className="rounded-2xl border bg-white p-8">
                    <p className="text-lg leading-relaxed">« {t.quote} »</p>
                    <p className="mt-6 text-sm font-semibold">{t.name}</p>
                    <p className="text-xs" style={{ color: MUTED }}>{t.role}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Tarifs */}
        <section id="tarifs" className="border-t" style={{ borderColor: LINE }}>
          <div className="mx-auto max-w-6xl px-5 py-28">
            <Reveal className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Commencez gratuitement. Payez quand vos avis deviennent un rythme.
              </h2>
            </Reveal>
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {PLANS.map((p, i) => (
                <Reveal key={p.name} delay={i * 0.05} className="flex">
                  <div className={p.featured ? 'relative flex flex-1 flex-col rounded-3xl border-2 p-8' : 'flex flex-1 flex-col rounded-3xl border p-8'} style={{ borderColor: p.featured ? INK : LINE }}>
                    {p.featured && (
                      <span className="absolute -top-3 left-8 rounded-full px-3 py-1 text-[11px] font-semibold text-white" style={{ background: ACCENT }}>
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
                      {PLAN_FEATURES.map((f) => (
                        <li key={f} className="flex gap-2.5">
                          <Check size={16} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
                          <span style={{ color: MUTED }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-8 flex-1" />
                    <Link
                      href={SIGNUP}
                      className="mt-8 block rounded-full py-3 text-center text-sm font-semibold transition hover:opacity-85"
                      style={p.featured ? { background: INK, color: '#fff' } : { border: `1px solid ${LINE}`, color: INK }}
                    >
                      Commencer avec {p.name}
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
            <p className="mt-8 text-center text-xs" style={{ color: MUTED }}>
              Prix en euros, par mois. Les synthèses sont comptées par projet.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t" style={{ borderColor: LINE }}>
          <div className="mx-auto max-w-3xl px-5 py-28">
            <Reveal className="mb-10 text-center">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Questions fréquentes</h2>
            </Reveal>
            <Reveal delay={0.05}>
              {FAQ.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
            </Reveal>
          </div>
        </section>

        {/* Appel final */}
        <section className="px-5 pb-24">
          <Reveal className="mx-auto max-w-6xl">
            <div className="rounded-[2rem] px-6 py-20 text-center sm:px-16 sm:py-28" style={{ background: INK, color: '#fff' }}>
              <h2 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Transformez chaque avis en prochaine décision.
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-base" style={{ color: '#a3a3ab' }}>
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
            <Link href="/product" className="hover:text-black">Produit</Link>
            <Link href="/pricing" className="hover:text-black">Tarifs</Link>
            <Link href="/resources" className="hover:text-black">Ressources</Link>
            <Link href="/login" className="hover:text-black">Se connecter</Link>
          </nav>
          <span className="text-xs" style={{ color: MUTED }}>© 2026 Qualio</span>
        </div>
      </footer>
    </div>
  )
}
