'use client'

import { useMemo } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { isValidCsvDate, splitByContent, type CsvAnalysis } from '@/lib/csv'
import { selectClass } from '@/components/dashboard/ui'
import { surface } from '@/components/dashboard/weekly/bricks'

const PREVIEW_ROWS = 5
const MAX_LISTED_ERRORS = 5
const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

function formatDate(value: string | undefined) {
  if (!value) return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? dateFormat.format(timestamp) : null
}

/** Trois sélecteurs de colonnes : texte (obligatoire), auteur, date. */
export function ColumnPickers({ headers, textCol, authorCol, dateCol, onText, onAuthor, onDate }: {
  headers: string[]; textCol: number; authorCol: number; dateCol: number
  onText: (index: number) => void; onAuthor: (index: number) => void; onDate: (index: number) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <ColumnSelect label="Texte de l’avis (obligatoire)" value={textCol} headers={headers} onChange={onText} allowNone={false} />
      <ColumnSelect label="Nom de l’auteur" value={authorCol} headers={headers} onChange={onAuthor} allowNone />
      <ColumnSelect label="Date de l’avis" value={dateCol} headers={headers} onChange={onDate} allowNone noneLabel="Aujourd’hui" />
    </div>
  )
}

function ColumnSelect({ label, value, headers, onChange, allowNone, noneLabel = 'Aucune' }: { label: string; value: number; headers: string[]; onChange: (index: number) => void; allowNone: boolean; noneLabel?: string }) {
  return (
    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300">
      {label}
      <select value={value} onChange={(event) => onChange(Number(event.target.value))} className={`${selectClass} mt-2 w-full`}>
        {allowNone && <option value={-1}>{noneLabel}</option>}
        {value < 0 && !allowNone && <option value={-1}>Choisir une colonne</option>}
        {headers.map((header, index) => <option key={`${header}-${index}`} value={index}>{header || `Colonne ${index + 1}`}</option>)}
      </select>
    </label>
  )
}

function Chip({ tone, children }: { tone: 'ok' | 'neutral' | 'warn' | 'error'; children: React.ReactNode }) {
  const styles = {
    ok: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200',
    neutral: 'bg-gray-100 text-gray-700 dark:bg-white/[0.08] dark:text-zinc-300',
    warn: 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200',
    error: 'bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-200',
  }[tone]
  return <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${styles}`}>{children}</span>
}

/**
 * Aperçu d'import : résumé (valides, ignorés, erreurs), erreurs avec numéro de ligne,
 * puis cartes sur mobile et tableau à colonnes fixes dès `sm`.
 */
export function CsvPreview({ analysis, textCol, authorCol, dateCol }: { analysis: CsvAnalysis; textCol: number; authorCol: number; dateCol: number }) {
  const split = useMemo(() => splitByContent(analysis.rows, textCol, dateCol), [analysis.rows, textCol, dateCol])
  const preview = split.valid.slice(0, PREVIEW_ROWS)
  const hiddenErrors = Math.max(0, analysis.errors.length - MAX_LISTED_ERRORS)
  const showAuthor = authorCol >= 0
  const showDate = dateCol >= 0

  return (
    <section className="space-y-3" aria-label="Aperçu de l’import">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="ok"><span className="font-mono tabular-nums">{split.valid.length}</span>&nbsp;avis valide{split.valid.length > 1 ? 's' : ''}</Chip>
        {split.emptyText > 0 && <Chip tone="neutral"><span className="font-mono tabular-nums">{split.emptyText}</span>&nbsp;sans texte, ignoré{split.emptyText > 1 ? 's' : ''}</Chip>}
        {split.invalidDate > 0 && <Chip tone="warn"><span className="font-mono tabular-nums">{split.invalidDate}</span>&nbsp;date{split.invalidDate > 1 ? 's' : ''} illisible{split.invalidDate > 1 ? 's' : ''}, ignorée{split.invalidDate > 1 ? 's' : ''}</Chip>}
        {analysis.errors.length > 0 && <Chip tone="error"><span className="font-mono tabular-nums">{analysis.errors.length}</span>&nbsp;erreur{analysis.errors.length > 1 ? 's' : ''} à corriger</Chip>}
      </div>

      {analysis.errors.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-100">
          <p className="flex items-center gap-2 font-semibold"><ExclamationTriangleIcon className="h-4 w-4 shrink-0" aria-hidden />Corrigez le fichier avant d’importer</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-6">
            {analysis.errors.slice(0, MAX_LISTED_ERRORS).map((issue, index) => <li key={index}>{issue.message}</li>)}
            {hiddenErrors > 0 && <li>et {hiddenErrors} autre{hiddenErrors > 1 ? 's' : ''}.</li>}
          </ul>
        </div>
      )}

      {textCol >= 0 && preview.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Aperçu des {preview.length} premiers avis</p>

          <ul role="list" className="space-y-2 sm:hidden">
            {preview.map((row) => {
              const author = showAuthor ? row.cells[authorCol] : ''
              const date = showDate ? formatDate(row.cells[dateCol]) : null
              return (
                <li key={row.line} className={`${surface} p-4`}>
                  <p className="line-clamp-3 text-sm leading-6 text-gray-900 dark:text-zinc-100">{row.cells[textCol]}</p>
                  {(author || date || showDate) && (
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-gray-500 dark:text-zinc-400">
                      {author && <span className="font-medium text-gray-700 dark:text-zinc-300">{author}</span>}
                      {author && date && <span aria-hidden>·</span>}
                      {date && <span className="font-mono">{date}</span>}
                      {showDate && !date && <span className="font-mono">aujourd’hui</span>}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>

          <div className={`${surface} hidden overflow-hidden sm:block`}>
            <table className="w-full table-fixed text-left text-sm">
              <caption className="sr-only">Aperçu des premiers avis du fichier</caption>
              <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 dark:bg-white/[0.04] dark:text-zinc-400">
                <tr>
                  <th scope="col" className="px-4 py-2.5">Avis</th>
                  {showAuthor && <th scope="col" className="w-36 px-4 py-2.5">Auteur</th>}
                  {showDate && <th scope="col" className="w-32 px-4 py-2.5">Date</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {preview.map((row) => {
                  const rawDate = row.cells[dateCol]
                  return (
                    <tr key={row.line} className="align-top">
                      <td className="px-4 py-3 text-gray-900 dark:text-zinc-100"><p className="line-clamp-2 leading-6">{row.cells[textCol]}</p></td>
                      {showAuthor && <td className="px-4 py-3 text-gray-600 dark:text-zinc-300"><p className="truncate">{row.cells[authorCol] || '—'}</p></td>}
                      {showDate && <td className="px-4 py-3 font-mono text-xs leading-6 text-gray-500 dark:text-zinc-400">{rawDate ? (isValidCsvDate(rawDate) ? formatDate(rawDate) : rawDate) : 'aujourd’hui'}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
