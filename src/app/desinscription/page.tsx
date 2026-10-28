'use client'

import { useEffect, useState } from 'react'

/** Page publique : un prospect se désinscrit sans compte, en un clic. */
export default function DesinscriptionPage() {
  const [token, setToken] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
  useEffect(() => { setToken(new URLSearchParams(window.location.search).get('token')) }, [])
  async function unsubscribe() {
    if (!token) return setState('error')
    setState('busy')
    const response = await fetch('/api/acquisition/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).catch(() => null)
    setState(response?.ok ? 'done' : 'error')
  }
  return (
    <main className="grid min-h-screen place-items-center bg-[#fbfbfb] px-6 text-center text-gray-950 dark:bg-[#0b0c0e] dark:text-white">
      <div className="max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ee6018]">Qualio</p>
        {state === 'done' ? (
          <>
            <h1 className="mt-3 text-3xl font-semibold">C’est fait.</h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">Votre adresse est retirée de nos envois : vous ne recevrez plus de message de Qualio. Nous conservons uniquement l’adresse pour respecter ce choix.</p>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-3xl font-semibold">Ne plus recevoir de messages de Qualio ?</h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-zinc-400">Un clic suffit, sans compte. Votre adresse sera exclue de toute prospection future.</p>
            <button type="button" onClick={() => void unsubscribe()} disabled={state === 'busy' || !token} className="mt-6 min-h-11 rounded-xl bg-[#ee6018] px-5 text-sm font-bold text-white disabled:opacity-50">{state === 'busy' ? 'Confirmation…' : 'Me désinscrire'}</button>
            {state === 'error' || (!token && state === 'idle') ? <p role="alert" className="mt-4 text-sm text-red-700 dark:text-red-300">Ce lien est invalide ou a expiré. Répondez « stop » à l’email reçu, ou écrivez à contact@tryqualio.pro.</p> : null}
          </>
        )}
        <p className="mt-8 text-xs text-gray-400 dark:text-zinc-500"><a href="/confidentialite" className="underline">Comment vos données sont utilisées</a></p>
      </div>
    </main>
  )
}
