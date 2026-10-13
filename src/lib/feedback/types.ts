export type Sentiment = 'positive' | 'neutral' | 'negative'

export type FeedbackItem = {
  id: string
  content: string
  source: 'manual' | 'widget' | 'csv' | string
  author_name: string | null
  author_email?: string | null
  source_url?: string | null
  theme: string | null
  sentiment: Sentiment | null
  status: 'open' | 'reviewed' | 'archived'
  created_at: string
  metadata?: { is_example?: boolean } | null
}

export type ThemeStat = {
  name: string
  isUnclassified: boolean
  current: number
  previous: number
  delta: number
  negative: number
  positive: number
  neutral: number
  spark: number[]
  sample: string | null
}

export type ActionItem = {
  id: string
  title: string
  description: string | null
  action?: string | null
  rationale?: string | null
  uncertainty?: string | null
  confidence?: 'high' | 'medium' | 'low' | null
  status: 'open' | 'accepted' | 'dismissed' | 'done'
  priority: 'high' | 'medium' | 'low' | null
  theme: string | null
  feedback_ids: string[]
  created_at: string
  decided_at?: string | null
  evidence?: Array<Pick<FeedbackItem, 'id' | 'content' | 'source' | 'created_at'>>
  effect?: { label: string; baselineCount: number; currentCount: number } | null
}

export type SynthesisSummary = { id: string; title: string; summary: string; created_at: string }

export type OverviewReady = {
  state: 'empty' | 'warming' | 'ready_to_synthesize' | 'ready'
  days: number
  project: { id: string; name: string | null; url: string | null; onboarding_method: 'widget' | 'import' | null }
  hasSource: boolean
  exampleCount: number
  counts: {
    total: number
    period: number
    previousPeriod: number
    positiveShare: number | null
    previousPositiveShare: number | null
    pendingActions: number
    unsynthesized: number
    missingForSynthesis: number
  }
  series: Array<{ date: string; total: number; negative: number; positive: number }>
  topThemes: ThemeStat[]
  actions: ActionItem[]
  recent: FeedbackItem[]
  synthesis: SynthesisSummary | null
}

export type Overview = { state: 'no_project'; project: null } | OverviewReady

export const sourceLabels: Record<string, string> = {
  manual: 'Ajout manuel',
  widget: 'Widget',
  csv: 'Import CSV',
}

export const sentimentLabels: Record<Sentiment, string> = { positive: 'Positif', neutral: 'Neutre', negative: 'Négatif' }

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(value))
}

export function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'à l’instant'
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  return days < 30 ? `il y a ${days} j` : formatDate(value)
}
