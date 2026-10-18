import { getAdminContext } from '@/lib/admin/auth'
import { getAdminData } from '@/lib/admin/overview'

export default async function AdminEmailsPage() {
  await getAdminContext()
  const data = await getAdminData()
  return <div className="mx-auto max-w-7xl space-y-8"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ee6018]">Emails & relances</p><h1 className="mt-3 text-4xl font-semibold">Historique des envois</h1><p className="mt-3 text-sm text-zinc-400">Suivi réel des emails transactionnels et des relances.</p></header><section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111216]"><div className="grid grid-cols-[1fr_180px_140px] gap-4 border-b border-white/[0.08] p-5 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500"><span>Destinataire</span><span>Événement</span><span>Statut</span></div>{data.emailLog.map((email) => <div key={email.id} className="grid grid-cols-[1fr_180px_140px] gap-4 border-b border-white/[0.06] p-5 text-sm last:border-0"><span className="truncate text-zinc-200">{email.email}</span><span className="text-zinc-400">{email.event_type}</span><span className="text-zinc-500">{email.status}</span></div>)}</section></div>
}
