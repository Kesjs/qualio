'use client'

import { useMemo, useState } from 'react'
import { BTN_PRIMARY, FIELD, Panel } from '@/components/admin/ui'
import { AdminSelect } from '@/components/admin/AdminSelect'
import { CityAutocomplete } from '@/components/admin/CityAutocomplete'
import { parseImport } from '@/lib/admin/acquisition-csv'
import { OSM_CATEGORIES } from '@/lib/admin/acquisition-osm'
import { plural, postJson, type Notify } from '@/components/admin/acquisition-shared'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { toast } from 'sonner'

type Mode = 'ai' | 'discover' | 'domains' | 'csv'

const AI_TARGET_PRESETS = [
  { label: 'E-commerce & D2C', value: 'Boutiques E-commerce et marques D2C recevant des avis clients réguliers' },
  { label: 'Startups & SaaS B2B', value: 'Startups et éditeurs de logiciels SaaS B2B avec des utilisateurs actifs' },
  { label: 'Agences Web & Digital', value: 'Agences web, communication et marketing digital gérant la réputation de clients' },
  { label: 'Hôtels & Restauration', value: 'Hôtels, hébergements de charme et restaurants réputés avec avis en ligne' },
  { label: 'Cliniques & Santé', value: 'Cliniques, centres dentaires et cabinets médicaux spécialisés' },
]

export function AcquisitionAdd({ notify, refresh }: { notify: Notify; refresh: () => void }) {
  const [mode, setMode] = useState<Mode>('ai')

  // IA State
  const [aiTarget, setAiTarget] = useState(AI_TARGET_PRESETS[0].value)
  const [aiLocation, setAiLocation] = useState('')
  const [aiLimit, setAiLimit] = useState('20')

  // OpenStreetMap State
  const [city, setCity] = useState('')
  const [category, setCategory] = useState<string>(OSM_CATEGORIES[0].value)
  const [limit, setLimit] = useState('50')

  // CSV & Domains State
  const [domains, setDomains] = useState('')
  const [csv, setCsv] = useState('')
  const [verified, setVerified] = useState(false)
  const [busy, setBusy] = useState(false)

  const parsed = useMemo(() => parseImport(csv), [csv])

  async function discoverWithAi(event: React.FormEvent) {
    event.preventDefault()
    if (!aiTarget.trim()) return
    setBusy(true)
    const { ok, data } = await postJson('/api/admin/acquisition/discover-ai', {
      target: aiTarget.trim(),
      location: aiLocation.trim() || undefined,
      limit: Number(aiLimit),
    })
    setBusy(false)

    if (!ok) {
      const err = data.error ?? 'La génération par l’IA a échoué.'
      toast.error(err)
      return notify('error', err)
    }
    refresh()
    if (!data.added) {
      const msg = data.message ?? 'Aucun nouveau prospect trouvé.'
      toast.info(msg)
      return notify('info', msg)
    }

    const countText = plural(data.added, 'entreprise réelle trouvée', 'entreprises réelles trouvées')
    const emailText = data.withEmail ? `, dont ${data.withEmail} avec un email déjà prêt` : ''
    toast.success(`✨ ${countText}${emailText} (${data.provider})`, {
      description: 'Disponibles dans « À contacter ». Cliquez sur « Préparer » pour générer les messages.',
      duration: 7000,
    })
    notify(
      'success',
      `✨ ${countText}${emailText} via ${data.provider}. Elles t’attendent dans « À contacter » : clique sur « Préparer ».`,
      'queue'
    )
  }

  async function discoverOsm(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    const { ok, data } = await postJson('/api/admin/acquisition/discover-osm', { city, category, limit: Number(limit) })
    setBusy(false)
    if (!ok) return notify('error', data.error ?? 'La recherche a échoué.')
    refresh()
    if (!data.added) return notify('info', data.message ?? 'Aucun nouveau prospect trouvé.')
    notify('success', `${plural(data.added, 'entreprise trouvée', 'entreprises trouvées')}${data.withEmail ? `, dont ${data.withEmail} avec un email déjà connu` : ''}. Sélectionne-les dans « À contacter » et clique sur « Préparer ».`, 'queue')
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
    notify('success', `${plural(data.companiesAdded, 'domaine ajouté', 'domaines ajoutés')}. Lance l’analyse dans « À contacter ».`, 'queue')
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
    const extra = [data.duplicates ? `${plural(data.duplicates, 'doublon ignoré', 'doublons ignorés')}` : '', data.ignored ? `${data.ignored} invalide(s)` : ''].filter(Boolean).join(', ')
    notify('success', `${plural(data.contactsAdded, 'contact importé', 'contacts importés')}${extra ? ` (${extra})` : ''}. Ils t’attendent dans « À contacter ».`, 'queue')
  }

  async function readFile(file: File | undefined) {
    if (!file) return
    if (file.size > 2_000_000) return notify('error', 'Fichier trop lourd (2 Mo maximum).')
    setCsv(await file.text())
  }

  const segment = (value: Mode, label: string, isSpecial?: boolean) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => setMode(value)}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition ${
        mode === value
          ? isSpecial
            ? 'bg-[#c2410c] text-white shadow-md'
            : 'bg-white/[0.1] text-white'
          : isSpecial
          ? 'text-[#ff9a66] hover:bg-white/[0.06] hover:text-white'
          : 'text-stone-400 hover:text-white'
      }`}
    >
      {isSpecial && <SparklesIcon className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />}
      {label}
    </button>
  )

  return (
    <Panel
      id="ajouter"
      title="Ajouter des prospects"
      description="Trouve des entreprises cibles pour Qualio par IA, explore les commerces locaux, importe un CSV ou colle directement des domaines."
    >
      <div role="tablist" aria-label="Méthode d’ajout" className="mb-4 inline-flex flex-wrap gap-1 rounded-xl border border-white/10 bg-[#161413] p-1">
        {segment('ai', 'Trouver avec l’IA', true)}
        {segment('discover', 'OpenStreetMap')}
        {segment('csv', 'Importer un CSV')}
        {segment('domains', 'Coller des domaines')}
      </div>

      {mode === 'ai' ? (
        <form onSubmit={discoverWithAi} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white">
              Cible d’entreprises pour Qualio
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {AI_TARGET_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setAiTarget(preset.value)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                    aiTarget === preset.value
                      ? 'border-[#ff8a50] bg-[#ee6018]/20 text-[#ff9a66]'
                      : 'border-white/10 bg-white/[0.04] text-stone-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <textarea
              value={aiTarget}
              onChange={(e) => setAiTarget(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="Ex: Boutiques e-commerce de mode en France, Startups B2B SaaS, Agences Shopify…"
              className={`${FIELD} py-2 leading-6`}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ai-location" className="mb-1.5 block text-sm font-semibold text-white">
                Zone géographique ou ville <span className="font-normal text-stone-400">(optionnel)</span>
              </label>
              <input
                id="ai-location"
                value={aiLocation}
                onChange={(e) => setAiLocation(e.target.value)}
                maxLength={100}
                placeholder="Lille, Paris, France entière, Belgique…"
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="ai-limit" className="mb-1.5 block text-sm font-semibold text-white">
                Nombre de prospects à trouver
              </label>
              <AdminSelect
                id="ai-limit"
                value={aiLimit}
                onChange={setAiLimit}
                options={[
                  { value: '10', label: '10 prospects réels' },
                  { value: '20', label: '20 prospects réels' },
                  { value: '30', label: '30 prospects réels' },
                ]}
              />
            </div>
          </div>

          <p className="text-sm leading-6 text-stone-400">
            L’IA identifie de vraies entreprises actives, extrait leurs noms de domaines officiels et vérifie les doublons avec ta base.
          </p>

          <button
            type="submit"
            disabled={busy || !aiTarget.trim()}
            className={`${BTN_PRIMARY} inline-flex min-h-11 items-center justify-center gap-2.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-75`}
          >
            {busy ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin text-white shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Recherche et analyse IA en cours…</span>
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4 shrink-0 text-amber-200" aria-hidden />
                <span>Générer les prospects avec l’IA</span>
              </>
            )}
          </button>
        </form>
      ) : mode === 'discover' ? (
        <form onSubmit={discoverOsm} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label htmlFor="acq-category" className="mb-1.5 block text-sm font-semibold">Type d’établissement</label>
              <AdminSelect
                id="acq-category"
                value={category}
                onChange={setCategory}
                options={OSM_CATEGORIES.map((item) => ({ value: item.value, label: item.label }))}
              />
            </div>
            <div className="sm:col-span-1">
              <label htmlFor="acq-city" className="mb-1.5 block text-sm font-semibold">Ville</label>
              <CityAutocomplete
                id="acq-city"
                value={city}
                onChange={setCity}
                placeholder="Tapez le nom (ex: Lille, Lyon…)"
              />
            </div>
            <div className="sm:col-span-1">
              <label htmlFor="acq-limit" className="mb-1.5 block text-sm font-semibold">Nombre maximum</label>
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
          <p className="text-sm leading-6 text-stone-400">Seules les entreprises physiques locales dont le site web est renseigné sur OpenStreetMap apparaissent. Pour les e-commerces, agences ou SaaS, privilégiez l’onglet « Trouver avec l’IA ».</p>
          <button
            type="submit"
            disabled={busy || !city.trim()}
            className={`${BTN_PRIMARY} inline-flex min-h-11 items-center justify-center gap-2.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-75`}
          >
            {busy ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin text-white shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Recherche en cours…</span>
              </>
            ) : (
              <span>Trouver des commerces locaux</span>
            )}
          </button>
        </form>
      ) : mode === 'domains' ? (
        <form onSubmit={addDomains} className="space-y-3">
          <label htmlFor="acq-domains" className="block text-sm font-semibold">Un domaine par ligne</label>
          <textarea id="acq-domains" value={domains} onChange={(event) => setDomains(event.target.value)} rows={4} maxLength={2000} placeholder={'lebistro.fr\nhotel-plage.com'} className={`${FIELD} py-2`} />
          <button type="submit" disabled={busy || !domains.trim()} className={BTN_PRIMARY}>{busy ? 'Ajout…' : 'Ajouter les domaines'}</button>
        </form>
      ) : (
        <form onSubmit={importCsv} className="space-y-3">
          <p className="text-sm leading-6 text-stone-400">Colonnes reconnues : email, entreprise, domaine, nom, poste. Une simple liste d’emails fonctionne aussi. Export Apollo, Hunter ou Excel (virgule ou point-virgule).</p>
          <div>
            <label htmlFor="acq-file" className="mb-1.5 block text-sm font-semibold">Fichier CSV</label>
            <input id="acq-file" type="file" accept=".csv,.txt,text/csv,text/plain" onChange={(event) => { void readFile(event.target.files?.[0]) }} className={`${FIELD} py-2 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-stone-100`} />
          </div>
          <div>
            <label htmlFor="acq-csv" className="mb-1.5 block text-sm font-semibold">Ou colle le contenu ici</label>
            <textarea id="acq-csv" value={csv} onChange={(event) => setCsv(event.target.value)} rows={4} placeholder={'email,entreprise\ncontact@lebistro.fr,Le Bistro'} className={`${FIELD} py-2 font-mono text-xs`} />
          </div>
          {csv.trim() && (
            <div className="rounded-xl border border-white/10 bg-[#161413] p-4 text-sm" aria-live="polite">
              <p><span className="font-semibold text-emerald-300">{plural(parsed.rows.length, 'ligne valide', 'lignes valides')}</span>{parsed.issues.length > 0 && <span className="text-amber-300"> · {plural(parsed.issues.length, 'ligne ignorée', 'lignes ignorées')}</span>}</p>
              {parsed.rows.slice(0, 5).map((row) => <p key={row.email} className="mt-1.5 truncate text-stone-300"><span className="font-mono text-xs">{row.email}</span> <span className="text-stone-500">· {row.company}</span></p>)}
              {parsed.rows.length > 5 && <p className="mt-1.5 text-xs text-stone-500">et {parsed.rows.length - 5} autres…</p>}
              {parsed.issues.slice(0, 4).map((issue) => <p key={`${issue.line}-${issue.value}`} className="mt-1.5 text-xs text-amber-300">Ligne {issue.line} : {issue.reason}{issue.value ? ` (${issue.value})` : ''}</p>)}
              {parsed.issues.length > 4 && <p className="mt-1.5 text-xs text-stone-500">et {parsed.issues.length - 4} autres lignes ignorées.</p>}
            </div>
          )}
          <label className="flex min-h-11 items-center gap-3 text-sm text-stone-300"><input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} className="h-5 w-5 accent-[#c2410c]" />Ces emails sont déjà vérifiés (NeverBounce, ZeroBounce…)</label>
          <button type="submit" disabled={busy || !parsed.rows.length} className={BTN_PRIMARY}>{busy ? 'Import…' : parsed.rows.length ? `Importer ${plural(parsed.rows.length, 'contact', 'contacts')}` : 'Importer'}</button>
        </form>
      )}
    </Panel>
  )
}
