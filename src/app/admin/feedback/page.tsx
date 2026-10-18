import type { Metadata } from 'next'
import { getAdminContext } from '@/lib/admin/auth'
import { getFeedbackPage, getPublishedTestimonials } from '@/lib/admin/data'
import { CATEGORY_LABELS, FEEDBACK_CATEGORIES, FEEDBACK_PRIORITIES, FEEDBACK_STATUSES, PRIORITY_LABELS, STATUS_LABELS, listHref, optionsOf, parseFilter, parsePage, parseText } from '@/lib/admin/format'
import { EmptyState, FilterBar, Notice, PageHeader, Pagination, SearchField, SelectField } from '@/components/admin/ui'
import { FeedbackCard } from '@/components/admin/FeedbackCard'

export const metadata: Metadata = { title: 'Retours produit' }

export default async function AdminFeedbackPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await getAdminContext()
  const params = await searchParams
  const status = parseFilter(params.status, FEEDBACK_STATUSES)
  const category = parseFilter(params.category, FEEDBACK_CATEGORIES)
  const priority = parseFilter(params.priority, FEEDBACK_PRIORITIES)
  const q = parseText(params.q)
  const result = await getFeedbackPage({ page: parsePage(params.page), status, category, priority, q })
  const published = await getPublishedTestimonials(result.rows.filter((item) => item.allow_public_testimonial).map((item) => item.id))
  const filtered = Boolean(status || category || priority || q)
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader eyebrow="Retours produit" title="Retours à examiner" description="Les retours envoyés par les utilisateurs, séparés des avis de leurs propres clients. Choisissez un statut, une priorité, ou laissez une note interne." />
      {result.failed && <Notice tone="warning">Les retours n’ont pas pu être lus en entier. Rechargez la page dans un instant.</Notice>}
      <FilterBar label="Filtrer les retours" resetHref="/admin/feedback">
        <SearchField label="Le message contient" name="q" value={q} />
        <SelectField label="Statut" name="status" value={status} allLabel="Tous les statuts" options={optionsOf(STATUS_LABELS, FEEDBACK_STATUSES)} />
        <SelectField label="Catégorie" name="category" value={category} allLabel="Toutes les catégories" options={optionsOf(CATEGORY_LABELS, FEEDBACK_CATEGORIES)} />
        <SelectField label="Priorité" name="priority" value={priority} allLabel="Toutes les priorités" options={optionsOf(PRIORITY_LABELS, FEEDBACK_PRIORITIES)} />
      </FilterBar>
      {result.rows.length === 0 ? (
        <EmptyState title={filtered ? 'Aucun retour ne correspond' : 'Aucun retour reçu pour le moment'} description={filtered ? 'Retirez un filtre pour élargir la liste.' : 'Les retours envoyés depuis le tableau de bord apparaîtront ici.'} />
      ) : (
        <ul role="list" className="space-y-3">
          {result.rows.map((item) => <li key={item.id}><FeedbackCard item={item} published={published.get(item.id) ?? null} /></li>)}
        </ul>
      )}
      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} hrefFor={(page) => listHref('/admin/feedback', { q, status, category, priority, page })} />
    </div>
  )
}
