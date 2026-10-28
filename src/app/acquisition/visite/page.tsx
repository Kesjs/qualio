'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AcquisitionVisitPage() {
  useEffect(() => {
    const destination = new URLSearchParams(window.location.search).get('destination') || '/'
    const timer = window.setTimeout(() => { window.location.assign(destination) }, 1500)
    return () => window.clearTimeout(timer)
  }, [])

  return <main className="grid min-h-screen place-items-center bg-[#fafaf9] px-6 text-center text-stone-900"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ee6018]">Qualio</p><h1 className="mt-4 text-2xl font-semibold">Ouverture de la page…</h1><p className="mt-2 text-sm text-stone-600">Vous allez être redirigé dans un instant.</p><Link href="/" className="mt-6 inline-flex rounded-lg bg-[#ee6018] px-4 py-2 text-sm font-semibold text-white">Continuer</Link></div></main>
}
