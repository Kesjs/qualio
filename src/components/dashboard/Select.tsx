'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid'

export type SelectOption = { value: string; label: string; disabled?: boolean }

type SelectProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  label?: string
  className?: string
  buttonClassName?: string
  listClassName?: string
  disabled?: boolean
  compact?: boolean
}

export function Select({ value, onChange, options, placeholder = 'Choisir…', label, className = '', buttonClassName = '', listClassName = '', disabled = false, compact = false }: SelectProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)))
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    const index = options.findIndex((option) => option.value === value)
    if (index >= 0) setActiveIndex(index)
  }, [options, value])

  function choose(option: SelectOption) {
    if (option.disabled) return
    onChange(option.value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    if (event.key === 'Escape' || event.key === 'Tab') { setOpen(false); return }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (open && options[activeIndex]) choose(options[activeIndex]); else setOpen(true); return }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault(); setOpen(true)
      const enabled = options.map((option, index) => ({ option, index })).filter(({ option }) => !option.disabled)
      const target = event.key === 'Home' ? enabled[0] : enabled.at(-1)
      if (target) setActiveIndex(target.index)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) { setOpen(true); return }
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((current) => {
        for (let offset = 1; offset <= options.length; offset++) {
          const next = (current + direction * offset + options.length) % options.length
          if (!options[next].disabled) return next
        }
        return current
      })
    }
  }

  return (
    <div ref={rootRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false) }} className={`relative ${className}`}>
      {label && <label id={`${id}-label`} className="sr-only">{label}</label>}
      <button ref={buttonRef} type="button" disabled={disabled} aria-label={label} aria-labelledby={label ? `${id}-label` : undefined} role="combobox" aria-autocomplete="none" aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-listbox`} onClick={() => setOpen((current) => !current)} onKeyDown={onKeyDown} className={`flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white text-left text-sm text-gray-800 outline-none transition hover:border-gray-300 focus-visible:border-[#ee6018] focus-visible:ring-2 focus-visible:ring-[#ee6018]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-zinc-100 ${compact ? 'min-h-8 px-2 text-xs' : 'min-h-11 px-3'} ${buttonClassName}`}>
        <span className={selected ? 'truncate' : 'truncate text-gray-500 dark:text-zinc-400'}>{selected?.label ?? placeholder}</span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-gray-500 transition-transform dark:text-zinc-400 ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && <div id={`${id}-listbox`} role="listbox" aria-label={label ?? placeholder} className={`absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl shadow-black/10 dark:border-white/[0.12] dark:bg-[#17191f] dark:shadow-black/40 ${listClassName}`}>
        {options.map((option, index) => <button key={option.value} id={`${id}-option-${index}`} tabIndex={-1} type="button" role="option" aria-selected={option.value === value} disabled={option.disabled} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(option)} className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition ${index === activeIndex ? 'bg-gray-100 dark:bg-white/[0.08]' : ''} ${option.value === value ? 'font-semibold text-gray-950 dark:text-white' : 'text-gray-700 dark:text-zinc-300'} disabled:cursor-not-allowed disabled:opacity-40`}>
          <span className="truncate">{option.label}</span>{option.value === value && <CheckIcon className="h-4 w-4 shrink-0 text-[#ee6018]" aria-hidden />}
        </button>)}
      </div>}
    </div>
  )
}
