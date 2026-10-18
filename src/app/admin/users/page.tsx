import type { Metadata } from 'next'
import { getAdminContext } from '@/lib/admin/auth'
import { getUsersPage } from '@/lib/admin/data'
import { formatDate, formatDateTime, listHref, parsePage, parseText } from '@/lib/admin/format'
import { Badge, EmptyState, FilterBar, Notice, PageHeader, Pagination, SearchField, TD, TH, TH_RIGHT, TableRegion } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Utilisateurs' }

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await getAdminContext()
  const params = await searchParams
  const q = parseText(params.q)
  const result = await getUsersPage({ page: parsePage(params.page), q })
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader eyebrow="Utilisateurs" title="Comptes Qualio" description="Tous les comptes authentifiés, du plus récent au plus ancien, avec leur plan et leur nombre de projets." />
      {result.failed && <Notice tone="warning">La liste des comptes n’a pas pu être lue en entier. Rechargez la page dans un instant.</Notice>}
      {result.truncated && <Notice tone="info">Affichage limité aux 5 000 premiers comptes.</Notice>}
      <FilterBar label="Rechercher un compte" resetHref="/admin/users">
        <SearchField label="Email contient" name="q" value={q} placeholder="prenom@exemple.com" />
      </FilterBar>
      {result.rows.length === 0 ? (
        <EmptyState title={q ? 'Aucun compte ne correspond' : 'Aucun compte pour le moment'} description={q ? 'Essayez une autre partie de l’adresse email.' : undefined} />
      ) : (
        <TableRegion label="Liste des comptes">
          <table className="w-full min-w-[720px] text-sm">
            <caption className="sr-only">Comptes Qualio, page {result.page}</caption>
            <thead className="border-b border-white/10 bg-[#161413]">
              <tr><th scope="col" className={TH}>Email</th><th scope="col" className={TH}>Plan</th><th scope="col" className={TH_RIGHT}>Projets</th><th scope="col" className={TH}>Inscrit le</th><th scope="col" className={TH}>Dernière connexion</th></tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-[#1d1a18]">
              {result.rows.map((user) => (
                <tr key={user.id}>
                  <th scope="row" className={`${TD} max-w-[22rem] text-left font-normal`}>
                    <span className="flex items-center gap-2"><span className="truncate text-stone-100" title={user.email ?? undefined}>{user.email ?? 'Email indisponible'}</span>{user.isAdmin && <Badge tone="accent">Admin</Badge>}</span>
                  </th>
                  <td className={TD}>{user.plan ? <Badge>{user.plan}</Badge> : <span className="text-stone-400">—</span>}</td>
                  <td className={`${TD} text-right font-mono`}>{user.projects}</td>
                  <td className={`${TD} font-mono text-stone-300`}><time dateTime={user.created_at}>{formatDate(user.created_at)}</time></td>
                  <td className={`${TD} font-mono text-stone-300`}>{user.last_sign_in_at ? <time dateTime={user.last_sign_in_at}>{formatDateTime(user.last_sign_in_at)}</time> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      )}
      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} hrefFor={(page) => listHref('/admin/users', { q, page })} />
    </div>
  )
}
