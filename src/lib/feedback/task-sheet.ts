import { redactPersonalInfo } from '@/lib/feedback/redact'

export type TaskSheetData = {
  projectName: string
  task: {
    id: string
    title: string
    action: string | null
    rationale: string | null
    uncertainty: string | null
    priority: 'high' | 'medium' | 'low' | null
    confidence: 'high' | 'medium' | 'low' | null
    theme: string | null
    reviewCount: number
    createdAt: string
  }
  reviews: Array<{ id: string; content: string; created_at: string; source: string }>
}

const MAX_REVIEWS = 5
const MAX_REVIEW_LENGTH = 280

/**
 * Données d'une tâche à partager. Seuls le texte des avis cités (sans auteur, sans e-mail, coordonnées masquées),
 * leur date et leur source sont exposés. Appelé côté serveur avec le client admin.
 */
export async function loadTaskSheet(admin: any, recommendationId: string): Promise<TaskSheetData | null> {
  const { data: rec } = await admin.from('feedback_recommendations')
    .select('id, site_id, title, action, description, rationale, uncertainty, priority, confidence, theme, feedback_ids, created_at')
    .eq('id', recommendationId).maybeSingle()
  if (!rec) return null
  const ids = ((rec.feedback_ids ?? []) as string[]).slice(0, 20)
  const [{ data: site }, { data: items }] = await Promise.all([
    admin.from('sites').select('name, url').eq('id', rec.site_id).maybeSingle(),
    ids.length
      ? admin.from('feedback_items').select('id, content, created_at, source').in('id', ids).eq('site_id', rec.site_id).neq('status', 'locked').order('created_at', { ascending: false }).limit(MAX_REVIEWS)
      : Promise.resolve({ data: [] }),
  ])
  return {
    projectName: site?.name || site?.url || 'Projet',
    task: {
      id: rec.id,
      title: rec.title,
      action: rec.action ?? rec.description ?? null,
      rationale: rec.rationale ?? null,
      uncertainty: rec.uncertainty ?? null,
      priority: rec.priority ?? null,
      confidence: rec.confidence ?? null,
      theme: rec.theme ?? null,
      reviewCount: (rec.feedback_ids ?? []).length,
      createdAt: rec.created_at,
    },
    reviews: ((items ?? []) as Array<{ id: string; content: string; created_at: string; source: string }>).map((item) => {
      const clean = redactPersonalInfo(item.content).replace(/\s+/g, ' ').trim()
      return { id: item.id, content: clean.length > MAX_REVIEW_LENGTH ? `${clean.slice(0, MAX_REVIEW_LENGTH - 1).trimEnd()}…` : clean, created_at: item.created_at, source: item.source }
    }),
  }
}
