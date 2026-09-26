import { Incident } from '../evidence'
import { QAAIDiagnostic } from './index'
import { QAAIProvider, QAIncidentInput } from './types'
import { OpenAIQAProvider } from './providers/openai'
import { GeminiQAProvider } from './providers/gemini'
import { MockQAProvider } from './providers/mock'

export class AIEngine {
  private provider: QAAIProvider

  constructor() {
    const providerName = process.env.QA_AI_PROVIDER || 'openai'
    if (providerName === 'gemini') {
      this.provider = new GeminiQAProvider()
    } else if (providerName === 'mock') {
      this.provider = new MockQAProvider()
    } else {
      this.provider = new OpenAIQAProvider()
    }
  }

  /**
   * Translates an Incident (which aggregates raw CheckResults/Evidence) 
   * into a finalized AI Diagnostic.
   */
  public async diagnoseIncident(incident: Incident): Promise<QAAIDiagnostic | null> {
    const t0 = Date.now()
    // Prepare structured payload for the AI
    const payload: QAIncidentInput = {
      incident: {
        id: incident.id,
        category: incident.category,
        title: incident.title,
        severity: incident.severity,
      },
      observed_facts: {
        playwright_results: incident.checks.map(c => ({
          id: c.id,
          status: c.status,
          message: c.message,
          title: c.title,
          key: c.key,
          evidence: c.evidence,
        }))
      }
    }

    try {
      const diagnostic = await this.provider.diagnose(payload)
      
      if (diagnostic) {
        // Backend Validation (Schema validation done by structured outputs, but business rules checked here)
        if (!diagnostic.title || !diagnostic.summary || !diagnostic.impact || !diagnostic.severity || !diagnostic.recommendation) {
          console.error('[AI Engine] Invalid output structure (missing fields)', diagnostic)
          return null
        }

        // Evidence ID validation
        const inputEvidenceIds = new Set(payload.observed_facts.playwright_results.map(r => r.id))
        const hasInvalidEvidence = diagnostic.evidence?.some((ev: any) => !inputEvidenceIds.has(ev.id))
        if (hasInvalidEvidence) {
          console.error('[AI Engine] REJECT DIAGNOSTIC: Fake evidence ID detected', diagnostic.evidence)
          return null
        }
        
        // Ensure confidence is within bounds
        if (typeof diagnostic.confidence === 'number') {
          diagnostic.confidence = Math.max(0, Math.min(1, diagnostic.confidence))
        }

        console.log(`[AI Engine] Diagnosed incident ${incident.id} in ${Date.now() - t0}ms (success: true, validation_success: true)`)
        return diagnostic
      }
    } catch (e) {
      console.error(`[AI Engine] Diagnosed incident ${incident.id} in ${Date.now() - t0}ms (success: false)`)
      console.error('Error details:', e)
    }
    
    return null
  }
}

