import { getAdminContext } from '@/lib/admin/auth'
import { getAdminData } from '@/lib/admin/overview'

const labels: Record<string, string> = { improvement: 'Amélioration', bug: 'Bug', difficulty: 'Difficulté', positive: 'Positif', other: 'Autre' }
export default async function AdminFeedbackPage() {
  await getAdminContext()
  const data = await getAdminData()
  return <div className="mx-auto max-w-7xl space-y-8"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ee6018]">Retours produit</p><h1 className="mt-3 text-4xl font-semibold">Retours à examiner</h1><p className="mt-3 text-sm text-zinc-400">{data.metrics.newFeedback} nouveau(x) retour(s) sur {data.metrics.feedback} au total.</p></header><section className="space-y-3">{data.latestFeedback.map((item) => <article key={item.id} className="rounded-2xl border border-white/[0.08] bg-[#111216] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#ee6018]">{labels[item.category] ?? item.category}</span><span className="text-xs text-zinc-500">{new Date(item.created_at).toLocaleDateString('fr-FR')} · {item.status} · {item.priority}</span></div><p className="mt-4 text-sm leading-6 text-zinc-200">{item.message}</p><p className="mt-3 text-xs text-zinc-500">{item.allow_contact ? 'Recontact autorisé' : 'Recontact non autorisé'}</p></article>)}</section></div>
}
