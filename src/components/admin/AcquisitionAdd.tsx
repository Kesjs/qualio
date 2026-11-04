'use client'

import { useEffect, useMemo, useState } from 'react'
import { BTN_PRIMARY, FIELD, FOCUS, Panel } from '@/components/admin/ui'
import { AdminSelect } from '@/components/admin/AdminSelect'
import { CityAutocomplete } from '@/components/admin/CityAutocomplete'
import { parseImport } from '@/lib/admin/acquisition-csv'
import { OSM_CATEGORIES } from '@/lib/admin/acquisition-osm'
import { plural, postJson, type Notify } from '@/components/admin/acquisition-shared'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { toast } from 'sonner'

type Mode = 'ai' | 'domains' | 'csv' | 'discover'

// Cibles alignées sur le produit : des équipes qui reçoivent des retours écrits et décident quoi améliorer.
const AI_TARGET_PRESETS = [
  {
    label: 'Agences web & produit (prioritaire)',
    value:
      'Petites agences web, UX/UI, produit ou growth francophones (2 à 30 personnes) qui livrent et font évoluer des sites, apps ou SaaS pour plusieurs clients, et qui pourraient remettre à chaque client un rapport sur ses retours utilisateurs. Exclure les agences purement SEO, RP ou publicité.',
  },
  {
    label: 'SaaS & apps avec avis publics',
    value:
      'Éditeurs de logiciels SaaS ou d’applications mobiles francophones (TPE/PME, moins de 100 personnes) qui ont des avis publics sur G2, Capterra, App Store, Google Play ou Trustpilot et une équipe produit qui priorise une roadmap.',
  },
  {
    label: 'Marques e-commerce & D2C',
    value:
      'Marques e-commerce et D2C francophones (PME) qui affichent des avis clients sur leurs fiches produits ou sur Trustpilot / Avis Vérifiés, et qui font évoluer leurs produits à partir de ces retours.',
  },
]

export function AcquisitionAdd({ notify, refresh }: { notify: Notify; refresh: () => void }) {
  const [mode, setMode] = useState<Mode>('ai')

  // IA State
  const [aiTarget, setAiTarget] = useState(AI_TARGET_PRESETS[0].value)
  const [aiLocation, setAiLocation] = useState('')
  const [aiLimit, setAiLimit] = useState('25')

  // OpenStreetMap State
  const [city, setCity] = useState('')
  const [category, setCategory] = useState<string>(OSM_CATEGORIES[0].value)
  const [limit, setLimit] = useState('50')

  // CSV & Domains State
  const [domains, setDomains] = useState('')
  const [csv, setCsv] = useState('')
  const [verified, setVerified] = useState(false)
  const [busy, setBusy] = useState(false)

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

  async function discoverWithAi(event: React.FormEvent) {
    event.preventDefault()
    if (!aiTarget.trim()) return
    setBusy(true)
    let result: Awaited<ReturnType<typeof postJson>>
    try {
      result = await postJson('/api/admin/acquisition/discover-ai', {
        target: aiTarget.trim(),
        location: aiLocation.trim(),
        limit: Number(aiLimit),
      })
    } finally {
      setBusy(false)
    }

    const { ok, data } = result
    if (!ok) {
      toast.error(data.error ?? 'La découverte IA a échoué.')
      return notify('error', data.error ?? 'La découverte IA a échoué.')
    }

    refresh()
    if (!data.added) {
      const msg = data.duplicates
        ? `Aucun nouveau prospect ajouté (${plural(data.duplicates, 'entreprise déjà connue', 'entreprises déjà connues')}). Essaie une autre niche ou zone.`
        : 'Aucune entreprise trouvée pour cette cible.'
      return notify('info', msg)
    }

    const extra = data.duplicates ? ` (${plural(data.duplicates, 'doublon écarté', 'doublons écartés')})` : ''
    notify(
      'success',
      `${plural(data.added, 'prospect ajouté', 'prospects ajoutés')}${extra}. Génère leur rapport ou scanne leurs emails dans « À contacter ».`,
      'queue',
    )
  }

  async function discoverOsm(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    const { ok, data } = await postJson('/api/admin/acquisition/discover-osm', { city, category, limit: Number(limit) })
    setBusy(false)
    if (!ok) return notify('error', data.error ?? 'La recherche a échoué.')
    refresh()
    if (!data.added) {
      return notify('info', data.duplicates ? 'Ces établissements sont déjà tous dans ta liste.' : 'Aucun site trouvé dans cette zone.')
    }
    notify('success', `${plural(data.added, 'établissement ajouté', 'établissements ajoutés')}.`, 'queue')
  }

  async function addDomains(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    const { ok, data } = await postJson('/api/admin/acquisition/domain-search', { targets: domains })
    setBusy(false)
    if (!ok) return notify('error', data.error ?? 'L’ajout a échoué.')
    setDomains('')
    refresh()
    if (!data.companiesAdded) return notify('info', 'Ces domaines sont déjà dans ta liste.')
    notify('success', `${plural(data.companiesAdded, 'domaine ajouté', 'domaines ajoutés')}.`, 'queue')
  }

  async function importCsv(event: React.FormEvent) {
    event.preventDefault()
    if (!parsed.rows.length) return
    setBusy(true)
    const { ok, data } = await postJson('/api/admin/acquisition/import', { rows: parsed.rows, verified })
    setBusy(false)
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
  }

  async function readFile(file: File | undefined) {
    if (!file) return
    if (file.size > 2_000_000) return notify('error', 'Fichier trop lourd (2 Mo maximum).')
    setCsv(await file.text())
  }

  const tabButton = (value: Mode, label: string, icon?: boolean) => {
    const active = mode === value
    return (
      <button
        key={value}
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => setMode(value)}
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold transition-colors duration-150 ${FOCUS} ${
          active
            ? 'bg-gray-950 text-white dark:bg-white dark:text-gray-950'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
        }`}
      >
        {icon && <SparklesIcon className={`h-4 w-4 shrink-0 ${active ? 'text-[#ff9a66] dark:text-[#c2410c]' : 'text-[#c2410c] dark:text-[#ff9a66]'}`} aria-hidden />}
        {label}
      </button>
    )
  }

  return (
    <Panel
      id="ajouter"
      title="Alimenter le pipeline de prospects"
      description="Trouve des agences produit, SaaS et marques e-commerce actives (sites vérifiés en direct), colle une sélection de domaines trouvés sur Product Hunt / G2, ou importe un CSV."
    >
      <div role="tablist" aria-label="Méthode d’ajout" className="mb-5 flex flex-wrap items-center gap-1.5 border-b border-gray-200/80 pb-3 dark:border-white/[0.06]">
        {tabButton('ai', 'Découverte IA ciblée', true)}
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
                    onClick={() => setAiTarget(preset.value)}
                    className={`min-h-8 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${FOCUS} ${
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
              placeholder="Ex. Studios produit & UX à Paris, SaaS RH francophones avec avis Capterra, Marques Shopify cosmétiques…"
              className={`${FIELD} resize-none py-2.5 leading-6`}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ai-location" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Zone ou pays <span className="font-normal text-gray-500 dark:text-zinc-500">(optionnel)</span>
              </label>
              <input
                id="ai-location"
                value={aiLocation}
                onChange={(e) => setAiLocation(e.target.value)}
                maxLength={100}
                placeholder="France, Paris, Lyon, Belgique, Québec…"
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="ai-limit" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
                Volume par recherche
              </label>
              <AdminSelect
                id="ai-limit"
                value={aiLimit}
                onChange={setAiLimit}
                options={[
                  { value: '25', label: '25 entreprises vérifiées' },
                  { value: '50', label: '50 entreprises vérifiées' },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="max-w-[60ch] text-xs leading-5 text-gray-500 dark:text-zinc-400">
              Chaque domaine retourné est testé par requête HTTP avant ajout. Les emails sont extraits uniquement depuis les pages publiques du site officiel.
            </p>
            <button type="submit" disabled={busy || !aiTarget.trim()} className={`${BTN_PRIMARY} gap-2`}>
              <SparklesIcon className="h-4 w-4 shrink-0 text-white" aria-hidden />
              {busy ? `Vérification des domaines… ${elapsed} s` : 'Trouver les prospects'}
            </button>
          </div>
        </form>
      ) : mode === 'domains' ? (
        <form onSubmit={addDomains} className="space-y-3">
          <label htmlFor="acq-domains" className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">
            Un domaine ou une URL par ligne (Product Hunt, G2, annuaire d’agences…)
          </label>
          <textarea
            id="acq-domains"
            value={domains}
            onChange={(event) => setDomains(event.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={'studio-ux.fr\nmon-saas.io\nasphalte.com'}
            className={`${FIELD} py-2.5 font-mono text-xs leading-6`}
          />
          <button type="submit" disabled={busy || !domains.trim()} className={BTN_PRIMARY}>
            {busy ? 'Ajout…' : 'Ajouter à la file'}
          </button>
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
              onChange={(event) => {
                void readFile(event.target.files?.[0])
              }}
              className={`${FIELD} py-2 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 dark:file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gray-900 dark:file:text-zinc-100`}
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
              onChange={(event) => setVerified(event.target.checked)}
              className="h-4 w-4 rounded accent-[#c2410c]"
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
            Réservé aux établissements physiques référencés sur OpenStreetMap. Pour trouver tes premiers vrais utilisateurs SaaS, agences ou e-commerce, utilise l’onglet « Découverte IA ciblée ».
          </p>
          <button type="submit" disabled={busy || !city.trim()} className={BTN_PRIMARY}>
            {busy ? 'Recherche…' : 'Chercher dans l’annuaire local'}
          </button>
        </form>
      )}
    </Panel>
  )
}
