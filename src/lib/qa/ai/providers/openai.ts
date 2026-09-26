import OpenAI from 'openai'
import { QAAIProvider, QAIncidentInput } from '../types'
import { QAAIDiagnostic, QUALIO_SYSTEM_PROMPT } from '../index'

export class OpenAIQAProvider implements QAAIProvider {
  private openai: OpenAI
  private model: string

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    })
    this.model = process.env.OPENAI_QA_MODEL || 'gpt-5.6-luna'
  }

  public async diagnose(input: QAIncidentInput): Promise<QAAIDiagnostic | null> {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('No OPENAI_API_KEY found, skipping AI diagnostics')
      return null
    }

    const startMs = Date.now()
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        temperature: 0.1,
        messages: [
          { role: 'system', content: QUALIO_SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(input) }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'qa_diagnostic',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'Un titre court et explicite du bug, en majuscules (ex: FORMULAIRE DE PAIEMENT INUTILISABLE)'
                },
                severity: {
                  type: 'string',
                  enum: ['critical', 'major', 'minor'],
                  description: 'Sévérité basée sur l\'impact utilisateur réellement observable.'
                },
                summary: {
                  type: 'string',
                  description: 'Le constat brut : ce qui s\'est passé concrètement, en une phrase.'
                },
                impact: {
                  type: 'string',
                  description: 'L\'impact métier ou utilisateur direct (ex: Les visiteurs ne peuvent pas acheter).'
                },
                probable_cause: {
                  type: ['string', 'null'],
                  description: 'Hypothèse technique uniquement si les preuves permettent d\'en formuler une. Sinon null.'
                },
                recommendation: {
                  type: 'string',
                  description: 'Action suggérée pour le développeur afin de corriger ou investiguer le problème.'
                },
                confidence: {
                  type: 'number',
                  description: 'Score de certitude de l\'IA entre 0.0 et 1.0 (ex: 0.95).'
                },
                evidence: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      type: { type: 'string', enum: ['playwright', 'network', 'console', 'screenshot', 'dom', 'trace'] },
                      reason: { type: 'string' }
                    },
                    required: ['id', 'type', 'reason'],
                    additionalProperties: false
                  }
                }
              },
              required: [
                'title',
                'severity',
                'summary',
                'impact',
                'probable_cause',
                'recommendation',
                'confidence',
                'evidence'
              ],
              additionalProperties: false
            }
          }
        }
      })

      const endMs = Date.now()
      const content = completion.choices[0]?.message?.content
      if (content) {
        const diag = JSON.parse(content) as QAAIDiagnostic
        
        // Calculate cost based on gpt-4o pricing (using as proxy for gpt-5.6-luna for now)
        // input: $5.00 / 1M tokens, output: $15.00 / 1M tokens
        const promptTokens = completion.usage?.prompt_tokens || 0
        const completionTokens = completion.usage?.completion_tokens || 0
        const cost = (promptTokens * 5 / 1000000) + (completionTokens * 15 / 1000000)

        diag._meta = {
          tokens_input: promptTokens,
          tokens_output: completionTokens,
          duration_ms: endMs - startMs,
          cost_usd: cost,
          model: completion.model
        }
        return diag
      }
    } catch (e) {
      console.error('OpenAIQAProvider error during diagnosis:', e)
    }
    
    return null
  }
}
