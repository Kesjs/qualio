'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowRight, Lock, Search, Sparkles, Star } from 'lucide-react'
import { APP_STORE_COUNTRIES, parsePastedReviews, type AppStoreApp } from '@/lib/admin/acquisition-reviews'
import { REPORT_MIN_REVIEWS, type ReportProblem } from '@/lib/admin/acquisition-report'
import {
  ACCENT,
  ACCENT_INK,
  ACCENT_SOFT,
  FOCUS,
  H2,
  INK,
  LINE,
  MUTED,
  R_BUTTON,
  R_CARD,
  R_CHIP,
  SIGNUP,
  SOFT,
} from './tokens'
import { Eyebrow, Reveal, Section, UnderlineWord } from './primitives'

type Mode = 'app_store' | 'pasted'

type MiniAuditResult = {
  subjectName: string
  sourceLabel: string
  reviewCount: number
  averageRating: number | null
  negativeCount: number
  summary: string
  topProblem: ReportProblem | null
  lockedProblems: Array<{ theme: string; mentions: number; priority: 'high' | 'medium' | 'low' }>
  themes: Array<{ name: string; mentions: number; negativeShare: number | null }>
  token: string | null
}

const SAMPLE_APPS = ['Qonto', 'Doctolib', 'Pennylane'] as const

export function LiveMiniAudit() {
  const [mode, setMode] = useState<Mode>('app_store')
  const [country, setCountry] = useState('fr')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [apps, setApps] = useState<AppStoreApp[]>([])

  const [subjectName, setSubjectName] = useState('')
  const [pastedText, setPastedText] = useState('')
  const detectedCount = useMemo(() => (pastedText.trim() ? parsePastedReviews(pastedText).length : 0), [pastedText])

  const [analyzing, setAnalyzing] = useState(false)
  const [analyzingLabel, setAnalyzingLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MiniAuditResult | null>(null)

  async function searchIos(searchTerm: string) {
    const trimmed = searchTerm.trim()
    if (trimmed.length < 2) {
      setError('Indiquez le nom d’une application iOS ou son lien App Store.')
      return
    }
    setError(null)
    setSearching(true)
    try {
      const response = await fetch('/api/public/app-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, country }),
      })
      const body = (await response.json().catch(() => ({}))) as { apps?: AppStoreApp[]; error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Recherche App Store indisponible.')
      const found = body.apps ?? []
      setApps(found)
      if (found.length === 0) {
        setError('Aucune application trouvée sur cet App Store. Essayez un autre nom ou collez vos avis.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recherche App Store indisponible.')
    } finally {
      setSearching(false)
    }
  }

  function onSubmitSearch(event: FormEvent) {
    event.preventDefault()
    void searchIos(query)
  }

  async function runAppAudit(app: AppStoreApp) {
    setError(null)
    setResult(null)
    setAnalyzing(true)
    setAnalyzingLabel(`Lecture des avis publics de ${app.name}…`)
    try {
      const response = await fetch('/api/public/mini-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'app_store',
          appId: app.id,
          appName: app.name,
          appUrl: app.url,
          country,
        }),
      })
      const body = (await response.json().catch(() => ({}))) as MiniAuditResult & { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'L’analyse n’a pas pu aboutir.')
      setResult(body)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'L’analyse n’a pas pu aboutir.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function runPastedAudit(event: FormEvent) {
    event.preventDefault()
    if (detectedCount < REPORT_MIN_REVIEWS) {
      setError(`Collez au moins ${REPORT_MIN_REVIEWS} avis séparés par une ligne vide pour obtenir un diagnostic fiable.`)
      return
    }
    setError(null)
    setResult(null)
    setAnalyzing(true)
    setAnalyzingLabel('Regroupement des retours par thème et extraction des preuves…')
    try {
      const response = await fetch('/api/public/mini-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'pasted',
          subjectName: subjectName.trim() || 'Mon produit',
          text: pastedText,
        }),
      })
      const body = (await response.json().catch(() => ({}))) as MiniAuditResult & { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'L’analyse n’a pas pu aboutir.')
      setResult(body)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'L’analyse n’a pas pu aboutir.')
    } finally {
      setAnalyzing(false)
    }
  }

  const unlockHref = result?.token
    ? `${SIGNUP}&utm_source=mini_audit&redirectTo=${encodeURIComponent(`/onboarding?report=${result.token}`)}`
    : `${SIGNUP}&utm_source=mini_audit`

  const totalPriorities = (result?.topProblem ? 1 : 0) + (result?.lockedProblems.length ?? 0)

  return (
    <Section id="mini-audit" tone="soft">
      <Reveal className="mx-auto max-w-3xl text-center">
        <Eyebrow>Test en direct · sans compte</Eyebrow>
        <h2 className={`mt-4 ${H2}`}>
          Voyez le <UnderlineWord>problème n° 1</UnderlineWord> qui ressort de vos vrais avis.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed" style={{ color: MUTED }}>
          Cherchez une application iOS ou collez quelques avis Trustpilot, Google ou G2 : Qualio extrait immédiatement la friction principale, les verbatims qui la prouvent et l’action produit recommandée.
        </p>
      </Reveal>

      <Reveal delay={0.06} variant="focus" className="mx-auto mt-10 max-w-4xl">
        <div className={`border bg-white p-5 sm:p-8 ${R_CARD}`} style={{ borderColor: LINE }}>
          {/* Sélecteur de source */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: LINE }}>
            <div role="tablist" aria-label="Source de l’aperçu gratuit" className="inline-flex rounded-lg p-1" style={{ background: SOFT }}>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'app_store'}
                onClick={() => {
                  setMode('app_store')
                  setError(null)
                }}
                className={`px-3.5 py-2 text-xs font-semibold transition ${R_CHIP} ${FOCUS}`}
                style={mode === 'app_store' ? { background: '#fff', color: INK, boxShadow: '0 1px 2px rgba(11,11,12,0.06)' } : { color: MUTED }}
              >
                Application iOS (App Store)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'pasted'}
                onClick={() => {
                  setMode('pasted')
                  setError(null)
                }}
                className={`px-3.5 py-2 text-xs font-semibold transition ${R_CHIP} ${FOCUS}`}
                style={mode === 'pasted' ? { background: '#fff', color: INK, boxShadow: '0 1px 2px rgba(11,11,12,0.06)' } : { color: MUTED }}
              >
                Coller mes avis (Trustpilot, G2, Google…)
              </button>
            </div>
            <span className="font-mono text-xs tabular-nums" style={{ color: MUTED }}>
              Gratuit · résultat en ~10 s
            </span>
          </div>

          {/* Mode 1 : Recherche App Store */}
          {mode === 'app_store' && (
            <div className="mt-5 space-y-4">
              <form onSubmit={onSubmitSearch} className="flex flex-col gap-2.5 sm:flex-row">
                <select
                  aria-label="Pays de l’App Store"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={`h-11 border bg-white px-3 text-sm font-medium sm:w-36 ${R_BUTTON} ${FOCUS}`}
                  style={{ borderColor: LINE, color: INK }}
                >
                  {APP_STORE_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label} ({c.code.toUpperCase()})
                    </option>
                  ))}
                </select>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nom de votre app iOS ou lien apps.apple.com…"
                  className={`h-11 flex-1 border bg-white px-3.5 text-sm outline-none transition focus:border-[#0b0b0c] ${R_BUTTON} ${FOCUS}`}
                  style={{ borderColor: LINE, color: INK }}
                />
                <button
                  type="submit"
                  disabled={searching || analyzing}
                  className={`inline-flex h-11 items-center justify-center gap-2 px-5 text-sm font-semibold text-white transition hover:bg-[#a8370a] disabled:opacity-50 ${R_BUTTON} ${FOCUS}`}
                  style={{ background: ACCENT_INK }}
                >
                  <Search size={15} aria-hidden="true" />
                  {searching ? 'Recherche…' : 'Chercher'}
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: MUTED }}>
                <span>Pas d’app sous la main ? Tester sur :</span>
                {SAMPLE_APPS.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    disabled={searching || analyzing}
                    onClick={() => {
                      setQuery(sample)
                      void searchIos(sample)
                    }}
                    className={`border bg-white px-2.5 py-1 font-medium transition hover:border-[#0b0b0c] disabled:opacity-50 ${R_CHIP} ${FOCUS}`}
                    style={{ borderColor: LINE, color: INK }}
                  >
                    {sample}
                  </button>
                ))}
              </div>

              {apps.length > 0 && !analyzing && (
                <ul className="divide-y rounded-xl border" style={{ borderColor: LINE }}>
                  {apps.map((app) => (
                    <li
                      key={app.id}
                      className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                      style={{ borderColor: LINE }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {app.icon ? (
                          <img src={app.icon} alt="" className="h-10 w-10 shrink-0 rounded-xl border" style={{ borderColor: LINE }} />
                        ) : (
                          <span className="h-10 w-10 shrink-0 rounded-xl" style={{ background: SOFT }} />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold" style={{ color: INK }}>
                            {app.name}
                          </p>
                          <p className="flex flex-wrap items-center gap-2 text-xs" style={{ color: MUTED }}>
                            <span className="truncate">{app.seller}</span>
                            {app.rating != null && (
                              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                                <Star size={12} fill={ACCENT} color={ACCENT} aria-hidden="true" />
                                {app.rating.toFixed(1)}
                              </span>
                            )}
                            {app.ratingCount != null && (
                              <span className="font-mono tabular-nums">{app.ratingCount.toLocaleString('fr-FR')} notes</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void runAppAudit(app)}
                        disabled={analyzing}
                        className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 px-4 text-xs font-semibold text-white transition hover:bg-[#27272a] disabled:opacity-50 ${R_BUTTON} ${FOCUS}`}
                        style={{ background: INK }}
                      >
                        <Sparkles size={14} aria-hidden="true" />
                        Analyser les avis récents
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Mode 2 : Coller des avis */}
          {mode === 'pasted' && (
            <form onSubmit={(e) => void runPastedAudit(e)} className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <input
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Nom de votre produit ou boutique (facultatif)"
                  className={`h-11 border bg-white px-3.5 text-sm outline-none transition focus:border-[#0b0b0c] ${R_BUTTON} ${FOCUS}`}
                  style={{ borderColor: LINE, color: INK }}
                />
                <span className="font-mono text-xs font-medium tabular-nums" style={{ color: detectedCount >= REPORT_MIN_REVIEWS ? ACCENT_INK : MUTED }}>
                  {detectedCount} / {REPORT_MIN_REVIEWS} avis minimum
                </span>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={5}
                placeholder={`Collez au moins ${REPORT_MIN_REVIEWS} avis séparés par une ligne vide :\n\nLa livraison était rapide mais impossible de suivre le colis depuis son mobile.\n\nLe service client répond vite, par contre le formulaire de retour demande trois fois le numéro de commande…`}
                className={`w-full border bg-white p-3.5 text-sm leading-6 outline-none transition focus:border-[#0b0b0c] ${R_BUTTON} ${FOCUS}`}
                style={{ borderColor: LINE, color: INK }}
              />
              <button
                type="submit"
                disabled={analyzing || detectedCount < REPORT_MIN_REVIEWS}
                className={`inline-flex h-11 items-center justify-center gap-2 px-5 text-sm font-semibold text-white transition hover:bg-[#a8370a] disabled:opacity-50 ${R_BUTTON} ${FOCUS}`}
                style={{ background: ACCENT_INK }}
              >
                <Sparkles size={15} aria-hidden="true" />
                {detectedCount >= REPORT_MIN_REVIEWS
                  ? `Extraire le problème n° 1 sur ${detectedCount} avis`
                  : `Collez au moins ${REPORT_MIN_REVIEWS} avis`}
              </button>
            </form>
          )}

          {/* Erreur éventuelle */}
          {error && (
            <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {error}
            </div>
          )}

          {/* État d'analyse en cours */}
          {analyzing && (
            <div role="status" aria-live="polite" className="mt-6 flex items-center gap-3.5 rounded-xl border p-5" style={{ borderColor: LINE, background: SOFT }}>
              <span
                className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#d4d4d8] border-t-[#0b0b0c] motion-reduce:animate-none"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: INK }}>
                  {analyzingLabel}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: MUTED }}>
                  Calcul des occurrences réelles et anonymisation des verbatims (5 à 10 secondes).
                </p>
              </div>
            </div>
          )}

          {/* Résultat en direct */}
          {result && !analyzing && (
            <div className="mt-7 border-t pt-7" style={{ borderColor: LINE }}>
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <span className="font-mono text-xs uppercase tracking-[0.12em]" style={{ color: ACCENT_INK }}>
                    Diagnostic en direct · {result.sourceLabel}
                  </span>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl" style={{ color: INK }}>
                    {result.subjectName}
                  </h3>
                </div>
                <dl className="flex flex-wrap items-center gap-5 font-mono text-xs tabular-nums">
                  <div>
                    <dt className="sr-only">Avis analysés</dt>
                    <dd>
                      <strong className="text-sm font-semibold" style={{ color: INK }}>
                        {result.reviewCount}
                      </strong>{' '}
                      <span style={{ color: MUTED }}>avis lus</span>
                    </dd>
                  </div>
                  {result.averageRating != null && (
                    <div>
                      <dt className="sr-only">Note moyenne</dt>
                      <dd className="inline-flex items-center gap-1">
                        <Star size={13} fill={ACCENT} color={ACCENT} aria-hidden="true" />
                        <strong className="text-sm font-semibold" style={{ color: INK }}>
                          {result.averageRating.toLocaleString('fr-FR')}
                        </strong>
                        <span style={{ color: MUTED }}>/5</span>
                      </dd>
                    </div>
                  )}
                  {result.negativeCount > 0 && (
                    <div>
                      <dt className="sr-only">Avis critiques</dt>
                      <dd>
                        <strong className="text-sm font-semibold" style={{ color: ACCENT_INK }}>
                          {result.negativeCount}
                        </strong>{' '}
                        <span style={{ color: MUTED }}>critiques (1–2 ★)</span>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <p className="mt-3 max-w-[68ch] text-sm leading-6" style={{ color: '#3a3a40' }}>
                {result.summary}
              </p>

              {/* Problème n° 1 complet */}
              {result.topProblem && (
                <div className="mt-6 rounded-xl border p-5 sm:p-6" style={{ borderColor: LINE, background: '#fff' }}>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ background: ACCENT_SOFT, color: ACCENT_INK }}
                    >
                      Problème n° 01 · Priorité haute
                    </span>
                    <span className="font-mono text-xs tabular-nums" style={{ color: MUTED }}>
                      {result.topProblem.mentions} avis cités ·{' '}
                      {Math.max(1, Math.round((result.topProblem.mentions / Math.max(1, result.reviewCount)) * 100))} % de l’échantillon
                    </span>
                  </div>

                  <h4 className="mt-2.5 text-lg font-semibold leading-snug tracking-[-0.015em] sm:text-xl" style={{ color: INK }}>
                    {result.topProblem.title}
                  </h4>
                  <p className="mt-2 max-w-[65ch] text-sm leading-6" style={{ color: '#3a3a40' }}>
                    {result.topProblem.rationale}
                  </p>

                  {result.topProblem.quotes.length > 0 && (
                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                      {result.topProblem.quotes.slice(0, 2).map((q, idx) => (
                        <blockquote
                          key={idx}
                          className="rounded-lg border px-3.5 py-3 text-[13px] leading-5"
                          style={{ background: SOFT, borderColor: LINE, color: '#27272a' }}
                        >
                          « {q.text} »
                        </blockquote>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 rounded-lg border px-4 py-3 text-sm leading-6" style={{ borderColor: '#fed7aa', background: '#fffaf6', color: INK }}>
                    <strong className="font-semibold" style={{ color: ACCENT_INK }}>
                      Action recommandée :{' '}
                    </strong>
                    {result.topProblem.action}
                  </div>
                </div>
              )}

              {/* Priorités suivantes verrouillées + ouverture en 1 clic dans l'espace gratuit */}
              <div className="mt-4 rounded-xl p-5 sm:p-6" style={{ background: INK, color: '#f4f4f5' }}>
                {result.lockedProblems.length > 0 && (
                  <ul className="mb-5 divide-y divide-white/10 border-b border-white/10 pb-4">
                    {result.lockedProblems.map((locked, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className="font-mono text-xs text-zinc-400">0{idx + 2}</span>
                          <Lock size={14} className="shrink-0 text-[#ee6018]" aria-hidden="true" />
                          <span className="truncate font-medium text-white">
                            Priorité détectée sur « {locked.theme} »
                          </span>
                        </span>
                        <span className="shrink-0 font-mono text-xs tabular-nums text-zinc-300">
                          {locked.mentions} avis cités
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="max-w-lg">
                    <p className="text-base font-semibold text-white">
                      {result.lockedProblems.length > 0
                        ? `Débloquez les ${totalPriorities} priorités complètes dans votre espace gratuit.`
                        : 'Ouvrez cette analyse directement dans votre espace Qualio.'}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">
                      Ce rapport est déjà pré-chargé : créez votre compte en 10 secondes (sans carte bancaire) pour consulter toutes les preuves et suivre vos prochains avis.
                    </p>
                  </div>
                  <Link
                    href={unlockHref}
                    className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 px-5 text-sm font-semibold text-white transition hover:bg-[#9a3412] ${R_BUTTON} ${FOCUS}`}
                    style={{ background: ACCENT_INK }}
                  >
                    Ouvrir dans mon espace gratuit
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </Reveal>
    </Section>
  )
}
