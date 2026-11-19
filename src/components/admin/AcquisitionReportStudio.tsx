'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowTopRightOnSquareIcon, CheckIcon, ClipboardDocumentIcon, DocumentChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Badge, BTN_PRIMARY, BTN_SECONDARY, FIELD, FOCUS, Panel } from '@/components/admin/ui'
import { BTN_SMALL, BTN_SMALL_ACCENT, plural, postJson, type Notify, type ReportTarget } from '@/components/admin/acquisition-shared'
import { GENERIC_EMAIL } from '@/lib/admin/acquisition-draft'
import { parsePastedReviews, type AppStoreApp } from '@/lib/admin/acquisition-reviews'
import { REPORT_MIN_REVIEWS } from '@/lib/admin/acquisition-report'
import { AcquisitionBatchAppStore } from '@/components/admin/AcquisitionBatchAppStore'

type SourceMode = 'app_store' | 'batch' | 'pasted'
type GeneratedContact = {
  id: string
  email: string
  fullName: string | null
  emailStatus: string
  emailSourceUrl: string | null
  isGeneric: boolean
}
type InlineDraft = {
  id: string
  subject: string
  body: string
  savedSubject: string
  savedBody: string
  sent: boolean
}
type GeneratedResult = {
  id: string
  url: string
  subjectName: string
  reviewCount: number
  averageRating: number | null
  draftUpdated: boolean
  companyId: string | null
  contact: GeneratedContact | null
  problems: Array<{ title: string; mentions: number }>
}

const CONTACT_STATUS_META: Record<string, { label: string; tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral' }> = {
  verified: { label: 'Vérifié (MX)', tone: 'success' },
  public: { label: 'Public', tone: 'info' },
  unverified: { label: 'Non vérifié', tone: 'warning' },
  invalid: { label: 'Invalide', tone: 'danger' },
  suppressed: { label: 'Exclu', tone: 'danger' },
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
  const [selectedApps, setSelectedApps] = useState<AppStoreApp[]>([])

  // Pasted reviews state
  const [subjectName, setSubjectName] = useState('')
  const [sourceLabel, setSourceLabel] = useState<string>('Trustpilot')
  const [sourceUrl, setSourceUrl] = useState('')
  const [rawText, setRawText] = useState('')

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [generatedList, setGeneratedList] = useState<GeneratedResult[]>([])

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
    setGeneratedList([])
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
    setSelectedApps(list[0] ? [list[0]] : [])
    if (!list.length) notify('info', 'Aucune application trouvée sur l’App Store pour cette requête. Utilise l’onglet « Copier-coller » pour Trustpilot, G2 ou Capterra.')
  }

  function toggleSelectedApp(app: AppStoreApp) {
    setSelectedApps((prev) => {
      if (prev.some((item) => item.id === app.id)) {
        return prev.filter((item) => item.id !== app.id)
      }
      if (prev.length >= 3) {
        notify('info', 'Tu peux sélectionner jusqu’à 3 applications à la fois.')
        return prev
      }
      return [...prev, app]
    })
  }

  async function generateReport(event: React.FormEvent) {
    event.preventDefault()
    if (source === 'app_store' && selectedApps.length === 0) return
    if (source === 'pasted' && (parsedPasted.length < REPORT_MIN_REVIEWS || !subjectName.trim())) return

    setGenerating(true)
    setGeneratedList([])

    if (source === 'app_store') {
      const outcomes = await Promise.all(
        selectedApps.map(async (app) => {
          const appName = selectedApps.length === 1 && target?.companyName ? target.companyName : app.name
          const { ok, data } = await postJson(
            '/api/admin/acquisition/reports',
            {
              source: 'app_store',
              appId: app.id,
              appName,
              appUrl: app.url,
              sellerUrl: app.sellerUrl ?? null,
              country,
              companyId: selectedApps.length === 1 ? (target?.companyId ?? null) : null,
            },
            95_000,
          )
          if (!ok) return { ok: false as const, appName, error: data.error ?? 'La création du rapport a échoué.' }
          const result: GeneratedResult = {
            id: data.id,
            url: data.url,
            subjectName: appName,
            reviewCount: data.reviewCount,
            averageRating: data.averageRating ?? null,
            draftUpdated: Boolean(data.draftUpdated),
            companyId: data.companyId ?? (selectedApps.length === 1 ? (target?.companyId ?? null) : null),
            contact: data.contact ?? null,
            problems: data.problems ?? [],
          }
          return { ok: true as const, result }
        }),
      )
      setGenerating(false)
      const successes = outcomes.filter((o): o is { ok: true; result: GeneratedResult } => o.ok).map((o) => o.result)
      const failures = outcomes.filter((o): o is { ok: false; appName: string; error: string } => !o.ok)
      setGeneratedList(successes)
      if (successes.length > 0) refresh()
      if (failures.length > 0 && successes.length === 0) {
        return notify('error', failures.map((f) => `${f.appName} : ${f.error}`).join(' · '))
      }
      if (failures.length > 0) {
        notify('info', `${successes.length} rapport(s) prêt(s). Échec pour ${failures.map((f) => f.appName).join(', ')}.`)
      } else {
        notify(
          'success',
          successes.length === 1
            ? successes[0].draftUpdated
              ? `Rapport prêt (${successes[0].reviewCount} avis) et brouillon mis à jour.`
              : `Rapport prêt sur ${successes[0].reviewCount} avis publics.`
            : `${successes.length} rapports prêts en parallèle.`,
        )
      }
      return
    }

    const { ok, data } = await postJson(
      '/api/admin/acquisition/reports',
      {
        source: 'pasted',
        subjectName: subjectName.trim(),
        sourceLabel: sourceLabel.trim() || 'publics',
        sourceUrl: sourceUrl.trim(),
        text: rawText,
        companyId: target?.companyId ?? null,
      },
      95_000,
    )
    setGenerating(false)
    if (!ok) return notify('error', data.error ?? 'La création du rapport a échoué.')

    const result: GeneratedResult = {
      id: data.id,
      url: data.url,
      subjectName: subjectName.trim(),
      reviewCount: data.reviewCount,
      averageRating: data.averageRating ?? null,
      draftUpdated: Boolean(data.draftUpdated),
      companyId: data.companyId ?? target?.companyId ?? null,
      contact: data.contact ?? null,
      problems: data.problems ?? [],
    }
    setGeneratedList([result])
    refresh()
    notify(
      'success',
      result.draftUpdated
        ? `Rapport prêt (${result.reviewCount} avis) et brouillon mis à jour avec l’accroche personnalisée.`
        : `Rapport prêt sur ${result.reviewCount} avis publics.`,
    )
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
        {/* Raccourcis Cibles Semaine 1 */}
        <div className="mb-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 dark:border-orange-500/10">
          <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-zinc-200">
            🎯 Cibles prioritaires Semaine 1 (charger en 1 clic) :
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { name: 'ScanTicket', type: 'app_store' as const, id: '454155575' },
              { name: 'Qlower', type: 'app_store' as const, id: '1544489613' },
              { name: 'Mes notes de frais', type: 'app_store' as const, id: '1198308993' },
              { name: 'ATTIX', type: 'app_store' as const, id: '6748462097' },
              { name: 'Easy Quittance', type: 'app_store' as const, id: '1667273455' },
              { name: 'Digidop', type: 'pasted' as const, label: 'Trustpilot & avis clients', url: 'https://fr.trustpilot.com/review/digidop.fr' },
              { name: 'Ouiflow', type: 'pasted' as const, label: 'Retours projets clients', url: 'https://ouiflow.io' },
              { name: 'Studio HB', type: 'pasted' as const, label: 'Avis clients & partenaires', url: 'https://www.studio-hb.com' },
              { name: 'Miyette', type: 'pasted' as const, label: 'Trustpilot', url: 'https://fr.trustpilot.com/review/miyette-paris.com' },
              { name: 'Flotte', type: 'pasted' as const, label: 'Trustpilot', url: 'https://fr.trustpilot.com/review/flotte.fr' },
            ].map((shortcut) => (
              <button
                key={shortcut.name}
                type="button"
                onClick={() => {
                  setGeneratedList([])
                  setSubjectName(shortcut.name)
                  if (shortcut.type === 'app_store') {
                    setSource('app_store')
                    setAppQuery(shortcut.id)
                    void runAppSearch(shortcut.id, country)
                  } else {
                    setSource('pasted')
                    setSourceLabel(shortcut.label)
                    setSourceUrl(shortcut.url)
                  }
                }}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-2xs hover:border-orange-500 hover:text-orange-600 dark:border-white/[0.08] dark:bg-[#16181E] dark:text-zinc-300 dark:hover:border-orange-400 dark:hover:text-orange-400"
              >
                {shortcut.name}
              </button>
            ))}
          </div>
        </div>

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
            aria-selected={source === 'batch'}
            onClick={() => setSource('batch')}
            className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors duration-150 ${FOCUS} ${
              source === 'batch'
                ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
            }`}
          >
            Lot 10–20 apps (3,4–4,4 ★)
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

        {source === 'batch' ? (
          <AcquisitionBatchAppStore country={country} onCountryChange={setCountry} notify={notify} refresh={refresh} />
        ) : source === 'app_store' ? (
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
                  <option value="ci">Côte d’Ivoire (CI)</option>
                  <option value="sn">Sénégal (SN)</option>
                  <option value="ma">Maroc (MA)</option>
                  <option value="cm">Cameroun (CM)</option>
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
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
                  <span>Clique pour sélectionner jusqu’à 3 applications :</span>
                  <span className="font-mono tabular-nums">{selectedApps.length} / 3 sélectionnée{selectedApps.length > 1 ? 's' : ''}</span>
                </div>
                <div role="group" aria-label="Applications trouvées" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {apps.map((app) => {
                    const active = selectedApps.some((item) => item.id === app.id)
                    return (
                      <button
                        key={app.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleSelectedApp(app)}
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
                        {active && <CheckIcon className="h-4 w-4 shrink-0 text-[#c2410c] dark:text-[#ffb08a]" aria-hidden />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Récupère jusqu’aux 300 avis les plus récents du flux Apple (minimum {REPORT_MIN_REVIEWS} avis écrits).
              </p>
              <button type="submit" disabled={generating || selectedApps.length === 0} className={`${BTN_PRIMARY} gap-2`}>
                <DocumentChartBarIcon className="h-4 w-4 shrink-0" aria-hidden />
                {generating
                  ? `Synthèse IA en cours… ${elapsed} s`
                  : selectedApps.length === 1
                    ? `Analyser les avis de ${selectedApps[0].name}`
                    : selectedApps.length > 1
                      ? `Analyser les ${selectedApps.length} apps sélectionnées`
                      : 'Choisis d’abord une app'}
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

        {generatedList.length > 0 && (
          <div className="mt-5 space-y-6 border-t border-gray-200/80 dark:border-white/[0.08] pt-5" aria-live="polite">
            {generatedList.map((item) => (
              <GeneratedReportCard key={item.id} initial={item} notify={notify} refresh={refresh} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

function GeneratedReportCard({
  initial,
  notify,
  refresh,
}: {
  initial: GeneratedResult
  notify: Notify
  refresh: () => void
}) {
  const [generated, setGenerated] = useState<GeneratedResult>(initial)
  const [copied, setCopied] = useState(false)
  const [preparingDraft, setPreparingDraft] = useState(false)
  const [sendingDraft, setSendingDraft] = useState(false)
  const [draft, setDraft] = useState<InlineDraft | null>(null)
  const [editingContact, setEditingContact] = useState(false)
  const [contactEmail, setContactEmail] = useState(initial.contact?.email ?? '')
  const [contactFullName, setContactFullName] = useState(initial.contact?.fullName ?? '')
  const [savingContact, setSavingContact] = useState(false)

  async function copyReportUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      notify('info', url)
    }
  }

  async function saveContact(event: React.FormEvent) {
    event.preventDefault()
    if (!contactEmail.trim()) return
    setSavingContact(true)
    const { ok, data } = await postJson('/api/admin/acquisition/contacts', {
      companyId: generated.companyId ?? undefined,
      companyName: generated.subjectName,
      reportId: generated.id,
      contactId: generated.contact?.id,
      email: contactEmail.trim(),
      fullName: contactFullName.trim() || undefined,
    })
    setSavingContact(false)
    if (!ok) return notify('error', data.error ?? 'Impossible d’enregistrer le contact.')
    const saved = data.contact
    const updatedContact: GeneratedContact = {
      id: saved.id,
      email: saved.email,
      fullName: saved.full_name ?? null,
      emailStatus: saved.email_status,
      emailSourceUrl: saved.email_source_url ?? generated.contact?.emailSourceUrl ?? null,
      isGeneric: GENERIC_EMAIL.test(saved.email),
    }
    setGenerated((prev) => ({ ...prev, companyId: data.companyId ?? prev.companyId, contact: updatedContact }))
    setEditingContact(false)
    setDraft(null)
    refresh()
    notify('success', 'Contact enregistré.')
  }

  async function prepareDraftWithReport() {
    if (!generated.companyId) return
    setPreparingDraft(true)
    const { ok, data } = await postJson('/api/admin/acquisition/prepare', { companyId: generated.companyId })
    setPreparingDraft(false)
    if (!ok) return notify('error', data.error ?? 'Impossible de préparer le brouillon.')
    refresh()
    if (data.message) {
      setDraft({
        id: data.message.id,
        subject: data.message.subject,
        body: data.message.body,
        savedSubject: data.message.subject,
        savedBody: data.message.body,
        sent: false,
      })
      notify('success', data.drafted ? 'Brouillon prêt à relire.' : 'Brouillon existant chargé.')
    } else {
      notify('info', data.reason ?? 'Vérifie l’adresse email du prospect dans « À contacter ».')
    }
  }

  async function sendInlineDraft() {
    if (!draft || draft.sent) return
    setSendingDraft(true)
    if (draft.subject.trim() !== draft.savedSubject || draft.body.trim() !== draft.savedBody) {
      const saveRes = await postJson('/api/admin/acquisition/messages/update', {
        id: draft.id,
        subject: draft.subject,
        body: draft.body,
      })
      if (!saveRes.ok) {
        setSendingDraft(false)
        return notify('error', saveRes.data.error ?? 'Impossible d’enregistrer les modifications.')
      }
    }
    const { ok, data } = await postJson('/api/admin/acquisition/send', { messageIds: [draft.id] })
    setSendingDraft(false)
    if (!ok) return notify('error', data.error ?? 'Envoi impossible.')
    if (data.sent > 0) {
      setDraft((prev) => (prev ? { ...prev, sent: true, savedSubject: prev.subject, savedBody: prev.body } : prev))
      refresh()
      notify('success', 'Email envoyé.')
    } else if (data.skippedReasons?.length) {
      notify('error', data.skippedReasons.join(', '))
    } else {
      notify('error', 'L’envoi a échoué ou a été ignoré.')
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200/80 dark:border-white/[0.08] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">{generated.subjectName} · {generated.reviewCount} avis</Badge>
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
          {generated.companyId && generated.contact && !draft && (
            <button type="button" disabled={preparingDraft} onClick={() => void prepareDraftWithReport()} className={BTN_SMALL_ACCENT}>
              {preparingDraft ? 'Préparation…' : 'Préparer l’email'}
            </button>
          )}
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

      {/* Bloc Contact */}
      <div className="mt-4 rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-gray-50/70 dark:bg-[#101010]/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
            Contact
          </span>
          {generated.contact && !editingContact && (
            <button
              type="button"
              onClick={() => {
                setContactEmail(generated.contact?.email ?? '')
                setContactFullName(generated.contact?.fullName ?? '')
                setEditingContact(true)
              }}
              className={BTN_SMALL}
            >
              Modifier
            </button>
          )}
        </div>

        {editingContact || !generated.contact ? (
          <form onSubmit={saveContact} className="mt-2.5 space-y-3">
            {!generated.contact && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Contact introuvable automatiquement. Ajoute l’adresse manuellement :
              </p>
            )}
            <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="prenom@editeur.com"
                aria-label="Adresse email du contact"
                className={FIELD}
              />
              <input
                type="text"
                value={contactFullName}
                onChange={(e) => setContactFullName(e.target.value)}
                placeholder="Prénom Nom (optionnel)"
                aria-label="Nom du contact"
                className={FIELD}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={savingContact || !contactEmail.trim()} className={BTN_PRIMARY}>
                  {savingContact ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                {generated.contact && (
                  <button type="button" onClick={() => setEditingContact(false)} className={BTN_SECONDARY}>
                    Annuler
                  </button>
                )}
              </div>
            </div>
          </form>
        ) : (
          <div className="mt-2 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-medium text-gray-900 dark:text-[#eeeeee]">
                {generated.contact.email}
              </span>
              {generated.contact.fullName && (
                <span className="text-xs text-gray-600 dark:text-zinc-300">({generated.contact.fullName})</span>
              )}
              <Badge tone={(CONTACT_STATUS_META[generated.contact.emailStatus] ?? CONTACT_STATUS_META.unverified).tone}>
                {(CONTACT_STATUS_META[generated.contact.emailStatus] ?? { label: generated.contact.emailStatus }).label}
              </Badge>
            </div>
            {generated.contact.emailSourceUrl ? (
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Source :{' '}
                <a
                  href={generated.contact.emailSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono underline hover:text-gray-800 dark:hover:text-zinc-200 break-all"
                >
                  {generated.contact.emailSourceUrl}
                </a>
              </p>
            ) : (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Source manquante — clique sur « Modifier » puis « Enregistrer » pour rattacher le site avant l’envoi.
              </p>
            )}
            {generated.contact.isGeneric && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Boîte générique — une adresse nominative augmente les chances de réponse.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Éditeur d'email en ligne (aucun envoi sans clic) */}
      {draft && (
        <div className="mt-4 rounded-xl border border-gray-200/80 dark:border-white/[0.08] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-zinc-400">
              Email prêt à relire
            </span>
            {draft.sent && <Badge tone="success">Email envoyé</Badge>}
          </div>
          <div>
            <label htmlFor={`inline-draft-subject-${generated.id}`} className="mb-1 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
              Objet
            </label>
            <input
              id={`inline-draft-subject-${generated.id}`}
              value={draft.subject}
              disabled={draft.sent}
              maxLength={200}
              onChange={(e) => setDraft((prev) => (prev ? { ...prev, subject: e.target.value } : prev))}
              className={FIELD}
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label htmlFor={`inline-draft-body-${generated.id}`} className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Corps du message
              </label>
              {(() => {
                const words = draft.body.trim() ? draft.body.trim().split(/\s+/).length : 0
                return (
                  <span className={`font-mono text-[11px] tabular-nums ${words > 110 ? 'text-amber-700 dark:text-amber-300' : 'text-gray-500 dark:text-zinc-400'}`}>
                    {words} / 110 mots
                  </span>
                )
              })()}
            </div>
            <textarea
              id={`inline-draft-body-${generated.id}`}
              value={draft.body}
              disabled={draft.sent}
              rows={10}
              maxLength={5000}
              onChange={(e) => setDraft((prev) => (prev ? { ...prev, body: e.target.value } : prev))}
              className={`${FIELD} py-2.5 text-sm leading-6`}
            />
          </div>
          {!draft.sent && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Le pied de page légal et le lien de désinscription sont ajoutés automatiquement à l’envoi.
              </p>
              <button
                type="button"
                disabled={sendingDraft || !draft.subject.trim() || !draft.body.trim()}
                onClick={() => void sendInlineDraft()}
                className={BTN_PRIMARY}
              >
                {sendingDraft ? 'Envoi en cours…' : 'Envoyer'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

