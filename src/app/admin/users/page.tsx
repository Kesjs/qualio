import { getAdminContext } from '@/lib/admin/auth'
import { getAdminData } from '@/lib/admin/overview'

export default async function AdminUsersPage() {
  await getAdminContext()
  const data = await getAdminData()
  return <div className="mx-auto max-w-7xl space-y-8"><header><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#ee6018]">Utilisateurs</p><h1 className="mt-3 text-4xl font-semibold">Comptes Qualio</h1><p className="mt-3 text-sm text-zinc-400">Tous les comptes authentifiés, avec leur rôle et leur date de création.</p></header><section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111216]"><div className="grid grid-cols-[1fr_140px_140px] gap-4 border-b border-white/[0.08] p-5 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500"><span>Email</span><span>Rôle</span><span>Créé le</span></div>{data.recentUsers.map((user) => <div key={user.id} className="grid grid-cols-[1fr_140px_140px] gap-4 border-b border-white/[0.06] p-5 text-sm last:border-0"><span className="truncate text-zinc-200">{user.email ?? 'Email indisponible'}</span><span className="text-zinc-400">{user.role}</span><span className="text-zinc-500">{new Date(user.created_at).toLocaleDateString('fr-FR')}</span></div>)}</section></div>
}
