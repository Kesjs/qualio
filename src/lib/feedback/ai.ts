import { GoogleGenAI, Type, type Schema } from '@google/genai'
import OpenAI from 'openai'

export type FeedbackForSynthesis = {
  id: string
  content: string
  author_name?: string | null
  theme?: string | null
  sentiment?: string | null
  created_at: string
}

export type FeedbackSynthesis = {
  title: string
  summary: string
  themes: Array<{
    name: string
    count: number
    insight: string
    feedback_ids: string[]
  }>
  recommendations: Array<{
    title: string
    action: string
    rationale: string
    priority: 'high' | 'medium' | 'low'
    feedback_ids: string[]
  }>
  _meta?: {
    tokens_input?: number
    tokens_output?: number
    cost_usd?: number
    model?: string
  }
}

const synthesisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'Titre court de la synthèse, en français.' },
    summary: { type: Type.STRING, description: 'Résumé factuel en 2 à 4 phrases, sans invention.' },
    themes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          count: { type: Type.INTEGER },
          insight: { type: Type.STRING },
          feedback_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['name', 'count', 'insight', 'feedback_ids'],
      },
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          action: { type: Type.STRING },
          rationale: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
          feedback_ids: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['title', 'action', 'rationale', 'priority', 'feedback_ids'],
      },
    },
  },
  required: ['title', 'summary', 'themes', 'recommendations'],
}

const openAiSynthesisSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    themes: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, count: { type: 'integer' }, insight: { type: 'string' }, feedback_ids: { type: 'array', items: { type: 'string' } } }, required: ['name', 'count', 'insight', 'feedback_ids'], additionalProperties: false } },
    recommendations: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, action: { type: 'string' }, rationale: { type: 'string' }, priority: { type: 'string', enum: ['high', 'medium', 'low'] }, feedback_ids: { type: 'array', items: { type: 'string' } } }, required: ['title', 'action', 'rationale', 'priority', 'feedback_ids'], additionalProperties: false } },
  },
  required: ['title', 'summary', 'themes', 'recommendations'],
  additionalProperties: false,
} as const

const SYSTEM_PROMPT = `Tu es l'analyste des avis clients de Qualio.
Tu produis une synthèse utile pour une équipe produit, en français.

Règles strictes :
1. Utilise uniquement les avis fournis. N'invente jamais de problème, de chiffre ou de citation.
2. Chaque thème et chaque recommandation doit citer uniquement les IDs des avis qui la justifient.
3. Le champ count doit correspondre au nombre d'IDs distincts cités pour le thème.
4. Une recommandation est une proposition humaine à examiner, jamais une action déjà réalisée.
5. Si les avis sont ambigus, écris-le clairement dans summary ou insight.
6. Retourne uniquement le JSON demandé.`

function cleanResult(value: unknown, validIds: Set<string>): FeedbackSynthesis | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const themes = Array.isArray(item.themes) ? item.themes : []
  const recommendations = Array.isArray(item.recommendations) ? item.recommendations : []
  const filterIds = (ids: unknown) => Array.from(new Set((Array.isArray(ids) ? ids : []).filter((id): id is string => typeof id === 'string' && validIds.has(id))))
  const cleanedThemes = themes.flatMap((theme) => {
    if (!theme || typeof theme !== 'object') return []
    const row = theme as Record<string, unknown>
    const feedbackIds = filterIds(row.feedback_ids)
    if (!String(row.name ?? '').trim() || !String(row.insight ?? '').trim() || feedbackIds.length === 0) return []
    return [{ name: String(row.name).trim().slice(0, 160), count: feedbackIds.length, insight: String(row.insight).trim().slice(0, 1000), feedback_ids: feedbackIds }]
  })
  const cleanedRecommendations = recommendations.flatMap((recommendation) => {
    if (!recommendation || typeof recommendation !== 'object') return []
    const row = recommendation as Record<string, unknown>
    const feedbackIds = filterIds(row.feedback_ids)
    const priority: 'high' | 'medium' | 'low' = row.priority === 'high' || row.priority === 'low' ? row.priority : 'medium'
    if (!String(row.title ?? '').trim() || !String(row.action ?? '').trim() || feedbackIds.length === 0) return []
    return [{ title: String(row.title).trim().slice(0, 300), action: String(row.action).trim().slice(0, 1000), rationale: String(row.rationale ?? '').trim().slice(0, 1000), priority, feedback_ids: feedbackIds }]
  })
  const title = String(item.title ?? '').trim()
  const summary = String(item.summary ?? '').trim()
  if (!title || !summary || cleanedThemes.length === 0) return null
  return { title: title.slice(0, 500), summary: summary.slice(0, 5000), themes: cleanedThemes, recommendations: cleanedRecommendations }
}

export async function generateFeedbackSynthesis(feedback: FeedbackForSynthesis[]): Promise<FeedbackSynthesis | null> {
  if (feedback.length === 0) return null
  const provider = (process.env.QA_AI_PROVIDER || 'openai').toLocaleLowerCase()
  let parsed: unknown = null
  let meta: FeedbackSynthesis['_meta'] | undefined
  if (provider === 'gemini') {
    if (!process.env.GEMINI_API_KEY) return null
    const model = process.env.GEMINI_QA_MODEL || 'gemini-3.8-flash'
    const response = await new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }).models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: JSON.stringify({ avis: feedback }) }] }],
      config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.15, responseMimeType: 'application/json', responseSchema: synthesisSchema },
    })
    parsed = response.text ? JSON.parse(response.text) : null
    const inputTokens = response.usageMetadata?.promptTokenCount
    const outputTokens = response.usageMetadata?.candidatesTokenCount
    meta = { tokens_input: inputTokens, tokens_output: outputTokens, cost_usd: typeof inputTokens === 'number' && typeof outputTokens === 'number' ? inputTokens * 0.075 / 1_000_000 + outputTokens * 0.30 / 1_000_000 : undefined, model }
  } else {
    if (!process.env.OPENAI_API_KEY) return null
    const model = process.env.OPENAI_QA_MODEL || 'gpt-5.6-luna'
    const response = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).chat.completions.create({
      model,
      temperature: 0.15,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: JSON.stringify({ avis: feedback }) }],
      response_format: { type: 'json_schema', json_schema: { name: 'feedback_synthesis', strict: true, schema: openAiSynthesisSchema } },
    })
    const content = response.choices[0]?.message?.content
    parsed = content ? JSON.parse(content) : null
    const inputTokens = response.usage?.prompt_tokens
    const outputTokens = response.usage?.completion_tokens
    meta = { tokens_input: inputTokens, tokens_output: outputTokens, cost_usd: typeof inputTokens === 'number' && typeof outputTokens === 'number' ? inputTokens * 5 / 1_000_000 + outputTokens * 15 / 1_000_000 : undefined, model: response.model }
  }
  const result = cleanResult(parsed, new Set(feedback.map((item) => item.id)))
  if (!result) return null
  result._meta = meta
  return result
}
