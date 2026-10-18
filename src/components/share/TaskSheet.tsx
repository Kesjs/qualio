import Link from 'next/link'
import { PRIORITY_LABELS, sourceLabels } from '@/lib/feedback/types'
import type { TaskSheetData } from '@/lib/feedback/task-sheet'
import { PrintButton } from './PrintButton'

const CONFIDENCE_LABELS = { high: 'Confiance élevée', medium: 'Confiance moyenne', low: 'Confiance faible' } as const
const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })

/** Fiche de tâche lisible sans compte : titre, raison, avis cités, priorité. Mise en page propre à l'impression (PDF). */
export function TaskSheet({ data, autoPrint = false, preview = false }: { data: TaskSheetData; autoPrint?: boolean; preview?: boolean }) {
  const { task, reviews, projectName } = data
  return (
    <main className="mx-auto max-w-2xl space-y-6 bg-white p-6 text-gray-900 print:max-w-none print:p-0">
      <style>{'@media print { @page { margin: 16mm } body { background: #fff !important } }'}</style>
      {preview && <p role="status" className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 print:hidden">Aperçu privé : seul vous le voyez. Pour l’envoyer, utilisez « Lien de partage » dans le menu Partager.</p>}
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#c2410c]">Tâche · {projectName}</p>
        <h1 className="mt-2 text-2xl font-bold leading-tight">{task.title}</h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
          <span className="font-semibold">Priorité {PRIORITY_LABELS[task.priority ?? 'medium'].toLowerCase()}</span>
          {task.confidence && <span>{CONFIDENCE_LABELS[task.confidence]}</span>}
          {task.theme && <span>Thème : {task.theme}</span>}
          <span>{task.reviewCount} {task.reviewCount > 1 ? 'avis à l’appui' : 'avis à l’appui'}</span>
        </p>
      </header>

      {task.action && <section><h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-600">À faire</h2><p className="mt-2 whitespace-pre-line text-base leading-7">{task.action}</p></section>}
      {task.rationale && <section><h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-600">Pourquoi</h2><p className="mt-2 text-base leading-7 text-gray-800">{task.rationale}</p></section>}
      {task.uncertainty && <p className="text-sm leading-6 text-amber-900">À vérifier : {task.uncertainty}</p>}

      {reviews.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-600">Avis qui justifient cette tâche</h2>
          <ul className="mt-3 space-y-2">
            {reviews.map((review) => (
              <li key={review.id} className="break-inside-avoid rounded-lg bg-gray-50 px-4 py-3 print:border print:border-gray-200">
                <blockquote className="text-sm leading-6">« {review.content} »</blockquote>
                <p className="mt-1 text-xs text-gray-600">{dateFormat.format(new Date(review.created_at))} · {sourceLabels[review.source] ?? review.source}</p>
              </li>
            ))}
          </ul>
          {task.reviewCount > reviews.length && <p className="mt-2 text-xs text-gray-600">{reviews.length} avis affichés sur {task.reviewCount}. Les coordonnées personnelles sont masquées.</p>}
        </section>
      )}

      <div className="print:hidden"><PrintButton autoPrint={autoPrint} /></div>
      <footer className="border-t pt-4 text-xs text-gray-600">
        Propulsé par <Link href="/" className="font-semibold text-gray-900 underline underline-offset-2">Qualio</Link>, la synthèse d’avis clients avec les avis à l’appui de chaque conseil. Les tendances observées ne prouvent pas un lien de cause à effet.
      </footer>
    </main>
  )
}
