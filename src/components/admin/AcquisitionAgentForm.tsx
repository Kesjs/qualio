'use client'

import { useState } from 'react'

export function AcquisitionAgentForm() {
  const [query, setQuery] = useState('intercom.com\nqonto.com\nalgolia.com')
  const [state, setState] = useState<{ kind: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ kind: 'idle', message: '' })
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState({ kind: 'loading', message: 'Recherche en cours…' })
    try {
      const response = await fetch('/api/admin/acquisition/domain-search', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ targets: query }) })
      const payload = await response.json().catch(() => ({}))
      setState(response.ok ? { kind: 'success', message: `${payload.companiesAdded ?? 0} domaine(s) ajouté(s). Ouvre Prospects pour lancer l’analyse publique.` } : { kind: 'error', message: payload.error ?? `L’ajout a échoué (HTTP ${response.status}).` })
    } catch (error) {
      setState({ kind: 'error', message: error instanceof TypeError ? 'Qualio ne parvient pas à joindre son serveur. Vérifie la connexion puis réessaie.' : 'La recherche a échoué. Réessaie dans un instant.' })
    }
  }
  return <form onSubmit={submit} className="space-y-4 rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#111216] p-5"><div><label htmlFor="acquisition-query" className="block text-sm font-semibold">Domaines à analyser</label><p className="mt-1 text-sm leading-6 text-gray-500 dark:text-zinc-400">Un domaine par ligne. Aucun fournisseur externe n’est nécessaire pour cette étape.</p></div><textarea id="acquisition-query" value={query} onChange={(event) => setQuery(event.target.value)} rows={4} maxLength={1200} className="min-h-11 w-full rounded-lg border border-gray-300 dark:border-white/[0.16] bg-white dark:bg-[#0B0C0E] px-3 py-2 text-sm text-gray-900 dark:text-[#eeeeee] outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a50]" /><button type="submit" disabled={state.kind === 'loading' || !query.trim()} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#c2410c] px-4 text-sm font-semibold text-white transition hover:bg-[#9a3412] disabled:cursor-wait disabled:opacity-60">{state.kind === 'loading' ? 'Ajout…' : 'Ajouter les domaines'}</button>{state.message && <p role={state.kind === 'error' ? 'alert' : 'status'} className={`text-sm ${state.kind === 'error' ? 'text-red-700 dark:text-red-300' : state.kind === 'success' ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-600 dark:text-zinc-300'}`}>{state.message}</p>}</form>
}
