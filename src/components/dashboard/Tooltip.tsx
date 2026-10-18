'use client'

import { ReactNode, useId } from 'react'

export function Tooltip({ label, children, side = 'bottom' }: { label: string; children: ReactNode; side?: 'bottom' | 'right' }) {
  const id = useId()
  return <span className={`group relative inline-flex ${side === 'right' ? 'items-center' : ''}`}>
    <span aria-describedby={id}>{children}</span>
    <span id={id} role="tooltip" className={`pointer-events-none absolute z-[70] whitespace-nowrap rounded-md bg-gray-950 px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-[opacity,transform] duration-150 group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-white dark:text-gray-950 ${side === 'right' ? 'left-full ml-2 -translate-x-1 group-hover:translate-x-0 group-focus-within:translate-x-0' : 'left-1/2 top-full mt-2 -translate-x-1/2 -translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0'}`}>
      {label}
    </span>
  </span>
}
