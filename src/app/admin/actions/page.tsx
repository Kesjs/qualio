import type { Metadata } from 'next'
import Link from 'next/link'
import { getAdminContext } from '@/lib/admin/auth'
import { getActionsPage } from '@/lib/admin/data'
import { listHref, parsePage } from '@/lib/admin/format'
import { BTN_SECONDARY, EmptyState, Notice, PageHeader, Pagination } from '@/components/admin/ui'
import { FeedbackCard } from '@/components/admin/FeedbackCard'

export const metadata: Metadata = { title: 'Actions prioritaires' }

export default async function AdminActionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await getAdminContext()
  const params = await searchParams
  const result = await getActionsPage({ page: parsePage(params.page) })
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Actions prioritaires"
        title="Décisions à prendre"
        description={result.total === 0 ? 'Aucun retour n’attend de décision.' : `${result.total} retour${result.total > 1 ? 's' : ''} attend${result.total > 1 ? 'ent' : ''} une décision : nouveaux, ou prioritaires et encore ouverts. Un retour quitte cette liste dès qu’il est traité, écarté ou archivé.`}
      />
      {result.failed && <Notice tone="warning">La liste n’a pas pu être lue en entier. Rechargez la page dans un instant.</Notice>}
      {result.rows.length === 0 ? (
        <EmptyState title="Tout est à jour" description="Chaque retour a reçu une décision. Les prochains retours apparaîtront ici." action={<Link href="/admin/feedback" className={BTN_SECONDARY}>Voir tous les retours</Link>} />
      ) : (
        <ul role="list" className="space-y-3">
          {result.rows.map((item) => <li key={item.id}><FeedbackCard item={item} showTestimonial={false} /></li>)}
        </ul>
      )}
      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} hrefFor={(page) => listHref('/admin/actions', { page })} />
    </div>
  )
}
