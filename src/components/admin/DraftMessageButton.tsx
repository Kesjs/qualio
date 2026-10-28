'use client'

import { useState } from 'react'

export function DraftMessageButton({ contactId, generic }: { contactId: string; generic: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  async function createDraft() { setState('loading'); const response = await fetch('/api/admin/acquisition/draft', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contactId }) }); setState(response.ok ? 'done' : 'idle') }
  return <div className="flex items-center gap-2"><button type="button" onClick={createDraft} disabled={state !== 'idle'} className="min-h-9 rounded-lg border border-[#ee6018]/60 px-3 text-xs font-semibold text-[#c2410c] dark:text-[#ffb08a] hover:bg-[#ee6018]/10 disabled:opacity-60">{state === 'loading' ? 'Création…' : state === 'done' ? 'Brouillon créé' : 'Générer un brouillon'}</button>{generic && <span className="text-xs text-amber-700 dark:text-amber-300">Adresse générique</span>}</div>
}
