'use client'

import { useState } from 'react'
import { ArrowTopRightOnSquareIcon, CheckIcon, DocumentChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Badge, BTN_PRIMARY, BTN_SECONDARY, FIELD, FOCUS } from '@/components/admin/ui'
import { BTN_SMALL, BTN_SMALL_ACCENT, CHECKBOX, postJson, type Notify } from '@/components/admin/acquisition-shared'
import type { AppStoreApp } from '@/lib/admin/acquisition-reviews'

type BatchApp = AppStoreApp & { publisherDomain: string | null }

type BatchOutcome = {
  appId: string
  appName: string
  status: 'pending' | 'running' | 'drafted' | 'no_contact' | 'skipped' | 'error'
  detail: string
  reportUrl?: string
  contactEmail?: string
}

export function AcquisitionBatchAppStore({
  country,
  onCountryChange,
  notify,
  refresh,
}: {
  country: string
  onCountryChange: (value: string) => void
  notify: Notify
  refresh: () => void
}) {
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState<10 | 20>(10)
  const [minRating, setMinRating] = useState('3.4')
  const [maxRating, setMaxRating] = useState('4.4')
  const [searching, setSearching] = useState(false)
  const [apps, setApps] = useState<BatchApp[]>([])
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [outcomes, setOutcomes] = useState<Record<string, BatchOutcome>>({})

  async function searchBatch(event?: React.FormEvent) {
    event?.preventDefault()
    const trimmed = query.trim()
    if (trimmed.length < 2) return
    setSearching(true)
    setApps([])
    setCheckedIds([])
    setOutcomes({})

    const { ok, data } = await postJson(
      '/api/admin/acquisition/app-search',
      {
        query: trimmed,
        country,
        batch: true,
        limit,
        minRating: Number(minRating) || 3.4,
        maxRating: Number(maxRating) || 4.4,
        minRatingCount: 20,
      },
      20_000,
    )
    setSearching(false)
    if (!ok) return notify('error', data.error ?? 'Recherche App Store indisponible.')
    const found = (data.apps ?? []) as BatchApp[]
    setApps(found)
    setCheckedIds(found.map((a) => a.id))
    if (!found.length) {
      notify('info', `Aucune app trouvée entre ${minRating} ★ et ${maxRating} ★ avec site éditeur pour « ${trimmed} ». Essaie un autre mot-clé.`)
    }
  }

  function toggleOne(id: string) {
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  async function processBatch() {
    const targets = apps.filter((a) => checkedIds.includes(a.id))
    if (!targets.length) return
    setRunning(true)
    const initial: Record<string, BatchOutcome> = {}
    for (const app of targets) {
      initial[app.id] = { appId: app.id, appName: app.name, status: 'pending', detail: 'En attente…' }
    }
    setOutcomes(initial)

    const setOne = (appId: string, patch: Partial<BatchOutcome>) =>
      setOutcomes((prev) => ({ ...prev, [appId]: { ...prev[appId], ...patch } }))

    const processOne = async (app: BatchApp) => {
      setOne(app.id, { status: 'running', detail: 'Analyse des avis & recherche du contact…' })
      const reportRes = await postJson(
        '/api/admin/acquisition/reports',
        {
          source: 'app_store',
          appId: app.id,
          appName: app.name,
          appUrl: app.url,
          sellerUrl: app.sellerUrl ?? null,
          country,
        },
        95_000,
      )
      if (!reportRes.ok) {
        setOne(app.id, { status: 'error', detail: reportRes.data.error ?? 'Échec du rapport' })
        return
      }
      const { url, companyId, contact, reviewCount } = reportRes.data
      if (!companyId || !contact) {
        setOne(app.id, {
          status: 'no_contact',
          detail: `Rapport (${reviewCount} avis) prêt, mais aucun email public trouvé`,
          reportUrl: url,
        })
        return
      }
      setOne(app.id, {
        status: 'running',
        detail: `Rédaction du brouillon pour ${contact.email}…`,
        reportUrl: url,
        contactEmail: contact.email,
      })
      const prepRes = await postJson('/api/admin/acquisition/prepare', { companyId }, 45_000)
      if (!prepRes.ok) {
        setOne(app.id, {
          status: 'error',
          detail: prepRes.data.error ?? 'Brouillon impossible',
          reportUrl: url,
          contactEmail: contact.email,
        })
        return
      }
      if (prepRes.data.drafted || prepRes.data.message) {
        setOne(app.id, {
          status: 'drafted',
          detail: prepRes.data.drafted ? `Brouillon prêt (${contact.email})` : `Déjà un brouillon (${contact.email})`,
          reportUrl: url,
          contactEmail: contact.email,
        })
      } else {
        setOne(app.id, {
          status: 'skipped',
          detail: prepRes.data.reason ?? 'Ignoré',
          reportUrl: url,
          contactEmail: contact.email,
        })
      }
    }

    // Concurrence bornée à 3 apps à la fois pour éviter les timeouts et respecter les quotas API
    const queue = [...targets]
    const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
      while (queue.length > 0) {
        const next = queue.shift()
        if (next) await processOne(next)
      }
    })
    await Promise.all(workers)
    setRunning(false)
    refresh()
  }

  const outcomeList = Object.values(outcomes)
  const draftedCount = outcomeList.filter((o) => o.status === 'drafted').length
  const doneCount = outcomeList.filter((o) => !['pending', 'running'].includes(o.status)).length

  return (
    <div className="space-y-4">
      <form onSubmit={searchBatch} className="grid gap-3 sm:grid-cols-[1fr_7.5rem_6.5rem_5.5rem_5.5rem_auto]">
        <div>
          <label htmlFor="batch-query" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
            Secteur ou mot-clé App Store
          </label>
          <input
            id="batch-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex. facturation, livraison, notes de frais, comptabilité…"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="batch-country" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
            Boutique
          </label>
          <select id="batch-country" value={country} onChange={(e) => onCountryChange(e.target.value)} className={FIELD}>
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
        <div>
          <label htmlFor="batch-limit" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
            Volume
          </label>
          <select id="batch-limit" value={limit} onChange={(e) => setLimit(Number(e.target.value) as 10 | 20)} className={FIELD}>
            <option value={10}>10 apps</option>
            <option value={20}>20 apps</option>
          </select>
        </div>
        <div>
          <label htmlFor="batch-min" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
            Note min
          </label>
          <input
            id="batch-min"
            type="number"
            step="0.1"
            min="1"
            max="5"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className={`${FIELD} font-mono tabular-nums`}
          />
        </div>
        <div>
          <label htmlFor="batch-max" className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-zinc-300">
            Note max
          </label>
          <input
            id="batch-max"
            type="number"
            step="0.1"
            min="1"
            max="5"
            value={maxRating}
            onChange={(e) => setMaxRating(e.target.value)}
            className={`${FIELD} font-mono tabular-nums`}
          />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={searching || running || query.trim().length < 2} className={`${BTN_SECONDARY} w-full sm:w-auto gap-2`}>
            <MagnifyingGlassIcon className="h-4 w-4 shrink-0" aria-hidden />
            {searching ? 'Recherche…' : 'Trouver les apps'}
          </button>
        </div>
      </form>

      {apps.length > 0 && (
        <div className="space-y-3 rounded-xl border border-gray-200/80 dark:border-white/[0.08] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={checkedIds.length === apps.length}
                disabled={running}
                onChange={() => setCheckedIds(checkedIds.length === apps.length ? [] : apps.map((a) => a.id))}
                className={CHECKBOX}
              />
              {checkedIds.length} / {apps.length} apps sélectionnées (entre {minRating} ★ et {maxRating} ★, site éditeur vérifié)
            </label>
            <button
              type="button"
              disabled={running || checkedIds.length === 0}
              onClick={() => void processBatch()}
              className={`${BTN_PRIMARY} gap-2`}
            >
              <DocumentChartBarIcon className="h-4 w-4 shrink-0" aria-hidden />
              {running
                ? `Traitement ${doneCount} / ${outcomeList.length}…`
                : `Analyser & préparer ${checkedIds.length} brouillon${checkedIds.length > 1 ? 's' : ''}`}
            </button>
          </div>

          <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {apps.map((app) => {
              const checked = checkedIds.includes(app.id)
              const outcome = outcomes[app.id]
              return (
                <li key={app.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <label className={`flex min-w-0 flex-1 items-center gap-3 ${FOCUS}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={running}
                      onChange={() => toggleOne(app.id)}
                      className={CHECKBOX}
                    />
                    {app.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={app.icon} alt="" className="h-8 w-8 shrink-0 rounded-lg border border-black/5" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900 dark:text-[#eeeeee]">{app.name}</span>
                      <span className="block truncate font-mono text-[11px] text-gray-500 dark:text-zinc-400">
                        {app.rating} ★ · {(app.ratingCount ?? 0).toLocaleString('fr-FR')} notes · {app.publisherDomain}
                      </span>
                    </span>
                  </label>
                  {outcome && (
                    <div className="flex items-center gap-2 text-xs">
                      <Badge
                        tone={
                          outcome.status === 'drafted'
                            ? 'success'
                            : outcome.status === 'error'
                              ? 'danger'
                              : outcome.status === 'no_contact' || outcome.status === 'skipped'
                                ? 'warning'
                                : 'info'
                        }
                      >
                        {outcome.detail}
                      </Badge>
                      {outcome.reportUrl && (
                        <a href={`${outcome.reportUrl}?apercu=1`} target="_blank" rel="noreferrer" className={BTN_SMALL}>
                          Rapport <ArrowTopRightOnSquareIcon className="h-3 w-3" aria-hidden />
                        </a>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          {!running && outcomeList.length > 0 && draftedCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/80 dark:border-white/[0.06] pt-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-[#a0ca92]">
                <CheckIcon className="h-4 w-4" aria-hidden />
                {draftedCount} brouillon{draftedCount > 1 ? 's' : ''} prêt{draftedCount > 1 ? 's' : ''} dans l’onglet Brouillons (relecture & envoi groupé en 1 clic).
              </p>
              <button type="button" onClick={() => notify('success', `${draftedCount} brouillon(s) prêt(s) à envoyer.`, 'drafts')} className={BTN_SMALL_ACCENT}>
                Ouvrir Brouillons ({draftedCount})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
