import type { Metadata } from 'next'
import { getAdminContext } from '@/lib/admin/auth'
import { getEmailsPage } from '@/lib/admin/data'
import { EMAIL_STATUSES, EMAIL_STATUS_LABELS, EMAIL_TYPE_LABELS, formatDateTime, labelOf, listHref, optionsOf, parseFilter, parsePage } from '@/lib/admin/format'
import { Badge, EmptyState, FilterBar, Notice, PageHeader, Pagination, SelectField, TD, TH, TableRegion, emailTone } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Emails & relances' }

const TYPES = Object.keys(EMAIL_TYPE_LABELS)

export default async function AdminEmailsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await getAdminContext()
  const params = await searchParams
  const status = parseFilter(params.status, EMAIL_STATUSES)
  const type = parseFilter(params.type, TYPES)
  const result = await getEmailsPage({ page: parsePage(params.page), status, type })
  const filtered = Boolean(status || type)
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader eyebrow="Emails & relances" title="Historique des envois" description="Suivi réel des emails transactionnels et des relances, du plus récent au plus ancien." />
      {result.failed && <Notice tone="warning">L’historique n’a pas pu être lu en entier. Rechargez la page dans un instant.</Notice>}
      <FilterBar label="Filtrer les emails" resetHref="/admin/emails">
        <SelectField label="Statut" name="status" value={status} allLabel="Tous les statuts" options={optionsOf(EMAIL_STATUS_LABELS, EMAIL_STATUSES)} />
        <SelectField label="Type d’email" name="type" value={type} allLabel="Tous les types" options={optionsOf(EMAIL_TYPE_LABELS, TYPES)} />
      </FilterBar>
      {result.rows.length === 0 ? (
        <EmptyState title={filtered ? 'Aucun email ne correspond' : 'Aucun email envoyé pour le moment'} description={filtered ? 'Retirez un filtre pour élargir la liste.' : undefined} />
      ) : (
        <TableRegion label="Historique des emails">
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">Emails envoyés, page {result.page}</caption>
            <thead className="border-b border-white/10 bg-[#161413]">
              <tr><th scope="col" className={TH}>Date</th><th scope="col" className={TH}>Destinataire</th><th scope="col" className={TH}>Type</th><th scope="col" className={TH}>Statut</th></tr>
            </thead>
            <tbody className="divide-y divide-white/10 bg-[#1d1a18]">
              {result.rows.map((email) => (
                <tr key={email.id}>
                  <td className={`${TD} whitespace-nowrap font-mono text-stone-300`}><time dateTime={email.created_at}>{formatDateTime(email.created_at)}</time></td>
                  <th scope="row" className={`${TD} max-w-[20rem] text-left font-normal`}><span className="block truncate text-stone-100" title={email.recipient}>{email.recipient}</span></th>
                  <td className={`${TD} text-stone-300`}>{labelOf(EMAIL_TYPE_LABELS, email.event_type)}</td>
                  <td className={TD}>
                    <Badge tone={emailTone(email.status)}>{labelOf(EMAIL_STATUS_LABELS, email.status)}</Badge>
                    {email.status === 'failed' && email.last_error && <p className="mt-1 max-w-xs break-words font-mono text-xs text-red-300">{email.last_error}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      )}
      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} hrefFor={(page) => listHref('/admin/emails', { status, type, page })} />
    </div>
  )
}
