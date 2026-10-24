'use client'

import { useMemo, useState } from 'react'
import { BTN_PRIMARY, FIELD, Panel } from '@/components/admin/ui'
import { parseImport } from '@/lib/admin/acquisition-csv'
import { OSM_CATEGORIES } from '@/lib/admin/acquisition-osm'
import { plural, postJson, type Notify } from '@/components/admin/acquisition-shared'

type Mode = 'discover' | 'domains' | 'csv'

export function AcquisitionAdd({ notify, refresh }: { notify: Notify; refresh: () => void }) {
  const [mode, setMode] = useState<Mode>('discover')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState<string>(OSM_CATEGORIES[0].value)
  const [limit, setLimit] = useState('50')
  const [domains, setDomains] = useState('')
  const [csv, setCsv] = useState('')
  const [verified, setVerified] = useState(false)
  const [busy, setBusy] = useState(false)
  const parsed = useMemo(() => parseImport(csv), [csv])

  async function discover(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    const { ok, data } = await postJson('/api/admin/acquisition/discover-osm', { city, category, limit: Number(limit) })
    setBusy(false)
    if (!ok) return notify('error', data.error ?? 'La recherche a échoué.')
    refresh()
    if (!data.added) return notify('info', data.message ?? 'Aucun nouveau prospect trouvé.')
    notify('success', `${plural(data.added, 'entreprise trouvée', 'entreprises trouvées')}${data.withEmail ? `, dont ${data.withEmail} avec un email déjà connu` : ''}. Sélectionne-les dans « À contacter » et clique sur « Préparer » : Qualio cherche les emails et rédige les brouillons.`, 'queue')
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

  const segment = (value: Mode, label: string) => (
    <button type="button" role="tab" aria-selected={mode === value} onClick={() => setMode(value)} className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${mode === value ? 'bg-white/[0.1] text-white' : 'text-stone-400 hover:text-white'}`}>{label}</button>
  )

  return (
    <Panel id="ajouter" title="Ajouter des prospects" description="Qualio trouve des entreprises locales pour toi, puis cherche leurs emails publics. Tu peux aussi importer un CSV ou coller des domaines.">
      <div role="tablist" aria-label="Méthode d’ajout" className="mb-4 inline-flex gap-1 rounded-xl border border-white/10 bg-[#161413] p-1">
        {segment('discover', 'Trouver des prospects')}
        {segment('csv', 'Importer un CSV')}
        {segment('domains', 'Coller des domaines')}
      </div>
      {mode === 'discover' ? (
        <form onSubmit={discover} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1"><label htmlFor="acq-category" className="mb-1.5 block text-sm font-semibold">Type d’établissement</label><select id="acq-category" value={category} onChange={(event) => setCategory(event.target.value)} className={FIELD}>{OSM_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
            <div className="sm:col-span-1"><label htmlFor="acq-city" className="mb-1.5 block text-sm font-semibold">Ville</label><input id="acq-city" value={city} onChange={(event) => setCity(event.target.value)} maxLength={120} placeholder="Lyon, Cotonou, Bénin…" className={FIELD} /></div>
            <div className="sm:col-span-1"><label htmlFor="acq-limit" className="mb-1.5 block text-sm font-semibold">Nombre maximum</label><select id="acq-limit" value={limit} onChange={(event) => setLimit(event.target.value)} className={FIELD}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select></div>
          </div>
          <p className="text-sm leading-6 text-stone-400">Seules les entreprises dont le site web est renseigné sur OpenStreetMap apparaissent. La recherche peut prendre jusqu’à 30 secondes. Données © contributeurs OpenStreetMap.</p>
          <button type="submit" disabled={busy || !city.trim()} className={BTN_PRIMARY}>{busy ? 'Recherche en cours…' : 'Trouver des prospects'}</button>
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
