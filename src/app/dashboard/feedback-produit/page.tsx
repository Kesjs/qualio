'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Select } from '@/components/dashboard/Select'

type Feedback = { id: string; category: string; message: string; status: string; priority: string; created_at: string }

export default function ProductFeedbackPage() {
  const [category, setCategory] = useState('improvement')
  const [message, setMessage] = useState('')
  const [allowContact, setAllowContact] = useState(false)
  const [allowPublicTestimonial, setAllowPublicTestimonial] = useState(false)
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [feedback, setFeedback] = useState<Feedback[]>([])

  useEffect(() => { fetch('/api/product-feedback').then((response) => response.ok ? response.json() : null).then((payload) => setFeedback(payload?.feedback ?? [])).catch(() => undefined) }, [state])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('sending')
    try {
      const response = await fetch('/api/product-feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ category, message, allowContact, allowPublicTestimonial }) })
      setState(response.ok ? 'sent' : 'error')
      if (response.ok) setMessage('')
    } catch {
      setState('error')
    }
  }

  return <section className="max-w-3xl space-y-8 pb-16">
    <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ee6018]">Premiers utilisateurs</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 dark:text-white">Aidez-nous à améliorer Qualio</h1><p className="mt-3 max-w-xl text-sm leading-6 text-gray-500 dark:text-zinc-400">Votre retour reste privé. Nous vous recontacterons uniquement si vous l’autorisez.</p></div>
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-white/[0.08] dark:bg-[#181B21]">
      <div className="space-y-2 text-sm font-semibold"><p>Type de retour</p><Select label="Type de retour" value={category} onChange={setCategory} options={[{ value: 'improvement', label: 'Idée d’amélioration' }, { value: 'bug', label: 'Bug' }, { value: 'difficulty', label: 'Difficulté d’utilisation' }, { value: 'positive', label: 'Ce qui fonctionne bien' }, { value: 'other', label: 'Autre' }]} /></div>
      <label className="block text-sm font-semibold">Votre retour<textarea required minLength={10} maxLength={4000} rows={7} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Qu’essayiez-vous de faire ? Qu’est-ce qui vous a aidé ou bloqué ?" className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-normal dark:border-white/10 dark:bg-white/[0.04]" /></label>
      <label className="flex gap-3 text-sm text-gray-600 dark:text-zinc-300"><input type="checkbox" checked={allowContact} onChange={(event) => setAllowContact(event.target.checked)} className="mt-1" />Vous pouvez me recontacter pour préciser ce retour.</label>
      <label className="flex gap-3 text-sm text-gray-600 dark:text-zinc-300"><input type="checkbox" checked={allowPublicTestimonial} onChange={(event) => setAllowPublicTestimonial(event.target.checked)} className="mt-1" />Je pourrais accepter que ce retour devienne un témoignage, après validation.</label>
      {state === 'sent' && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Merci. Votre retour a bien été enregistré.</p>}
      {state === 'error' && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">Impossible d’enregistrer le retour. Réessayez.</p>}
      <button disabled={state === 'sending'} className="min-h-11 rounded-lg bg-[#ee6018] px-5 text-sm font-bold text-white disabled:opacity-50">{state === 'sending' ? 'Envoi…' : 'Envoyer mon retour'}</button>
    </form>
    {feedback.length > 0 && <div className="space-y-3"><h2 className="text-lg font-semibold text-gray-950 dark:text-white">Mes retours</h2>{feedback.map((item) => <article key={item.id} className="rounded-xl border border-gray-200/80 bg-white p-4 dark:border-white/[0.08] dark:bg-[#181B21]"><div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500"><span>{item.category} · priorité {item.priority}</span><span>{new Date(item.created_at).toLocaleDateString('fr-FR')}</span></div><p className="mt-3 text-sm leading-6 text-gray-800 dark:text-zinc-200">{item.message}</p><p className="mt-3 text-xs font-semibold text-[#ee6018]">Statut : {item.status}</p></article>)}</div>}
  </section>
}
