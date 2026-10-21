'use client'

import { useState } from 'react'

export function ProspectActions({ companyId }: { companyId: string }) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  async function scan() { setLoading(true); setMessage('Analyse…'); const response = await fetch('/api/admin/acquisition/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ companyId }) }); const data = await response.json().catch(() => ({})); setMessage(response.ok ? `${data.signals} signal(s) · ${data.emails} email(s)` : data.error ?? 'Échec'); setLoading(false) }
  return <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={scan} disabled={loading} className="min-h-10 rounded-lg border border-white/20 px-3 text-xs font-semibold text-stone-200 hover:bg-white/[0.08] disabled:opacity-60">{loading ? 'Analyse…' : 'Analyser le site'}</button>{message && <span className="text-xs text-stone-400" role="status">{message}</span>}</div>
}
