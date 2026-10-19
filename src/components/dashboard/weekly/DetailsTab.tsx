'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { formatDate, type ActionItem, type OverviewReady, type ThemeStat } from '@/lib/feedback/types'
import { PeriodSelect } from '@/components/dashboard/ui'
import { VolumeChart } from '@/components/dashboard/VolumeChart'
import type { BillingStatus } from '@/components/dashboard/useBillingStatus'
import { Banner, LockedFeature, surface } from './bricks'

const DECISION_LABEL: Record<ActionItem['status'], string> = { open: 'À décider', accepted: 'Acceptée', done: 'Faite', dismissed: 'Écartée', superseded: 'Remplacée' }

function Counter({ label, value, hint, delta }: { label: string; value: string | number; hint?: string; delta?: number | null }) {
  return (
    <div className={`${surface} p-4`}>
      <p className="text-xs text-gray-600 dark:text-zinc-400">{label}</p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="line-clamp-2 break-words text-2xl font-semibold leading-tight tracking-tight text-gray-950 dark:text-white">{value}</span>
        {delta != null && delta !== 0 && <span className={`text-xs font-semibold tabular-nums ${delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{delta > 0 ? '+' : ''}{delta}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">{hint}</p>}
    </div>
  )
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

/** Répartition d'un thème : négatifs / positifs / neutres, proportionnelle au thème le plus cité. */
function ThemeRow({ theme, max }: { theme: ThemeStat; max: number }) {
  const width = Math.max(4, Math.round((theme.current / max) * 100))
  const part = (n: number) => (theme.current ? (n / theme.current) * 100 : 0)
  return (
    <li>
      <Link href={`/dashboard/feedback?theme=${encodeURIComponent(theme.name)}`} className="block rounded-lg px-3 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.04]">
        <span className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-sm font-medium text-gray-950 dark:text-white">{theme.name}</span>
          <span className="shrink-0 text-xs text-gray-600 dark:text-zinc-400">
            {plural(theme.current, 'avis')}
            {theme.negative > 0 && <> · <span className="font-medium text-rose-600 dark:text-rose-400">{plural(theme.negative, 'négatif')}</span></>}
          </span>
        </span>
        <span className="mt-2 flex h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10" style={{ width: `${width}%` }} aria-hidden>
          <span className="bg-rose-500" style={{ width: `${part(theme.negative)}%` }} />
          <span className="bg-gray-300 dark:bg-zinc-600" style={{ width: `${part(theme.neutral)}%` }} />
          <span className="bg-emerald-500" style={{ width: `${part(theme.positive)}%` }} />
        </span>
        <span className="mt-1.5 block text-xs text-gray-500 dark:text-zinc-500">
          {theme.delta === 0 ? 'Autant que la période précédente' : `${theme.delta > 0 ? '+' : ''}${theme.delta} par rapport à la période précédente`}
        </span>
      </Link>
    </li>
  )
}

/** Onglet « Détails » (vérification) : 4 compteurs, volume, thèmes avec variation, historique des décisions (Pro). */
export function DetailsTab({ data, actions, billing, days, onDays }: { data: OverviewReady; actions: ActionItem[]; billing: BillingStatus | undefined; days: 7 | 30 | 90; onDays: (days: 7 | 30 | 90) => void }) {
  const [switching, setSwitching] = useState(false)
  const { counts, topThemes } = data
  const themes = topThemes.filter((theme) => !theme.isUnclassified)
  const decided = actions.filter((action) => action.status !== 'open' && action.status !== 'superseded')
  const isFree = billing?.plan === 'free'
  const { period, previousPeriod, positiveShare, previousPositiveShare, total } = counts
  const pending = data.series.reduce((sum, point) => sum + point.pending, 0)
  const maxTheme = Math.max(...themes.map((theme) => theme.current), 1)
  const shareDelta = positiveShare != null && previousPositiveShare != null ? positiveShare - previousPositiveShare : null

  return (
    <div className="space-y-6">
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-zinc-400">Chiffres sur les {days} derniers jours, comparés aux {days} jours d’avant.</p>
          <div className="flex items-center gap-2">
            {switching && <ArrowPathIcon className="h-4 w-4 animate-spin text-[#ee6018]" aria-label="Actualisation de la période" />}
            <PeriodSelect days={days} onChange={(next) => { if (next === days || next === 90 || days === 90) return onDays(next); setSwitching(true); window.setTimeout(() => { onDays(next); setSwitching(false) }, 420) }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Counter label={`Avis sur ${days} jours`} value={period} delta={previousPeriod > 0 || period > 0 ? period - previousPeriod : null} hint={`${plural(total, 'avis')} au total${data.exampleCount > 0 ? `, dont ${plural(data.exampleCount, 'exemple')}` : ''}`} />
        <Counter label="Avis positifs" value={positiveShare != null ? `${positiveShare} %` : '—'} delta={shareDelta} hint={positiveShare != null ? 'des avis déjà classés' : 'Visible dès que vos avis sont classés'} />
        <Counter label="Thème le plus cité" value={themes[0]?.name ?? '—'} hint={themes[0] ? plural(themes[0].current, 'avis') : 'Apparaît dès que vos avis sont classés'} />
        <Counter label="À décider" value={counts.pendingActions} hint={counts.pendingActions > 0 ? 'Voir l’onglet Recommandations' : 'Rien en attente'} />
      </div>

      {pending > 0 && <Banner>{plural(pending, 'avis')} sur cette période {pending > 1 ? 'ne sont' : 'n’est'} pas encore classé{pending > 1 ? 's' : ''} : leur thème et leur sentiment ne sont pas comptés ci-dessous.</Banner>}

      {period > 0
        ? <VolumeChart series={data.series} days={days} />
        : <p className={`${surface} p-5 text-sm text-gray-600 dark:text-zinc-400`}>Aucun avis sur les {days} derniers jours{total > 0 ? ' : essayez une période plus longue.' : '.'}</p>}

      <section className={`${surface} p-5`} aria-labelledby="themes-title">
        <h3 id="themes-title" className="text-sm font-semibold text-gray-950 dark:text-white">De quoi parlent vos clients</h3>
        <p className="mt-1 text-xs text-gray-600 dark:text-zinc-400">Thèmes classés par nombre d’avis. <span className="text-rose-600 dark:text-rose-400">Rouge</span> négatif, <span className="text-emerald-600 dark:text-emerald-400">vert</span> positif, gris neutre. Touchez un thème pour lire les avis.</p>
        {themes.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600 dark:text-zinc-400">Les thèmes apparaissent dès que vos avis sont classés.</p>
        ) : (
          <ul className="-mx-3 mt-2 divide-y divide-gray-100 dark:divide-white/[0.06]">
            {themes.map((theme) => <ThemeRow key={theme.name} theme={theme} max={maxTheme} />)}
          </ul>
        )}
      </section>

      {isFree ? (
        <LockedFeature title="Historique des décisions">Retrouvez ce que vous avez accepté ou écarté, et son effet sur vos avis.</LockedFeature>
      ) : (
        <section className={`${surface} p-5`} aria-labelledby="history-title">
          <h3 id="history-title" className="text-sm font-semibold text-gray-950 dark:text-white">Historique des décisions</h3>
          {decided.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">Vos décisions apparaîtront ici dès que vous aurez accepté ou écarté une recommandation.</p>
          ) : (
            <ul className="mt-3 divide-y divide-gray-200/80 dark:divide-white/[0.08]">
              {decided.map((action) => (
                <li key={action.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0 text-gray-950 dark:text-white"><span className="block truncate">{action.title}</span>{action.effect && !action.effect.locked && <span className="mt-0.5 block text-xs text-gray-600 dark:text-zinc-400">Effet : {action.effect.label}{action.effect.concluded && action.effect.changePercent != null ? ` (${action.effect.changePercent > 0 ? '+' : ''}${action.effect.changePercent} %)` : ''}</span>}</span>
                  <span className="shrink-0 text-xs text-gray-600 dark:text-zinc-400">{DECISION_LABEL[action.status]} · proposée le {formatDate(action.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
