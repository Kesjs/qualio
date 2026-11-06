'use client'

import { useEffect, useMemo, useState } from 'react'
import { BTN_PRIMARY, BTN_SECONDARY, FIELD, FOCUS, Panel } from '@/components/admin/ui'
import { AdminSelect } from '@/components/admin/AdminSelect'
import { CityAutocomplete } from '@/components/admin/CityAutocomplete'
import { parseImport } from '@/lib/admin/acquisition-csv'
import { OSM_CATEGORIES } from '@/lib/admin/acquisition-osm'
import { APP_STORE_COUNTRIES } from '@/lib/admin/acquisition-reviews'
import { CHECKBOX, plural, postJson, type Notify } from '@/components/admin/acquisition-shared'
import { DevicePhoneMobileIcon, SparklesIcon } from '@heroicons/react/20/solid'

type Mode = 'ai' | 'apps' | 'domains' | 'csv' | 'discover'

type InsertedCompany = {
  id: string
  name: string
  domain: string
}

type RunSummary = {
  kept: number
  withEmail: number
  withReviews: number
  discardedEmpty: number
  duplicates: number
  channelLabel: string
}

const AI_TARGET_PRESETS = [
  {
    label: 'Agences UX/UI & Produit',
    value:
      'Studios et agences web, UX/UI, produit ou mobile francophones (3 à 35 personnes) qui conçoivent et font évoluer des applications, SaaS ou sites sur-mesure pour leurs clients. Exclure les ESN en régie et agences purement RP/pub.',
  },
  {
    label: 'SaaS B2B FR (G2 / Capterra)',
    value:
      'Éditeurs de logiciels SaaS B2B francophones indépendants (5 à 100 personnes) qui ont des avis publics sur G2, Capterra, Trustpilot ou App Store et une équipe produit active.',
  },
  {
    label: 'Marques D2C & Trustpilot',
    value:
      'Marques e-commerce et D2C francophones indépendantes (mode, beauté, maison, alimentation, équipement) qui collectent beaucoup d’avis sur Trustpilot ou Avis Vérifiés.',
  },
  {
    label: 'Agences Shopify & E-commerce',
    value:
      'Agences spécialisées Shopify, PrestaShop et optimisation de conversion (CRO) francophones qui accompagnent des marques e-commerce sur leurs retours clients et leur UX.',
  },
  {
    label: 'Logiciels métiers PME',
    value:
      'Logiciels SaaS verticaux francophones (comptabilité, RH, immobilier, BTP, santé, restauration, logistique) utilisés au quotidien par des TPE/PME et recevant des avis utilisateurs.',
  },
]

const APP_SECTOR_PRESETS = [
  { label: 'Facturation & Compta', query: 'facturation, comptabilité, devis entrepreneur' },
  { label: 'RH & Notes de frais', query: 'ressources humaines, note de frais, congés paie' },
  { label: 'Immobilier & Gestion', query: 'immobilier, gestion locative, syndic copropriété' },
  { label: 'Caisse & Restauration', query: 'caisse enregistreuse, commande restaurant, réservation' },
  { label: 'Beauté & Shopping D2C', query: 'cosmétique bio, mode responsable, soin beauté' },
  { label: 'Sport & Bien-être', query: 'coaching sportif, nutrition suivi, méditation' },
]

export function AcquisitionAdd({ notify, refresh }: { notify: Notify; refresh: () => void }) {
  const [mode, setMode] = useState<Mode>('ai')

  // IA Web Discovery State
  const [aiTarget, setAiTarget] = useState(AI_TARGET_PRESETS[0].value)
  const [aiLocation, setAiLocation] = useState('')
  const [aiLimit, setAiLimit] = useState('20')

  // App Store Verified Reviews Discovery State
  const [appQuery, setAppQuery] = useState(APP_SECTOR_PRESETS[0].query)
  const [appCountry, setAppCountry] = useState('fr')
  const [appMinReviews, setAppMinReviews] = useState('15')
  const [appMaxRating, setAppMaxRating] = useState('5')
  const [appLimit, setAppLimit] = useState('20')

  // Shared Auto-Qualification State
  const [onlyActionable, setOnlyActionable] = useState(true)
  const [busyStage, setBusyStage] = useState<
    | null
    | { phase: 'discover'; label: string }
    | { phase: 'scan'; done: number; total: number; withEmail: number; withReviews: number }
  >(null)
  const [lastSummary, setLastSummary] = useState<RunSummary | null>(null)

  // OpenStreetMap State
  const [city, setCity] = useState('')
  const [category, setCategory] = useState<string>(OSM_CATEGORIES[0].value)
  const [limit, setLimit] = useState('50')

  // CSV & Domains State
  const [domains, setDomains] = useState('')
  const [csv, setCsv] = useState('')
  const [verified, setVerified] = useState(false)

  const busy = busyStage !== null
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!busy) {
      setElapsed(0)
      return
    }
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [busy])

  const parsed = useMemo(() => parseImport(csv), [csv])

  /**
   * Scanne automatiquement en parallèle contrôlé (par 3) chaque prospect nouvellement inséré
   * afin d'extraire ses emails publics, son dirigeant et ses fiches d'avis (Trustpilot, G2, App Store…),
   * puis écarte les coquilles vides si `filterEmpty` est activé.
   */
  async function qualifyInsertedCompanies(
    inserted: InsertedCompany[],
    options: { filterEmpty: boolean; duplicates: number; channelLabel: string },
  ) {
    if (!inserted.length) return

    let done = 0
    let withEmail = 0
    let withReviews = 0
    const emptyIds: string[] = []

    setBusyStage({ phase: 'scan', done: 0, total: inserted.length, withEmail: 0, withReviews: 0 })

    const concurrency = 3
    let cursor = 0

    async function worker() {
      while (cursor < inserted.length) {
        const current = inserted[cursor]
        cursor += 1
        const { ok, data } = await postJson('/api/admin/acquisition/scan', { companyId: current.id }, 28_000)
        const emailsCount = ok ? Number(data.emails ?? 0) : 0
        const reviewsCount = ok && Array.isArray(data.reviewSources) ? data.reviewSources.length : 0

        if (emailsCount > 0) withEmail += 1
        if (reviewsCount > 0) withReviews += 1
        if (emailsCount === 0 && reviewsCount === 0) {
          emptyIds.push(current.id)
        }

        done += 1
        setBusyStage({ phase: 'scan', done, total: inserted.length, withEmail, withReviews })
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, inserted.length) }, () => worker()))

    let discardedEmpty = 0
    if (options.filterEmpty && emptyIds.length > 0) {
      const archiveRes = await postJson('/api/admin/acquisition/archive', { companyIds: emptyIds }, 15_000)
      if (archiveRes.ok) {
        discardedEmpty = emptyIds.length
      }
    }

    const kept = inserted.length - discardedEmpty
    const summary: RunSummary = {
      kept,
      withEmail,
      withReviews,
      discardedEmpty,
      duplicates: options.duplicates,
      channelLabel: options.channelLabel,
    }
    setLastSummary(summary)
    refresh()

    if (kept === 0) {
      notify(
        'info',
        `Aucun prospect exploitable retenu (${plural(discardedEmpty, 'site sans email ni avis écarté', 'sites sans email ni avis écartés')}). Essaie un autre secteur ou décoche le filtre strict.`,
      )
      return
    }

    const details = [
      withEmail ? `${withEmail} avec email` : '',
      withReviews ? `${withReviews} avec avis publics` : '',
      discardedEmpty ? `${discardedEmpty} sans-issue écarté(s)` : '',
    ]
      .filter(Boolean)
      .join(' · ')

    notify(
      'success',
      `${plural(kept, 'prospect qualifié prêt', 'prospects qualifiés prêts')} (${details}).`,
      'queue',
    )
  }

  async function discoverWithAi(event: React.FormEvent) {
    event.preventDefault()
    if (!aiTarget.trim() || busy) return
    setLastSummary(null)
    setBusyStage({ phase: 'discover', label: 'Recherche web Google & vérification HTTP des domaines…' })

    try {
      const { ok, data } = await postJson(
        '/api/admin/acquisition/discover-ai',
        {
          target: aiTarget.trim(),
          location: aiLocation.trim(),
          limit: Number(aiLimit),
        },
        65_000,
      )

      if (!ok) {
        return notify('error', data.error ?? 'La découverte IA a échoué.')
      }

      const inserted = (data.insertedCompanies ?? []) as InsertedCompany[]
      const duplicates = Number(data.duplicates ?? data.alreadyKnown ?? 0)

      if (!inserted.length) {
        refresh()
        const msg =
          data.message ??
          (duplicates
            ? `Aucun nouveau prospect (${plural(duplicates, 'entreprise déjà connue', 'entreprises déjà connues')}). Précise un sous-secteur ou une ville.`
            : 'Aucune entreprise active trouvée pour cette cible.')
        return notify('info', msg)
      }

      await qualifyInsertedCompanies(inserted, {
        filterEmpty: onlyActionable,
        duplicates,
        channelLabel: data.provider ? `IA (${data.provider})` : 'Découverte IA',
      })
    } finally {
      setBusyStage(null)
    }
  }

  async function discoverApps(event: React.FormEvent) {
    event.preventDefault()
    if (!appQuery.trim() || busy) return
    setLastSummary(null)
    setBusyStage({ phase: 'discover', label: 'Recherche App Store & contrôle des sites éditeurs…' })

    try {
      const { ok, data } = await postJson(
        '/api/admin/acquisition/discover-apps',
        {
          query: appQuery.trim(),
          country: appCountry,
          limit: Number(appLimit),
          minReviews: Number(appMinReviews),
          maxRating: Number(appMaxRating),
        },
        60_000,
      )

      if (!ok) {
        return notify('error', data.error ?? 'La recherche App Store a échoué.')
      }

      const inserted = (data.insertedCompanies ?? []) as InsertedCompany[]
      const duplicates = Number(data.duplicates ?? 0)

      if (!inserted.length) {
        refresh()
        return notify('info', data.message ?? 'Aucune nouvelle application PME trouvée pour ce mot-clé.')
      }

      // Chaque app trouvée possède déjà une source d'avis App Store vérifiée ; le scan extrait en plus l'email de l'éditeur
      await qualifyInsertedCompanies(inserted, {
        filterEmpty: false,
        duplicates,
        channelLabel: 'App Store (avis vérifiés)',
      })
    } finally {
      setBusyStage(null)
    }
  }

  async function addDomains(event: React.FormEvent) {
    event.preventDefault()
    if (!domains.trim() || busy) return
    setLastSummary(null)
    setBusyStage({ phase: 'discover', label: 'Enregistrement des domaines…' })

    try {
      const { ok, data } = await postJson('/api/admin/acquisition/domain-search', { targets: domains })
      if (!ok) return notify('error', data.error ?? 'L’ajout a échoué.')
      setDomains('')

      const inserted = (data.insertedCompanies ?? []) as InsertedCompany[]
      const duplicates = Number(data.duplicates ?? 0)
      if (!inserted.length) {
        refresh()
        return notify('info', 'Ces domaines sont déjà tous dans ta liste.')
      }

      await qualifyInsertedCompanies(inserted, {
        filterEmpty: false,
        duplicates,
        channelLabel: 'Domaines collés',
      })
    } finally {
      setBusyStage(null)
    }
  }

  async function discoverOsm(event: React.FormEvent) {
    event.preventDefault()
    if (!city.trim() || busy) return
    setLastSummary(null)
    setBusyStage({ phase: 'discover', label: 'Recherche OpenStreetMap…' })
    try {
      const { ok, data } = await postJson('/api/admin/acquisition/discover-osm', {
        city,
        category,
        limit: Number(limit),
      })
      if (!ok) return notify('error', data.error ?? 'La recherche a échoué.')
      refresh()
      if (!data.added) {
        return notify(
          'info',
          data.duplicates ? 'Ces établissements sont déjà tous dans ta liste.' : 'Aucun site trouvé dans cette zone.',
        )
      }
      notify('success', `${plural(data.added, 'établissement ajouté', 'établissements ajoutés')}.`, 'queue')
    } finally {
      setBusyStage(null)
    }
  }

  async function importCsv(event: React.FormEvent) {
    event.preventDefault()
    if (!parsed.rows.length || busy) return
    setLastSummary(null)
    setBusyStage({ phase: 'discover', label: 'Import des contacts CSV…' })
    try {
      const { ok, data } = await postJson('/api/admin/acquisition/import', { rows: parsed.rows, verified })
      if (!ok) return notify('error', data.error ?? 'L’import a échoué.')
      setCsv('')
      refresh()
      const extra = [
        data.duplicates ? `${plural(data.duplicates, 'doublon ignoré', 'doublons ignorés')}` : '',
        data.ignored ? `${data.ignored} invalide(s)` : '',
      ]
        .filter(Boolean)
        .join(', ')
      notify(
        'success',
        `${plural(data.contactsAdded, 'contact importé', 'contacts importés')}${extra ? ` (${extra})` : ''}.`,
        'queue',
      )
    } finally {
      setBusyStage(null)
    }
  }

  async function readFile(file: File | undefined) {
    if (!file) return
    if (file.size > 2_000_000) return notify('error', 'Fichier trop lourd (2 Mo maximum).')
    setCsv(await file.text())
  }

  const tabButton = (value: Mode, label: string, icon?: 'ai' | 'apps') => {
    const active = mode === value
    return (
      <button
        key={value}
        type="button"
        role="tab"
        aria-selected={active}
        disabled={busy}
        onClick={() => setMode(value)}
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold transition-colors duration-150 disabled:opacity-55 ${FOCUS} ${
          active
            ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
        }`}
      >
        {icon === 'ai' && (
          <SparklesIcon
            className={`h-4 w-4 shrink-0 ${active ? 'text-[#ff9a66] dark:text-[#c2410c]' : 'text-[#c2410c] dark:text-[#ff9a66]'}`}
            aria-hidden
          />
        )}
        {icon === 'apps' && (
          <DevicePhoneMobileIcon
            className={`h-4 w-4 shrink-0 ${active ? 'text-emerald-300 dark:text-emerald-700' : 'text-emerald-700 dark:text-[#a0ca92]'}`}
            aria-hidden
          />
        )}
        {label}
      </button>
    )
  }

  const scanPct =
    busyStage?.phase === 'scan'
      ? Math.round((busyStage.done / Math.max(1, busyStage.total)) * 100)
      : 0

  return (
    <Panel
      id="ajouter"
      title="Alimenter & qualifier le pipeline de prospects"
      description="Trouve des entreprises actives par recherche web IA ou directement via l’App Store (avis publics garantis), avec extraction automatique des emails et filtrage des coquilles vides."
    >
      <div
        role="tablist"
        aria-label="Méthode d’ajout"
        className="mb-5 flex flex-wrap items-center gap-1.5 border-b border-gray-200/80 pb-3 dark:border-white/[0.06]"
      >
        {tabButton('ai', 'Découverte IA Web', 'ai')}
        {tabButton('apps', 'Apps & SaaS (Avis vérifiés)', 'apps')}
        {tabButton('domains', 'Coller des domaines')}
        {tabButton('csv', 'Importer un CSV')}
        {tabButton('discover', 'Annuaire local (OSM)')}
      </div>

      {mode === 'ai' ? (
        <form onSubmit={discoverWithAi} className="space-y-4">
          <div>
            <label htmlFor="ai-target-input" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
              Profil de cible recherché
            </label>
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {AI_TARGET_PRESETS.map((preset) => {
                const selected = aiTarget === preset.value
                return (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={busy}
                    onClick={() => setAiTarget(preset.value)}
                    className={`min-h-8 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${FOCUS} ${
                      selected
                        ? 'border-[#ee6018]/60 bg-[#ee6018]/[0.1] text-[#c2410c] dark:text-[#ffb08a]'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:text-gray-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
            <textarea
              id="ai-target-input"
              value={aiTarget}
              onChange={(e) => setAiTarget(e.target.value)}
              rows={3}
              maxLength={300}
              disabled={busy}
              placeholder="Ex. Studios UX/UI à Lyon, SaaS RH francophones avec avis Capterra, Marques D2C cosmétiques sur Trustpilot…"
              className={`${FIELD} resize-none py-2.5 leading-6`}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ai-location" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Zone ou ville <span className="font-normal text-gray-500 dark:text-zinc-500">(optionnel — France par défaut)</span>
              </label>
              <input
                id="ai-location"
                value={aiLocation}
                onChange={(e) => setAiLocation(e.target.value)}
                maxLength={100}
                disabled={busy}
                placeholder="Paris, Lyon, Nantes, Belgique, Suisse, Québec…"
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="ai-limit" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Volume cible par lot
              </label>
              <AdminSelect
                id="ai-limit"
                value={aiLimit}
                onChange={setAiLimit}
                options={[
                  { value: '15', label: '15 entreprises analysées (rapide)' },
                  { value: '20', label: '20 entreprises analysées (recommandé)' },
                  { value: '30', label: '30 entreprises analysées (approfondi)' },
                ]}
              />
            </div>
          </div>

          <label className="flex min-h-9 items-center gap-2.5 text-xs text-gray-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={onlyActionable}
              disabled={busy}
              onChange={(e) => setOnlyActionable(e.target.checked)}
              className={CHECKBOX}
            />
            <span>
              <strong>Qualification stricte :</strong> écarter automatiquement les sites qui n’ont ni email public vérifié ni fiche d’avis liée
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="max-w-[62ch] text-xs leading-5 text-gray-500 dark:text-zinc-400">
              Exclut automatiquement tes domaines déjà connus, vérifie chaque site en direct, puis scanne ses pages contact/mentions légales et ses liens d’avis publics.
            </p>
            <button type="submit" disabled={busy || !aiTarget.trim()} className={`${BTN_PRIMARY} gap-2`}>
              <SparklesIcon className="h-4 w-4 shrink-0 text-white" aria-hidden />
              {busy ? `Analyse en cours… ${elapsed} s` : 'Trouver & qualifier'}
            </button>
          </div>
        </form>
      ) : mode === 'apps' ? (
        <form onSubmit={discoverApps} className="space-y-4">
          <div>
            <label htmlFor="app-sector-input" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
              Secteur ou mots-clés métier sur l’App Store (séparés par virgule)
            </label>
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {APP_SECTOR_PRESETS.map((preset) => {
                const selected = appQuery === preset.query
                return (
                  <button
                    key={preset.label}
                    type="button"
                    disabled={busy}
                    onClick={() => setAppQuery(preset.query)}
                    className={`min-h-8 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${FOCUS} ${
                      selected
                        ? 'border-[#ee6018]/60 bg-[#ee6018]/[0.1] text-[#c2410c] dark:text-[#ffb08a]'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:text-gray-900 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                )
              })}
            </div>
            <input
              id="app-sector-input"
              value={appQuery}
              onChange={(e) => setAppQuery(e.target.value)}
              maxLength={160}
              disabled={busy}
              placeholder="Ex. facturation, note de frais, syndic, livraison repas, assurance…"
              className={FIELD}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="app-country" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Boutique Apple
              </label>
              <AdminSelect
                id="app-country"
                value={appCountry}
                onChange={setAppCountry}
                options={APP_STORE_COUNTRIES.map((c) => ({ value: c.code, label: c.label }))}
              />
            </div>
            <div>
              <label htmlFor="app-min-reviews" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Volume d’avis min.
              </label>
              <AdminSelect
                id="app-min-reviews"
                value={appMinReviews}
                onChange={setAppMinReviews}
                options={[
                  { value: '10', label: '≥ 10 avis publics' },
                  { value: '15', label: '≥ 15 avis publics' },
                  { value: '40', label: '≥ 40 avis publics' },
                ]}
              />
            </div>
            <div>
              <label htmlFor="app-max-rating" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Ciblage note
              </label>
              <AdminSelect
                id="app-max-rating"
                value={appMaxRating}
                onChange={setAppMaxRating}
                options={[
                  { value: '5', label: 'Toutes les notes' },
                  { value: '4.4', label: '≤ 4,4 ★ (frictions visibles)' },
                  { value: '3.9', label: '≤ 3,9 ★ (urgences produit)' },
                ]}
              />
            </div>
            <div>
              <label htmlFor="app-limit" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Nombre d’éditeurs
              </label>
              <AdminSelect
                id="app-limit"
                value={appLimit}
                onChange={setAppLimit}
                options={[
                  { value: '15', label: '15 éditeurs' },
                  { value: '20', label: '20 éditeurs' },
                  { value: '30', label: '30 éditeurs' },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="max-w-[62ch] text-xs leading-5 text-gray-500 dark:text-zinc-400">
              Zéro hallucination : cible uniquement de vraies PME/scale-ups ayant un site éditeur actif et de vrais avis App Store pré-liés pour générer <span className="font-mono">/rapport/[token]</span> en 1 clic.
            </p>
            <button type="submit" disabled={busy || appQuery.trim().length < 2} className={`${BTN_PRIMARY} gap-2`}>
              <DevicePhoneMobileIcon className="h-4 w-4 shrink-0 text-white" aria-hidden />
              {busy ? `Qualification… ${elapsed} s` : 'Extraire les éditeurs'}
            </button>
          </div>
        </form>
      ) : mode === 'domains' ? (
        <form onSubmit={addDomains} className="space-y-3">
          <label htmlFor="acq-domains" className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">
            Un domaine ou une URL par ligne (Product Hunt, G2, Trustpilot, Malt, Sortlist…)
          </label>
          <textarea
            id="acq-domains"
            value={domains}
            onChange={(event) => setDomains(event.target.value)}
            rows={4}
            maxLength={2000}
            disabled={busy}
            placeholder={'studio-ux.fr\nmon-saas.io\nasphalte.com'}
            className={`${FIELD} py-2.5 font-mono text-xs leading-6`}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Chaque domaine ajouté est immédiatement scanné (emails publics, dirigeant et sources d’avis).
            </p>
            <button type="submit" disabled={busy || !domains.trim()} className={BTN_PRIMARY}>
              {busy ? `Ajout & scan… ${elapsed} s` : 'Ajouter & scanner'}
            </button>
          </div>
        </form>
      ) : mode === 'csv' ? (
        <form onSubmit={importCsv} className="space-y-3">
          <p className="text-xs leading-5 text-gray-500 dark:text-zinc-400">
            Colonnes reconnues : <span className="font-mono">email, entreprise, domaine, nom, poste</span> (virgule ou point-virgule).
          </p>
          <div>
            <label htmlFor="acq-file" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
              Fichier CSV
            </label>
            <input
              id="acq-file"
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              disabled={busy}
              onChange={(event) => {
                void readFile(event.target.files?.[0])
              }}
              className={`${FIELD} py-2 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gray-900 dark:file:bg-white/10 dark:file:text-zinc-100`}
            />
          </div>
          <div>
            <label htmlFor="acq-csv" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
              Ou colle directement les lignes
            </label>
            <textarea
              id="acq-csv"
              value={csv}
              onChange={(event) => setCsv(event.target.value)}
              rows={4}
              disabled={busy}
              placeholder={'email,entreprise\nclaire@studio-produit.fr,Studio Produit'}
              className={`${FIELD} py-2.5 font-mono text-xs leading-6`}
            />
          </div>
          {csv.trim() && (
            <div className="border-t border-gray-200/80 pt-3 text-xs dark:border-white/[0.06]" aria-live="polite">
              <p>
                <span className="font-semibold text-emerald-700 dark:text-[#a0ca92]">
                  {plural(parsed.rows.length, 'ligne valide', 'lignes valides')}
                </span>
                {parsed.issues.length > 0 && (
                  <span className="text-amber-700 dark:text-amber-300">
                    {' '}· {plural(parsed.issues.length, 'ligne ignorée', 'lignes ignorées')}
                  </span>
                )}
              </p>
              {parsed.rows.slice(0, 4).map((row) => (
                <p key={row.email} className="mt-1 truncate text-gray-600 dark:text-zinc-300">
                  <span className="font-mono">{row.email}</span> · {row.company}
                </p>
              ))}
            </div>
          )}
          <label className="flex min-h-10 items-center gap-2.5 text-xs text-gray-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={verified}
              disabled={busy}
              onChange={(event) => setVerified(event.target.checked)}
              className={CHECKBOX}
            />
            Emails déjà vérifiés par un outil tiers (ZeroBounce, NeverBounce…)
          </label>
          <button type="submit" disabled={busy || !parsed.rows.length} className={BTN_PRIMARY}>
            {busy ? 'Import…' : parsed.rows.length ? `Importer ${plural(parsed.rows.length, 'contact', 'contacts')}` : 'Importer'}
          </button>
        </form>
      ) : (
        <form onSubmit={discoverOsm} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="acq-category" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Catégorie
              </label>
              <AdminSelect
                id="acq-category"
                value={category}
                onChange={setCategory}
                options={OSM_CATEGORIES.map((item) => ({ value: item.value, label: item.label }))}
              />
            </div>
            <div>
              <label htmlFor="acq-city" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Ville
              </label>
              <CityAutocomplete id="acq-city" value={city} onChange={setCity} placeholder="Ex. Lyon, Nantes…" />
            </div>
            <div>
              <label htmlFor="acq-limit" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Maximum
              </label>
              <AdminSelect
                id="acq-limit"
                value={limit}
                onChange={setLimit}
                options={[
                  { value: '25', label: '25' },
                  { value: '50', label: '50' },
                  { value: '100', label: '100' },
                ]}
              />
            </div>
          </div>
          <p className="text-xs leading-5 text-gray-500 dark:text-zinc-400">
            Réservé aux établissements physiques référencés sur OpenStreetMap. Pour cibler des SaaS, apps et agences digitales, privilégie « Découverte IA Web » ou « Apps & SaaS ».
          </p>
          <button type="submit" disabled={busy || !city.trim()} className={BTN_PRIMARY}>
            {busy ? 'Recherche…' : 'Chercher dans l’annuaire local'}
          </button>
        </form>
      )}

      {busyStage && (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 space-y-2 border-t border-gray-200/80 pt-4 dark:border-white/[0.06]"
        >
          {busyStage.phase === 'discover' ? (
            <div className="flex items-center justify-between font-mono text-xs tabular-nums text-gray-600 dark:text-zinc-300">
              <span>{busyStage.label}</span>
              <span>{elapsed} s</span>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs tabular-nums text-gray-700 dark:text-zinc-200">
                <span>
                  Qualification des sites (emails, dirigeants &amp; sources d’avis)… {busyStage.done} / {busyStage.total}
                </span>
                <span className="text-emerald-700 dark:text-[#a0ca92]">
                  {busyStage.withEmail} email(s) · {busyStage.withReviews} source(s) d’avis
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.08]">
                <span
                  className="block h-full rounded-full bg-[#ee6018] transition-all duration-200"
                  style={{ width: `${scanPct}%` }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {!busyStage && lastSummary && (
        <div
          role="status"
          className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/80 pt-4 text-xs dark:border-white/[0.06]"
        >
          <div className="space-y-0.5">
            <p className="font-semibold text-gray-900 dark:text-[#eeeeee]">
              <span className="font-mono text-emerald-700 dark:text-[#a0ca92]">{lastSummary.kept}</span>{' '}
              {lastSummary.kept > 1 ? 'prospects qualifiés ajoutés' : 'prospect qualifié ajouté'} via {lastSummary.channelLabel}
            </p>
            <p className="font-mono tabular-nums text-gray-500 dark:text-zinc-400">
              {lastSummary.withEmail} avec email public · {lastSummary.withReviews} avec fiche d’avis
              {lastSummary.discardedEmpty > 0 ? ` · ${lastSummary.discardedEmpty} sans-issue écarté(s)` : ''}
              {lastSummary.duplicates > 0 ? ` · ${lastSummary.duplicates} déjà connu(s)` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => notify('info', 'File « À contacter » ouverte.', 'queue')}
            className={BTN_SECONDARY}
          >
            Voir dans « À contacter »
          </button>
        </div>
      )}
    </Panel>
  )
}
