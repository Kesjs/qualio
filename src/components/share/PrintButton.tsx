'use client'

import { useEffect } from 'react'

/** Bouton « Enregistrer en PDF » : ouvre l'impression du navigateur (choisir « Enregistrer au format PDF »). */
export function PrintButton({ autoPrint = false }: { autoPrint?: boolean }) {
  useEffect(() => {
    if (!autoPrint) return
    const timer = window.setTimeout(() => window.print(), 400)
    return () => window.clearTimeout(timer)
  }, [autoPrint])
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-gray-950 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c2410c] print:hidden">
      Enregistrer en PDF
    </button>
  )
}
