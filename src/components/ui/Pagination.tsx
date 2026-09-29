'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  label?: string
}

export function Pagination({ page, pageSize, total, onPageChange, label = 'éléments' }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null

  const firstItem = (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, total)

  return (
    <nav
      aria-label={`Pagination des ${label}`}
      className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]"
    >
      <p className="text-[11px] font-medium text-gray-500 dark:text-zinc-500">
        {firstItem}–{lastItem} sur {total} {label}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Page précédente"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40 dark:border-white/[0.1] dark:text-zinc-300 dark:hover:bg-white/[0.06]"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="min-w-16 px-2 text-center text-[11px] font-semibold tabular-nums text-gray-600 dark:text-zinc-300">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
          aria-label="Page suivante"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40 dark:border-white/[0.1] dark:text-zinc-300 dark:hover:bg-white/[0.06]"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}
