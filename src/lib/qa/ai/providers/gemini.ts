import { GoogleGenAI, Type, Schema } from '@google/genai'
import { QAAIProvider, QAIncidentInput } from '../types'
import { QAAIDiagnostic, QUALIO_SYSTEM_PROMPT } from '../index'

export class GeminiQAProvider implements QAAIProvider {
  private client: GoogleGenAI
  private model: string

  constructor() {
    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || ''
    })
    this.model = process.env.GEMINI_QA_MODEL || 'gemini-3.8-flash'
  }

  public async diagnose(input: QAIncidentInput): Promise<QAAIDiagnostic | null> {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('No GEMINI_API_KEY found, skipping AI diagnostics')
      return null
    }

    const startMs = Date.now()
    try {
      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Un titre court et explicite du bug, en majuscules (ex: FORMULAIRE DE PAIEMENT INUTILISABLE)'
          },
          severity: {
            type: Type.STRING,
            enum: ['critical', 'major', 'minor'],
            description: 'Sévérité basée sur l\'impact utilisateur réellement observable.'
          },
          summary: {
            type: Type.STRING,
            description: 'Le constat brut : ce qui s\'est passé concrètement, en une phrase.'
          },
          impact: {
            type: Type.STRING,
            description: 'L\'impact métier ou utilisateur direct (ex: Les visiteurs ne peuvent pas acheter). Doit être rédigé pour un lecteur non-technique, sans jargon (HTTP, API, sélecteur DOM). Formule en termes d\'action utilisateur empêchée (acheter, s\'inscrire, contacter, naviguer). Si un viewport est spécifié dans test_context, l\'intégrer explicitement (ex: "Sur mobile, les visiteurs ne peuvent pas valider leur commande"). Ne jamais inventer de chiffres ou pourcentages.'
          },
          probable_cause: {
            type: Type.STRING,
            nullable: true,
            description: 'Hypothèse technique uniquement si les preuves permettent d\'en formuler une. Sinon null.'
          },
          recommendation: {
            type: Type.STRING,
            description: 'Action suggérée pour le développeur afin de corriger ou investiguer le problème.'
          },
          confidence: {
            type: Type.NUMBER,
            description: 'Score de certitude de l\'IA entre 0.0 et 1.0 (ex: 0.95).'
          },
          evidence: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { 
                  type: Type.STRING, 
                  enum: ['playwright', 'network', 'console', 'screenshot', 'dom', 'trace'] 
                },
                reason: { type: Type.STRING }
              },
              required: ['id', 'type', 'reason'],
            }
          }
        },
        required: [
          'title',
          'severity',
          'summary',
          'impact',
          'recommendation',
          'confidence',
          'evidence'
        ],
      }

      const response = await this.client.models.generateContent({
        model: this.model,
        contents: [
          { role: 'user', parts: [{ text: JSON.stringify(input) }] }
        ],
        config: {
          systemInstruction: QUALIO_SYSTEM_PROMPT,
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema,
        }
      })

      const endMs = Date.now()
      const content = response.text
      if (content) {
        const diag = JSON.parse(content) as QAAIDiagnostic
        
        // Handle Gemini not outputting null sometimes for string/nullable fields
        if (diag.probable_cause === "") {
          diag.probable_cause = null
        }

        const promptTokens = response.usageMetadata?.promptTokenCount
        const completionTokens = response.usageMetadata?.candidatesTokenCount
        
        let cost: number | null = null
        if (typeof promptTokens === 'number' && typeof completionTokens === 'number') {
          // Gemini Flash pricing: Input $0.075 / 1M, Output $0.30 / 1M
          cost = (promptTokens * 0.075 / 1000000) + (completionTokens * 0.30 / 1000000)
        }

        diag._meta = {
          tokens_input: promptTokens,
          tokens_output: completionTokens,
          duration_ms: endMs - startMs,
          cost_usd: cost ?? undefined,
          model: this.model
        }
        return diag
      }
    } catch (e) {
      console.error('GeminiQAProvider error during diagnosis:', e)
    }
    
    return null
  }
}
