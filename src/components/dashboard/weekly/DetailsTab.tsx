'use client'

import Link from 'next/link'
import { formatDate, type ActionItem, type OverviewReady } from '@/lib/feedback/types'
import { Delta, PeriodSelect } from '@/components/dashboard/ui'
import { VolumeChart } from '@/components/dashboard/VolumeChart'
import type { BillingStatus } from '@/components/dashboard/useBillingStatus'
import { LockedFeature, surface } from './bricks'

const DECISION_LABEL: Record<ActionItem['status'], string> = { open: 'À décider', accepted: 'Acceptée', done: 'Faite', dismissed: 'Écartée' }

function Counter({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={`${surface} p-4`}>
      <p className="text-xs text-gray-600 dark:text-zinc-400">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">{value}</p>
    </div>
  )
}

/** Onglet « Détails » (vérification) : 4 compteurs, volume, thèmes avec variation, historique des décisions (Pro). */
export function DetailsTab({ data, actions, billing, days, onDays }: { data: OverviewReady; actions: ActionItem[]; billing: BillingStatus | undefined; days: 7 | 30 | 90; onDays: (days: 7 | 30 | 90) => void }) {
  const { counts, topThemes } = data
  const themes = topThemes.filter((theme) => !theme.isUnclassified)
  const decided = actions.filter((action) => action.status !== 'open')
  const isFree = billing?.plan === 'free'

  return (
    <div className="space-y-6">
      <div className="flex justify-end"><PeriodSelect days={days} onChange={onDays} /></div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Counter label="Avis au total" value={counts.total} />
        <Counter label={`Avis sur ${days} jours`} value={counts.period} />
        <Counter label="Thème n°1" value={themes[0]?.name ?? '—'} />
        <Counter label="Recommandations en attente" value={counts.pendingActions} />
      </div>

      <section className={`${surface} p-5`} aria-labelledby="volume-title">
        <h3 id="volume-title" className="mb-4 text-sm font-semibold text-gray-950 dark:text-white">Volume d’avis</h3>
        <VolumeChart series={data.series} days={days} />
      </section>

      <section aria-labelledby="themes-title">
        <h3 id="themes-title" className="mb-3 text-sm font-semibold text-gray-950 dark:text-white">Thèmes</h3>
        {themes.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-zinc-400">Les thèmes apparaissent dès que vos avis sont classés.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {themes.map((theme) => (
              <li key={theme.name}>
                <Link href={`/dashboard/feedback?theme=${encodeURIComponent(theme.name)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 hover:border-gray-400 dark:border-white/10 dark:bg-transparent dark:text-zinc-100 dark:hover:border-white/30">
                  {theme.name}<span className="text-gray-600 dark:text-zinc-400">{theme.current} avis</span><Delta value={theme.delta} />
                </Link>
              </li>
            ))}
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
                  <span className="min-w-0 truncate text-gray-950 dark:text-white">{action.title}</span>
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
