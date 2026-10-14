'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useActiveSite } from '@/lib/hooks/useActiveSite'
import { usePeriod } from '@/lib/hooks/useDashboardPrefs'
import { useActions, useDashboardMutations, useSyntheses, useThemes } from '@/lib/hooks/useDashboard'
import type { ThemeStat } from '@/lib/feedback/types'
import { card, Delta, EmptyState, ErrorState, PageHeader, PeriodSelect, PriorityBadge, secondaryButton, Skeleton, Sparkline } from '@/components/dashboard/ui'
import { Select } from '@/components/dashboard/Select'

export function ThemesPage() {
  const { activeSite: project } = useActiveSite()
  const [days, setDays] = usePeriod()
  const { data, isLoading, isError, refetch } = useThemes()
  const [openName, setOpenName] = useState<string | null>(null)
  const themes = data?.themes ?? []
  const selected = themes.find((theme) => theme.name === openName) ?? null

  return (
    <div className="space-y-6 pb-16">
      <PageHeader eyebrow="Thèmes" title="Ce dont parlent vos clients" description="Qualio classe chaque avis dès son arrivée. Les thèmes sont triés par volume, avec leur évolution sur la période." actions={<PeriodSelect days={days} onChange={setDays} />} />
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-16" />)}</div>
      ) : isError ? (
        <ErrorState message="Impossible de charger les thèmes." onRetry={() => refetch()} />
      ) : themes.length === 0 ? (
        <EmptyState title="Pas encore de thèmes" body="Dès que vos premiers avis arrivent, Qualio les regroupe automatiquement par thème." href="/dashboard/collection" label="Ajouter des avis" />
      ) : (
        <section className={`${card} overflow-hidden`}>
          <div className="hidden grid-cols-[minmax(0,1.6fr)_80px_90px_minmax(120px,1fr)_96px] gap-4 border-b border-gray-100 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:border-white/[0.06] dark:text-zinc-500 md:grid">
            <span>Thème</span><span>Avis</span><span>Évolution</span><span>Sentiment</span><span>Tendance</span>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {themes.map((theme) => (
              <li key={theme.name}>
                <button type="button" onClick={() => setOpenName(theme.name)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/[0.025] md:grid-cols-[minmax(0,1.6fr)_80px_90px_minmax(120px,1fr)_96px]">
                  <span className="min-w-0">
                    <span className={`block truncate text-sm font-semibold ${theme.isUnclassified ? 'text-gray-500 dark:text-zinc-400' : 'text-gray-900 dark:text-white'}`}>{theme.name}</span>
                    {theme.sample && <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-zinc-400">« {theme.sample} »</span>}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{theme.current}</span>
                  <span className="hidden md:block"><Delta value={theme.delta || null} inverse={theme.negative > theme.positive} /></span>
                  <span className="hidden md:block"><SentimentBar theme={theme} /></span>
                  <span className="hidden md:block"><Sparkline values={theme.spark} className="h-6 w-20" /></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {selected && project && <ThemePanel theme={selected} siteId={project.id} allThemes={themes} onClose={() => setOpenName(null)} />}
    </div>
  )
}

function SentimentBar({ theme }: { theme: ThemeStat }) {
  const total = theme.positive + theme.neutral + theme.negative
  if (!total) return <span className="text-xs text-gray-400">—</span>
  return (
    <span className="flex h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-gray-100 dark:bg-white/10" title={`${theme.positive} positifs · ${theme.neutral} neutres · ${theme.negative} négatifs`}>
      <span className="bg-emerald-400" style={{ width: `${(theme.positive / total) * 100}%` }} />
      <span className="bg-gray-300 dark:bg-zinc-500" style={{ width: `${(theme.neutral / total) * 100}%` }} />
      <span className="bg-rose-400" style={{ width: `${(theme.negative / total) * 100}%` }} />
    </span>
  )
}

function ThemePanel({ theme, siteId, allThemes, onClose }: { theme: ThemeStat; siteId: string; allThemes: ThemeStat[]; onClose: () => void }) {
  const { data: syntheses = [] } = useSyntheses()
  const { data: actions = [] } = useActions()
  const { mutateAsync: rename, isPending } = useDashboardMutations().renameTheme
  const [name, setName] = useState(theme.name)
  const [mergeInto, setMergeInto] = useState('')
  const [error, setError] = useState<string | null>(null)

  const insight = useMemo(() => {
    const match = syntheses[0]?.themes?.find((item) => item.name.toLocaleLowerCase('fr-FR') === theme.name.toLocaleLowerCase('fr-FR'))
    return match?.insight ?? null
  }, [syntheses, theme.name])
  const linked = actions.filter((action) => action.theme === theme.name && (action.status === 'open' || action.status === 'accepted'))

  async function apply(to: string) {
    setError(null)
    try { await rename({ siteId, from: theme.name, to }); onClose() } catch (cause) { setError((cause as Error).message) }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-gray-900/30 backdrop-blur-[2px] dark:bg-black/60" onClick={onClose} />
      <aside role="dialog" aria-label={`Thème ${theme.name}`} className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#111216]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c95720] dark:text-orange-300">Thème</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-950 dark:text-white">{theme.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white"><XMarkIcon className="h-5 w-5" /></button>
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[['Avis', theme.current], ['Positifs', theme.positive], ['Négatifs', theme.negative]].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-gray-50 p-3 dark:bg-white/[0.04]"><dt className="text-[11px] text-gray-500 dark:text-zinc-400">{label}</dt><dd className="mt-1 text-xl font-semibold text-gray-950 dark:text-white">{value}</dd></div>
          ))}
        </dl>

        <section className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-zinc-500">Résumé</h3>
          <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-zinc-300">{insight ?? 'Le résumé détaillé de ce thème apparaît dans la prochaine synthèse.'}</p>
        </section>

        {linked.length > 0 && (
          <section className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-zinc-500">Actions liées</h3>
            <ul className="mt-2 space-y-2">
              {linked.map((action) => (
                <li key={action.id} className="flex items-start justify-between gap-2 rounded-lg border border-gray-200 p-3 dark:border-white/[0.08]"><span className="text-sm text-gray-900 dark:text-white">{action.title}</span>{action.priority && <PriorityBadge priority={action.priority} />}</li>
              ))}
            </ul>
          </section>
        )}

        <Link href={`/dashboard/feedback?theme=${encodeURIComponent(theme.isUnclassified ? '__none__' : theme.name)}`} className={`${secondaryButton} mt-6 w-full`}>Voir les avis de ce thème</Link>

        {!theme.isUnclassified && (
          <section className="mt-8 space-y-4 border-t border-gray-100 pt-6 dark:border-white/[0.06]">
            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-zinc-500">Corriger</h3>
            <div className="flex gap-2">
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} aria-label="Nouveau nom" className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#ee6018] dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white" />
              <button type="button" disabled={isPending || !name.trim() || name.trim() === theme.name} onClick={() => apply(name.trim())} className={secondaryButton}>Renommer</button>
            </div>
            <div className="flex gap-2">
              <Select label="Fusionner avec" value={mergeInto} onChange={setMergeInto} className="min-w-0 flex-1" buttonClassName="h-9 border-gray-200 bg-white px-2 dark:border-white/[0.1] dark:bg-[#16181E] dark:text-white" options={[{ value: '', label: 'Fusionner avec…' }, ...allThemes.filter((item) => !item.isUnclassified && item.name !== theme.name).map((item) => ({ value: item.name, label: item.name }))]} />
              <button type="button" disabled={isPending || !mergeInto} onClick={() => apply(mergeInto)} className={secondaryButton}>Fusionner</button>
            </div>
            <button type="button" disabled={isPending} onClick={() => apply('')} className="text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400">Retirer ce thème (les avis redeviennent « Non classé »)</button>
            {error && <p role="alert" className="text-xs text-red-700 dark:text-red-300">{error}</p>}
          </section>
        )}
      </aside>
    </div>
  )
}
