import { Badge, statusTone } from '@/components/admin/ui'
import { FeedbackControls } from '@/components/admin/FeedbackControls'
import { TestimonialControl } from '@/components/admin/TestimonialControl'
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, formatDateTime, labelOf } from '@/lib/admin/format'
import type { AdminFeedback } from '@/lib/admin/data'

/** Un retour produit : lecture, décision (statut, priorité, note) et, si l'auteur l'autorise, publication du témoignage. */
export function FeedbackCard({ item, published, showTestimonial = true }: { item: AdminFeedback; published?: { quote: string; name: string; role: string } | null; showTestimonial?: boolean }) {
  const headingId = `retour-${item.id}`
  return (
    <article aria-labelledby={headingId} className="rounded-2xl border border-white/10 bg-[#1d1a18] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={headingId} className="text-base font-semibold">{labelOf(CATEGORY_LABELS, item.category)}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(item.status)}>{labelOf(STATUS_LABELS, item.status)}</Badge>
          <Badge tone={item.priority === 'high' ? 'danger' : 'neutral'}>Priorité {labelOf(PRIORITY_LABELS, item.priority).toLowerCase()}</Badge>
          <time dateTime={item.created_at} className="font-mono text-xs text-stone-400">{formatDateTime(item.created_at)}</time>
        </div>
      </div>
      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-stone-200">{item.message}</p>
      {item.context && <p className="mt-3 break-words font-mono text-xs text-stone-400">Contexte : {item.context}</p>}
      <p className="mt-3 text-xs text-stone-400">{item.allow_contact ? 'Recontact autorisé' : 'Recontact non autorisé'}</p>
      <FeedbackControls feedbackId={item.id} status={item.status} priority={item.priority} adminNote={item.admin_note} />
      {showTestimonial && item.allow_public_testimonial && <TestimonialControl feedbackId={item.id} message={item.message} published={published ?? null} />}
    </article>
  )
}
