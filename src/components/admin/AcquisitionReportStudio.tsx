'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowTopRightOnSquareIcon, CheckIcon, ClipboardDocumentIcon, DocumentChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Badge, BTN_PRIMARY, BTN_SECONDARY, FIELD, FOCUS, Panel } from '@/components/admin/ui'
import { BTN_SMALL, BTN_SMALL_ACCENT, plural, postJson, type Notify, type ReportTarget } from '@/components/admin/acquisition-shared'
import { parsePastedReviews, type AppStoreApp } from '@/lib/admin/acquisition-reviews'
import { REPORT_MIN_REVIEWS } from '@/lib/admin/acquisition-report'

type SourceMode = 'app_store' | 'pasted'
type GeneratedResult = {
  url: string
  reviewCount: number
  averageRating: number | null
  draftUpdated: boolean
  companyId: string | null
  problems: Array<{ title: string; mentions: number }>
}

const PASTE_PLATFORMS = ['Trustpilot', 'G2', 'Capterra', 'Google Play', 'Avis Vérifiés'] as const

export function AcquisitionReportStudio({
  target,
  onClearTarget,
  notify,
  refresh,
}: {
  target: ReportTarget | null
  onClearTarget: () => void
  notify: Notify
  refresh: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [source, setSource] = useState<SourceMode>('app_store')

  // App Store state
  const [appQuery, setAppQuery] = useState('')
  const [country, setCountry] = useState('fr')
  const [searchingApps, setSearchingApps] = useState(false)
  const [apps, setApps] = useState<AppStoreApp[]>([])
  const [selectedApp, setSelectedApp] = useState<AppStoreApp | null>(null)

  // Pasted reviews state
  const [subjectName, setSubjectName] = useState('')
  const [sourceLabel, setSourceLabel] = useState<string>('Trustpilot')
  const [sourceUrl, setSourceUrl] = useState('')
  const [rawText, setRawText] = useState('')

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [preparingDraft, setPreparingDraft] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generated, setGenerated] = useState<GeneratedResult | null>(null)

  useEffect(() => {
    if (!generating) {
      setElapsed(0)
      return
    }
    const timer = window.setInterval(() => setElapsed((prev) => prev + 1), 1000)
    return () => window.clearInterval(timer)
  }, [generating])

  // Pré-remplissage intelligent lorsqu'on clique sur « Créer rapport » depuis un prospect
  useEffect(() => {
    if (!target) return
    setGenerated(null)
    setSubjectName(target.companyName)
    containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    if (target.appStoreUrl) {
      setSource('app_store')
      setAppQuery(target.appStoreUrl)
      void runAppSearch(target.appStoreUrl, country)
    } else if (target.externalSource) {
      setSource('pasted')
      setSourceLabel(target.externalSource.label)
      setSourceUrl(target.externalSource.url)
    } else {
      setSource('app_store')
      setAppQuery(target.companyName)
      setSourceUrl('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  const parsedPasted = useMemo(() => parsePastedReviews(rawText), [rawText])
  const missingReviews = Math.max(0, REPORT_MIN_REVIEWS - parsedPasted.length)

  async function runAppSearch(queryValue: string, countryCode: string) {
    const trimmed = queryValue.trim()
    if (trimmed.length < 2) return
    setSearchingApps(true)
    const { ok, data } = await postJson('/api/admin/acquisition/app-search', { query: trimmed, country: countryCode }, 15_000)
    setSearchingApps(false)
    if (!ok) return notify('error', data.error ?? 'Recherche App Store indisponible.')
    const list = (data.apps ?? []) as AppStoreApp[]
    setApps(list)
    setSelectedApp(list[0] ?? null)
    if (!list.length) notify('info', 'Aucune application trouvée sur l’App Store pour cette requête. Utilise l’onglet « Copier-coller » pour Trustpilot, G2 ou Capterra.')
  }

  async function generateReport(event: React.FormEvent) {
    event.preventDefault()
    if (source === 'app_store' && !selectedApp) return
    if (source === 'pasted' && (parsedPasted.length < REPORT_MIN_REVIEWS || !subjectName.trim())) return

    setGenerating(true)
    setGenerated(null)
    const payload =
      source === 'app_store' && selectedApp
        ? {
            source: 'app_store',
            appId: selectedApp.id,
            appName: target?.companyName || selectedApp.name,
            appUrl: selectedApp.url,
            country,
            companyId: target?.companyId ?? null,
          }
        : {
            source: 'pasted',
            subjectName: subjectName.trim(),
            sourceLabel: sourceLabel.trim() || 'publics',
            sourceUrl: sourceUrl.trim(),
            text: rawText,
            companyId: target?.companyId ?? null,
          }

    const { ok, data } = await postJson('/api/admin/acquisition/reports', payload, 95_000)
    setGenerating(false)
    if (!ok) return notify('error', data.error ?? 'La création du rapport a échoué.')

    const result: GeneratedResult = {
      url: data.url,
      reviewCount: data.reviewCount,
      averageRating: data.averageRating ?? null,
      draftUpdated: Boolean(data.draftUpdated),
      companyId: target?.companyId ?? null,
      problems: data.problems ?? [],
    }
    setGenerated(result)
    refresh()
    notify(
      'success',
      result.draftUpdated
        ? `Rapport prêt (${result.reviewCount} avis) et brouillon mis à jour avec l’accroche personnalisée.`
        : `Rapport prêt sur ${result.reviewCount} avis publics.`,
    )
  }

  async function copyReportUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      notify('info', url)
    }
  }

  async function prepareDraftWithReport() {
    if (!generated?.companyId) return
    setPreparingDraft(true)
    const { ok, data } = await postJson('/api/admin/acquisition/prepare', { companyId: generated.companyId })
    setPreparingDraft(false)
    if (!ok) return notify('error', data.error ?? 'Impossible de préparer le brouillon.')
    refresh()
    if (data.drafted) notify('success', 'Brouillon personnalisé créé avec le lien /rapport.', 'drafts')
    else notify('info', data.reason ?? 'Vérifie l’adresse email du prospect dans « À contacter ».')
  }

  return (
    <div ref={containerRef} className="scroll-mt-24">
      <Panel
        id="studio-rapport"
        title="Studio Rapport « Valeur d’abord » (/rapport/[token])"
        description="Analyse les avis publics d’un prospect (App Store en 1 clic, ou avis collés depuis Trustpilot, G2, Capterra, Google Play) pour envoyer une preuve concrète avant toute demande."
        action={
          target ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">Cible : {target.companyName}</Badge>
              <button type="button" onClick={onClearTarget} className={BTN_SMALL}>
                Détacher
              </button>
            </div>
          ) : undefined
        }
      >
        <div role="tablist" aria-label="Source des avis publics" className="mb-5 flex flex-wrap gap-1.5 border-b border-gray-200/80 dark:border-white/[0.06] pb-3">
          <button
            type="button"
            role="tab"
            aria-selected={source === 'app_store'}
            onClick={() => setSource('app_store')}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors duration-150 ${FOCUS} ${
              source === 'app_store'
                ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
            }`}
          >
            App Store (automatique)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={source === 'pasted'}
            onClick={() => setSource('pasted')}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors duration-150 ${FOCUS} ${
              source === 'pasted'
                ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
            }`}
          >
            Trustpilot · G2 · Capterra · Play (coller)
          </button>
        </div>

        {source === 'app_store' ? (
          <form onSubmit={generateReport} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_7.5rem_auto]">
              <div>
                <label htmlFor="app-store-query" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Nom de l’application ou lien App Store
                </label>
                <input
                  id="app-store-query"
                  value={appQuery}
                  onChange={(e) => setAppQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void runAppSearch(appQuery, country)
                    }
                  }}
                  placeholder="Ex. Pennylane, Swile, ou https://apps.apple.com/fr/app/…/id…"
                  className={FIELD}
                />
              </div>
              <div>
                <label htmlFor="app-store-country" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Boutique
                </label>
                <select
                  id="app-store-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={FIELD}
                >
                  <option value="fr">France (FR)</option>
                  <option value="be">Belgique (BE)</option>
                  <option value="ch">Suisse (CH)</option>
                  <option value="ca">Canada (CA)</option>
                  <option value="us">États-Unis (US)</option>
                  <option value="gb">Royaume-Uni (UK)</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  disabled={searchingApps || appQuery.trim().length < 2}
                  onClick={() => void runAppSearch(appQuery, country)}
                  className={`${BTN_SECONDARY} w-full sm:w-auto gap-2`}
                >
                  <MagnifyingGlassIcon className="h-4 w-4 shrink-0" aria-hidden />
                  {searchingApps ? 'Recherche…' : 'Chercher l’app'}
                </button>
              </div>
            </div>

            {apps.length > 0 && (
              <div role="radiogroup" aria-label="Applications trouvées" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {apps.map((app) => {
                  const active = selectedApp?.id === app.id
                  return (
                    <button
                      key={app.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelectedApp(app)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all duration-150 ${FOCUS} ${
                        active
                          ? 'border-[#ee6018] bg-[#ee6018]/[0.07]'
                          : 'border-gray-200/80 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.18]'
                      }`}
                    >
                      {app.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={app.icon} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-black/5" />
                      ) : (
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gray-100 dark:bg-white/[0.08] font-mono text-xs">iOS</span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{app.name}</span>
                        <span className="block truncate text-xs text-gray-500 dark:text-zinc-400">{app.seller}</span>
                        <span className="mt-0.5 block font-mono text-[11px] tabular-nums text-gray-600 dark:text-zinc-400">
                          {app.rating != null ? `${app.rating} ★` : 'Sans note'}
                          {app.ratingCount != null ? ` · ${app.ratingCount.toLocaleString('fr-FR')} notes` : ''}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Récupère jusqu’aux 300 avis francophones les plus récents du flux public Apple (minimum {REPORT_MIN_REVIEWS} avis écrits).
              </p>
              <button type="submit" disabled={generating || !selectedApp} className={`${BTN_PRIMARY} gap-2`}>
                <DocumentChartBarIcon className="h-4 w-4 shrink-0" aria-hidden />
                {generating ? `Synthèse IA en cours… ${elapsed} s` : selectedApp ? `Analyser les avis de ${selectedApp.name}` : 'Choisis d’abord une app'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={generateReport} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="paste-subject" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Entreprise ou produit analysé
                </label>
                <input
                  id="paste-subject"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  maxLength={120}
                  placeholder="Ex. PayFit, Asphalte…"
                  className={FIELD}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Plateforme source
                </label>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {PASTE_PLATFORMS.map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => setSourceLabel(platform)}
                      className={`min-h-9 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${FOCUS} ${
                        sourceLabel === platform
                          ? 'border-[#ee6018]/60 bg-[#ee6018]/[0.1] text-[#c2410c] dark:text-[#ffb08a]'
                          : 'border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label htmlFor="paste-url" className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                    Lien public de la page <span className="font-normal text-gray-500 dark:text-zinc-500">(optionnel)</span>
                  </label>
                  {sourceUrl && /^https?:\/\//i.test(sourceUrl) && (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-[#c2410c] dark:text-[#ff9a66] hover:underline"
                    >
                      Ouvrir <ArrowTopRightOnSquareIcon className="h-3 w-3" aria-hidden />
                    </a>
                  )}
                </div>
                <input
                  id="paste-url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://fr.trustpilot.com/review/…"
                  className={`${FIELD} font-mono text-xs`}
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                <label htmlFor="paste-reviews" className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Avis copiés (sépare chaque avis par une ligne vide ; une ligne « 2/5 » ou « ★★☆☆☆ » fixe la note)
                </label>
                <span
                  aria-live="polite"
                  className={`font-mono text-xs tabular-nums ${
                    parsedPasted.length >= REPORT_MIN_REVIEWS
                      ? 'text-emerald-700 dark:text-[#a0ca92]'
                      : 'text-gray-500 dark:text-zinc-400'
                  }`}
                >
                  {plural(parsedPasted.length, 'avis reconnu', 'avis reconnus')}
                  {missingReviews > 0 ? ` · encore ${missingReviews} min.` : ' · prêt'}
                </span>
              </div>
              <textarea
                id="paste-reviews"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                placeholder={'2/5\nL’export comptable plante dès qu’on dépasse 200 lignes, obligé de découper le CSV à la main.\n\n1/5\nImpossible d’exporter le grand livre en fin de mois sans erreur timeout…'}
                className={`${FIELD} py-2.5 text-sm leading-6`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Les emails et numéros de téléphone éventuellement présents dans les avis sont masqués automatiquement.
              </p>
              <button
                type="submit"
                disabled={generating || parsedPasted.length < REPORT_MIN_REVIEWS || !subjectName.trim()}
                className={`${BTN_PRIMARY} gap-2`}
              >
                <DocumentChartBarIcon className="h-4 w-4 shrink-0" aria-hidden />
                {generating ? `Synthèse IA en cours… ${elapsed} s` : `Créer le rapport (${parsedPasted.length} avis)`}
              </button>
            </div>
          </form>
        )}

        {generated && (
          <div className="mt-5 border-t border-gray-200/80 dark:border-white/[0.08] pt-5" aria-live="polite">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="success">Rapport en ligne · {generated.reviewCount} avis</Badge>
                  {generated.draftUpdated && <Badge tone="accent">Brouillon mis à jour automatiquement</Badge>}
                </div>
                <p className="mt-2 font-mono text-xs text-gray-600 dark:text-zinc-300 break-all">{generated.url}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void copyReportUrl(generated.url)} className={BTN_SMALL}>
                  {copied ? <CheckIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-[#a0ca92]" aria-hidden /> : <ClipboardDocumentIcon className="h-3.5 w-3.5" aria-hidden />}
                  {copied ? 'Lien copié' : 'Copier le lien'}
                </button>
                <a href={`${generated.url}?apercu=1`} target="_blank" rel="noreferrer" className={BTN_SMALL}>
                  Aperçu (sans compter de vue)
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden />
                </a>
                {generated.draftUpdated ? (
                  <button type="button" onClick={() => notify('info', 'Ouverture du brouillon mis à jour.', 'drafts')} className={BTN_SMALL_ACCENT}>
                    Voir le brouillon
                  </button>
                ) : generated.companyId ? (
                  <button type="button" disabled={preparingDraft} onClick={() => void prepareDraftWithReport()} className={BTN_SMALL_ACCENT}>
                    {preparingDraft ? 'Rédaction…' : 'Rédiger l’email avec ce rapport'}
                  </button>
                ) : null}
              </div>
            </div>

            {generated.problems.length > 0 && (
              <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                {generated.problems.map((problem, index) => (
                  <li key={index} className="rounded-xl border border-gray-200/80 dark:border-white/[0.06] bg-gray-50/70 dark:bg-[#101010]/60 p-3.5">
                    <span className="font-mono text-[11px] tabular-nums text-gray-500 dark:text-zinc-400">
                      0{index + 1} · {problem.mentions} avis
                    </span>
                    <p className="mt-1 text-xs font-semibold leading-5 text-gray-900 dark:text-[#eeeeee]">{problem.title}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </Panel>
    </div>
  )
}

