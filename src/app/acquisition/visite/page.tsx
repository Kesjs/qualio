'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

function safeDestination(raw: string | null) {
  if (!raw) return '/'
  const trimmed = raw.trim()
  return trimmed.startsWith('/') && !trimmed.startsWith('//') ? trimmed : '/'
}

export default function AcquisitionVisitPage() {
  const [target, setTarget] = useState('/')
  useEffect(() => {
    const dest = safeDestination(new URLSearchParams(window.location.search).get('destination'))
    setTarget(dest)
    const timer = window.setTimeout(() => { window.location.assign(dest) }, 600)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <main className="grid min-h-screen place-items-center bg-[#fafaf9] px-6 text-center text-stone-900">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Ouverture du rapport…</h1>
        <p className="mt-2 text-sm text-stone-600">Redirection automatique en cours.</p>
        <Link href={target} className="mt-6 inline-flex min-h-10 items-center rounded-lg bg-[#c2410c] px-4 text-sm font-semibold text-white hover:bg-[#9a3412]">
          Continuer maintenant
        </Link>
      </div>
    </main>
  )
}
