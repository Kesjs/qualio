'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import { FOCUS } from '@/components/admin/ui'

export type AdminSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type AdminSelectProps = {
  id?: string
  name?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  options: AdminSelectOption[]
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  buttonClassName?: string
}

export function AdminSelect({
  id: explicitId,
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  options,
  label,
  placeholder = 'Choisir…',
  disabled = false,
  className = '',
  buttonClassName = '',
}: AdminSelectProps) {
  const generatedId = useId()
  const selectId = explicitId || generatedId
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const isControlled = controlledValue !== undefined
  const [internalValue, setInternalValue] = useState(
    controlledValue ?? defaultValue ?? options[0]?.value ?? ''
  )

  useEffect(() => {
    if (isControlled) {
      setInternalValue(controlledValue)
    }
  }, [controlledValue, isControlled])

  const [open, setOpen] = useState(false)
  const [openUpwards, setOpenUpwards] = useState(false)
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((opt) => opt.value === internalValue))
  )

  const selected = options.find((opt) => opt.value === internalValue)

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      setOpenUpwards(spaceBelow < 260 && spaceAbove > spaceBelow)
    }
  }, [open])

  useEffect(() => {
    function closeOnClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', closeOnClickOutside)
    return () => document.removeEventListener('mousedown', closeOnClickOutside)
  }, [])

  useEffect(() => {
    const index = options.findIndex((opt) => opt.value === internalValue)
    if (index >= 0) setActiveIndex(index)
  }, [options, internalValue])

  useEffect(() => {
    if (open && listRef.current) {
      const activeEl = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [open, activeIndex])

  function choose(option: AdminSelectOption) {
    if (option.disabled) return
    if (!isControlled) {
      setInternalValue(option.value)
    }
    onChange?.(option.value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return

    if (event.key === 'Escape' || event.key === 'Tab') {
      setOpen(false)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open && options[activeIndex]) {
        choose(options[activeIndex])
      } else {
        setOpen(true)
      }
      return
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      setOpen(true)
      const enabled = options.map((opt, i) => ({ opt, i })).filter(({ opt }) => !opt.disabled)
      const target = event.key === 'Home' ? enabled[0] : enabled.at(-1)
      if (target) setActiveIndex(target.i)
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
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
    <div
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setOpen(false)
        }
      }}
      className={`relative ${open ? 'z-40' : 'z-auto'} ${className}`}
    >
      {name && <input type="hidden" name={name} value={internalValue} />}
      <button
        id={selectId}
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-label={label}
        role="combobox"
        aria-autocomplete="none"
        aria-activedescendant={open ? `${selectId}-option-${activeIndex}` : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${selectId}-listbox`}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onKeyDown}
        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-gray-300 dark:border-white/[0.16] bg-[#F8F9FA] dark:bg-[#111216] px-3 text-left text-sm text-gray-900 dark:text-[#eeeeee] transition hover:border-gray-400 dark:hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS} ${buttonClassName}`}
      >
        <span className={selected ? 'truncate' : 'truncate text-gray-500 dark:text-zinc-400'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-gray-500 dark:text-zinc-400 transition-transform duration-150 ${
            open ? 'rotate-180 text-[#ff8a50]' : ''
          }`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          ref={listRef}
          id={`${selectId}-listbox`}
          role="listbox"
          aria-label={label ?? placeholder}
          className={`absolute left-0 z-50 min-w-full max-h-64 overflow-y-auto rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111216] p-1.5 shadow-2xl shadow-black/80 ${
            openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {options.map((option, index) => {
            const isSelected = option.value === internalValue
            const isActive = index === activeIndex
            return (
              <button
                key={option.value}
                id={`${selectId}-option-${index}`}
                data-index={index}
                tabIndex={-1}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                  isActive ? 'bg-gray-100 dark:bg-white/[0.08] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-zinc-300'
                } ${isSelected ? 'font-semibold text-gray-900 dark:text-white' : ''} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <CheckIcon className="h-4 w-4 shrink-0 text-[#ff8a50]" aria-hidden />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
