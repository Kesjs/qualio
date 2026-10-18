import { getAdminContext } from '@/lib/admin/auth'
import { getAdminData } from '@/lib/admin/overview'

const labels: Record<string, string> = { improvement: 'Amélioration', bug: 'Bug', difficulty: 'Difficulté', positive: 'Positif', other: 'Autre' }
export default async function AdminActionsPage() {
  await getAdminContext()
  const data = await getAdminData()
  const actions = data.latestFeedback.filter((item) => item.status === 'new' || item.priority === 'high')
  return <div className="mx-auto max-w-7xl space-y-8"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ee6018]">Actions prioritaires</p><h1 className="mt-3 text-4xl font-semibold">Décisions à prendre</h1><p className="mt-3 text-sm text-zinc-400">{actions.length} élément(s) nécessitent une décision.</p></header><section className="grid gap-4">{actions.map((item) => <article key={item.id} className="rounded-2xl border border-orange-500/20 bg-[#16181E] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{labels[item.category] ?? item.category}</h2><span className="text-xs font-bold text-orange-300">{item.priority === 'high' ? 'Prioritaire' : 'Nouveau'}</span></div><p className="mt-3 text-sm leading-6 text-zinc-300">{item.message}</p><p className="mt-3 text-xs text-zinc-500">Statut actuel : {item.status}</p></article>)}</section></div>
}
