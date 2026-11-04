import type { FeedbackSynthesis } from '@/lib/feedback/ai'
import type { PublicReview } from '@/lib/admin/acquisition-reviews'

/** Nombre maximal d'avis envoyés à l'IA : les plus récents, pour un coût borné. */
export const REPORT_MAX_REVIEWS = 300
export const REPORT_MIN_REVIEWS = 8

export type ReportQuote = { text: string; rating: number | null }
export type ReportProblem = { title: string; action: string; theme: string; rationale: string; priority: 'high' | 'medium' | 'low'; confidence: 'high' | 'medium' | 'low'; mentions: number; quotes: ReportQuote[] }
export type ReportTheme = { name: string; mentions: number; insight: string; negativeShare: number | null }
export type ProspectReport = {
  title: string
  summary: string
  reviewCount: number
  averageRating: number | null
  ratingDistribution: number[]
  negativeCount: number
  periodStart: string | null
  periodEnd: string | null
  themes: ReportTheme[]
  problems: ReportProblem[]
  model: string | null
}

const sentimentOf = (rating: number | null) => (rating == null ? null : rating <= 2 ? 'negative' : rating === 3 ? 'neutral' : 'positive')

/** Extrait court et lisible ; coupe sur un mot et retire emails / numéros pour ne pas republier de données personnelles. */
export function quoteExcerpt(text: string, max = 200) {
  const clean = text.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]').replace(/(?:\+?\d[\s.-]?){7,14}\d/g, '[numéro]').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 30)).replace(/[,;:.\s]+$/, '')}…`
}

export function reportToken() {
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  return Buffer.from(bytes).toString('base64url')
}

/** Assemble le rapport à partir de la synthèse : chaque chiffre est recalculé depuis les avis cités (jamais depuis l'IA). */
export function assembleReport(reviews: PublicReview[], synthesis: FeedbackSynthesis): ProspectReport {
  const byId = new Map(reviews.map((review) => [review.id, review]))
  const rated = reviews.filter((review) => review.rating != null)
  const distribution = [1, 2, 3, 4, 5].map((star) => rated.filter((review) => review.rating === star).length)
  const negatives = rated.filter((review) => (review.rating ?? 5) <= 2)
  const dates = reviews.map((review) => review.created_at).sort()
  const cited = (ids: string[]) => ids.map((id) => byId.get(id)).filter((review): review is PublicReview => Boolean(review))
  const priorityRank = { high: 0, medium: 1, low: 2 } as const

  const problems = synthesis.recommendations
    .map((item) => {
      const sources = cited(item.feedback_ids)
      // Les citations privilégient les avis les plus critiques, puis les plus explicites.
      const quotes = [...sources]
        .sort((a, b) => (a.rating ?? 3) - (b.rating ?? 3) || b.content.length - a.content.length)
        .slice(0, 2)
        .map((review) => ({ text: quoteExcerpt(review.content), rating: review.rating }))
      return { title: item.title, action: item.action, theme: item.theme, rationale: item.rationale, priority: item.priority, confidence: item.confidence, mentions: sources.length, quotes }
    })
    .filter((item) => item.mentions >= 2)
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.mentions - a.mentions)
    .slice(0, 3)

  const themes = synthesis.themes
    .map((theme) => {
      const sources = cited(theme.feedback_ids)
      const ratedSources = sources.filter((review) => review.rating != null)
      return {
        name: theme.name,
        mentions: sources.length,
        insight: theme.insight,
        negativeShare: ratedSources.length ? Math.round((ratedSources.filter((review) => (review.rating ?? 5) <= 2).length / ratedSources.length) * 100) : null,
      }
    })
    .filter((theme) => theme.mentions > 0)
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 6)

  return {
    title: synthesis.title,
    summary: synthesis.summary,
    reviewCount: reviews.length,
    averageRating: rated.length ? Math.round((rated.reduce((sum, review) => sum + (review.rating ?? 0), 0) / rated.length) * 10) / 10 : null,
    ratingDistribution: distribution,
    negativeCount: negatives.length,
    periodStart: dates[0] ?? null,
    periodEnd: dates[dates.length - 1] ?? null,
    themes,
    problems,
    model: synthesis._meta?.model ?? null,
  }
}

export async function analyzePublicReviews(input: PublicReview[]): Promise<ProspectReport> {
  const reviews = [...input].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, REPORT_MAX_REVIEWS)
  if (reviews.length < REPORT_MIN_REVIEWS) throw new Error(`Il faut au moins ${REPORT_MIN_REVIEWS} avis pour un rapport crédible (${reviews.length} trouvé${reviews.length > 1 ? 's' : ''}).`)
  const { generateFeedbackSynthesis } = await import('@/lib/feedback/ai')
  const synthesis = await generateFeedbackSynthesis(
    reviews.map((review) => ({ id: review.id, content: review.title ? `${review.title}. ${review.content}` : review.content, sentiment: sentimentOf(review.rating), created_at: review.created_at })),
  )
  if (!synthesis) throw new Error('L’analyse IA n’a rien renvoyé. Vérifie la clé du fournisseur IA puis réessaie.')
  const report = assembleReport(reviews, synthesis)
  if (!report.problems.length) throw new Error('Aucun problème récurrent n’est appuyé par au moins deux avis : pas assez de matière pour un rapport utile.')
  return report
}

/** Phrase d'accroche de l'email, construite uniquement à partir des chiffres du rapport. */
export function reportHook(report: Pick<ProspectReport, 'reviewCount' | 'problems'>, sourceLabel: string) {
  const top = report.problems[0]
  return {
    intro: `J’ai lu vos ${report.reviewCount} derniers avis ${sourceLabel}.`,
    finding: top ? `Le point qui revient le plus : « ${top.title} » (${top.mentions} avis le mentionnent).` : '',
    problemCount: report.problems.length,
  }
}

