'use client'
import Link from 'next/link'
import { formatDate, sourceLabels, type ActionItem } from '@/lib/feedback/types'
import { LaunchButton } from './ui/launch'

const priorityStyle = { high: 'bg-danger/10 text-danger', medium: 'bg-warning/10 text-ink-primary', low: 'bg-elevated text-ink-secondary' }
const priorityLabel = { high: 'Priorité haute', medium: 'Priorité moyenne', low: 'Priorité basse' }

export function RecommendationCard({ recommendation, total, compact = false, example = false, disabled = false, onDecision }: { recommendation: ActionItem; total: number; compact?: boolean; example?: boolean; disabled?: boolean; onDecision?: (decision: 'accept' | 'later' | 'dismiss') => void }) {
  const evidence = recommendation.evidence ?? []
  return <article className={compact ? '' : 'rounded-xl border border-border-strong bg-surface p-5 sm:p-8'}>
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs"><span className="font-medium text-ink-secondary">{example ? 'Exemple · Recommandation' : compact ? 'Recommandation' : 'Recommandation n°1'}</span>{recommendation.priority && <span className={`rounded-md px-2 py-1 font-medium ${priorityStyle[recommendation.priority]}`}>{priorityLabel[recommendation.priority]}</span>}</div>
    <h2 className={`mt-4 max-w-3xl font-semibold leading-tight tracking-tight text-ink-primary ${compact ? 'text-lg' : 'text-2xl sm:text-3xl'}`}>{recommendation.title}</h2>
    <p className="mt-4 text-sm leading-6 text-ink-secondary">{recommendation.rationale || recommendation.action || 'Une recommandation tirée des avis de votre projet.'}</p>
    <p className="mt-2 font-mono text-xs text-ink-secondary">{recommendation.feedback_ids.length} avis sources · {total} avis dans le projet</p>
    {evidence.length > 0 ? <ul className="mt-5 space-y-3">{evidence.slice(0, 3).map((item) => <li key={item.id} className="border-t border-border pt-3"><blockquote className="text-sm leading-6 text-ink-primary">« {item.content} »</blockquote><p className="mt-1 text-xs text-ink-secondary">{sourceLabels[item.source] ?? item.source} · <time dateTime={item.created_at}>{formatDate(item.created_at)}</time></p></li>)}</ul> : <p className="mt-5 text-xs text-ink-secondary">Aucun extrait disponible. Consultez les avis sources pour vérifier cette recommandation.</p>}
    {!example && <Link href={`/dashboard/feedback?recommendation=${encodeURIComponent(recommendation.id)}`} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-ink-primary underline underline-offset-4">Voir les {recommendation.feedback_ids.length} avis sources</Link>}
    {!compact && <div className="mt-6 flex flex-wrap gap-2"><LaunchButton disabled={disabled || example} onClick={() => onDecision?.('accept')}>Accepter</LaunchButton><LaunchButton variant="secondary" disabled={disabled || example} onClick={() => onDecision?.('later')}>Plus tard</LaunchButton><LaunchButton variant="secondary" disabled={disabled || example} onClick={() => onDecision?.('dismiss')}>Écarter</LaunchButton></div>}
  </article>
}
