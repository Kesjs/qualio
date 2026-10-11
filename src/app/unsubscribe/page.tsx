'use client'

import { useEffect, useState } from 'react'

export default function UnsubscribePage() {
  const [token, setToken] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  useEffect(() => { setToken(new URLSearchParams(window.location.search).get('token')) }, [])
  async function unsubscribe() {
    if (!token) return setState('error')
    setState('busy')
    const response = await fetch('/api/email/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
    setState(response.ok ? 'done' : 'error')
  }
  return <main className="grid min-h-screen place-items-center bg-[#fbfbfb] px-6 text-center text-gray-950 dark:bg-[#0b0c0e] dark:text-white"><div className="max-w-md"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ee6018]">Qualio</p>{state === 'done' ? <><h1 className="mt-3 text-3xl font-semibold">Vous ne recevrez plus le résumé.</h1><p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">Vous pouvez vous réabonner à tout moment depuis Réglages.</p></> : <><h1 className="mt-3 text-3xl font-semibold">Ne plus recevoir le résumé hebdomadaire ?</h1><p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">Les emails de sécurité et de connexion ne sont pas concernés.</p><button type="button" onClick={() => void unsubscribe()} disabled={state === 'busy' || !token} className="mt-6 min-h-11 rounded-xl bg-[#ee6018] px-5 text-sm font-bold text-white disabled:opacity-50">{state === 'busy' ? 'Confirmation…' : 'Me désinscrire'}</button>{state === 'error' ? <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">Ce lien est invalide ou expiré.</p> : null}</>}</div></main>
}
