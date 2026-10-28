'use client'

import { useEffect, useRef, useState } from 'react'
import { FOCUS } from '@/components/admin/ui'
import type { CitySuggestion } from '@/app/api/admin/acquisition/cities/route'

export type CityAutocompleteProps = {
  id?: string
  value: string
  onChange: (city: string) => void
  onSelectSuggestion?: (suggestion: CitySuggestion) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CityAutocomplete({
  id = 'city-autocomplete',
  value,
  onChange,
  onSelectSuggestion,
  placeholder = 'Ex: Lille, Lyon, Cotonou, Bruxelles…',
  className = '',
  disabled = false,
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const text = event.target.value
    onChange(text)

    if (timerRef.current) clearTimeout(timerRef.current)

    if (text.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/admin/acquisition/cities?q=${encodeURIComponent(text.trim())}`
        )
        if (response.ok) {
          const data = (await response.json()) as { cities: CitySuggestion[] }
          setSuggestions(data.cities ?? [])
          setOpen((data.cities ?? []).length > 0)
          setActiveIndex(-1)
        }
      } catch (err) {
        console.error('[CityAutocomplete] fetch error', err)
      } finally {
        setLoading(false)
      }
    }, 280)
  }

  function pick(suggestion: CitySuggestion) {
    onChange(suggestion.city)
    onSelectSuggestion?.(suggestion)
    setOpen(false)
    setSuggestions([])
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
      return
    }

    if (event.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        event.preventDefault()
        pick(suggestions[activeIndex])
      }
      return
    }

    if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={`relative ${open ? 'z-40' : 'z-auto'} ${className}`}>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          maxLength={120}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={`min-h-11 w-full rounded-lg border border-gray-300 dark:border-white/[0.16] bg-[#F8F9FA] dark:bg-[#111216] px-3 pr-8 text-sm text-gray-900 dark:text-[#eeeeee] placeholder:text-gray-400 dark:placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="h-4 w-4 animate-spin text-[#ff8a50]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111216] p-1.5 shadow-2xl shadow-black/80"
        >
          {suggestions.map((item, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={`${item.osm_type}-${item.osm_id}-${index}`}
                type="button"
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pick(item)}
                className={`flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition ${
                  isActive ? 'bg-gray-100 dark:bg-white/[0.08] text-gray-900 dark:text-white' : 'text-gray-600 dark:text-zinc-300'
                }`}
              >
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.city}</span>
                <span className="text-xs text-gray-500 dark:text-zinc-400">{item.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
