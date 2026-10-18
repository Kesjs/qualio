'use client'

import { useState } from 'react'
import { inputClass } from './ui'

const colors = ['#c2410c', '#ee6018', '#111827', '#2563eb', '#047857', '#be185d']
export function ColorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const invalid = draft !== null && !/^#[0-9a-f]{6}$/i.test(draft)
  return <div className="mt-2 space-y-2">
    <div className="flex items-center gap-2"><span aria-hidden className="h-9 w-9 shrink-0 rounded-md border border-gray-300 dark:border-white/20" style={{ backgroundColor: value }} /><input aria-label="Couleur du widget au format hexadécimal" aria-invalid={invalid} value={draft ?? value} maxLength={7} spellCheck={false} onChange={(event) => { const next = event.target.value; setDraft(next); if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next) }} onBlur={() => setDraft(null)} className={`${inputClass} w-28 font-mono text-sm`} /></div>
    <div role="group" aria-label="Couleurs proposées" className="flex flex-wrap gap-1">{colors.map((color) => <button key={color} type="button" aria-label={`Choisir ${color}`} aria-pressed={value.toLowerCase() === color} onClick={() => { setDraft(null); onChange(color) }} className="h-8 w-8 rounded-md border border-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 aria-pressed:ring-2 aria-pressed:ring-gray-500 dark:border-white/20" style={{ backgroundColor: color }} />)}</div>
    {invalid && <p role="status" className="text-xs text-red-600 dark:text-red-300">Format attendu : #c2410c</p>}
  </div>
}
