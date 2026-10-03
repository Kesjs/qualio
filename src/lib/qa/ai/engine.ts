import { Incident } from '../evidence'
import { QAAIDiagnostic } from './index'
import { QAAIProvider, QAIncidentInput } from './types'
import { OpenAIQAProvider } from './providers/openai'
import { GeminiQAProvider } from './providers/gemini'
import { MockQAProvider } from './providers/mock'
import { redactSensitiveData } from '../security/redact-sensitive-data'

export class AIEngine {
  private provider: QAAIProvider
  public lastStatus: 'not_needed' | 'success' | 'failed' = 'not_needed'
  public lastError: string | null = null

  constructor() {
    const providerName = process.env.QA_AI_PROVIDER || 'openai'
    if (providerName === 'gemini') {
      this.provider = new GeminiQAProvider()
    } else if (providerName === 'mock') {
      if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ROUTES !== 'true') {
        throw new Error('The mock AI provider is disabled in production.')
      }
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
    this.lastStatus = 'failed'
    this.lastError = null
    const t0 = Date.now()
    // Prepare structured payload for the AI
    const firstEvidence = incident.checks.flatMap((check) => check.evidence ?? [])[0]
    const evidencePayload = firstEvidence?.payload ?? {}
    const payload: QAIncidentInput = {
      incident: {
        id: incident.id,
        category: incident.category,
        title: incident.title,
        severity: incident.severity,
      },
      test_context: incident.viewport ? {
        viewport: incident.viewport,
        url: typeof evidencePayload.url === 'string' ? evidencePayload.url : undefined,
        test_action: typeof evidencePayload.action === 'string' ? evidencePayload.action : undefined,
      } : {
        url: typeof evidencePayload.url === 'string' ? evidencePayload.url : undefined,
        test_action: typeof evidencePayload.action === 'string' ? evidencePayload.action : undefined,
      },
      observed_facts: {
        playwright_results: incident.checks.map(c => ({
          id: c.id,
          status: c.status,
          message: c.message,
          title: c.title,
          key: c.key,
          evidence: redactSensitiveData(c.evidence ?? []) as Array<{ type: string; payload: Record<string, unknown> }>,
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

        // Keep diagnostics created before the correction-prompt contract backwards compatible.
        // New providers populate these fields; legacy providers receive conservative fallbacks.
        diagnostic.expected ??= 'The tested user action should complete successfully.'
        diagnostic.actual ??= diagnostic.summary
        diagnostic.repro_steps ??= []
        diagnostic.locate_hints ??= []
        diagnostic.acceptance_check ??= 'Repeat the observed action and confirm the expected user-visible result.'
        diagnostic.uncertainties ??= ['The diagnostic predates the correction-prompt context contract.']

        // Evidence ID validation
        const inputEvidenceIds = new Set(payload.observed_facts.playwright_results.map(r => r.id))
        const hasInvalidEvidence = diagnostic.evidence?.some((ev) => !inputEvidenceIds.has(ev.id))
        if (hasInvalidEvidence) {
          console.error('[AI Engine] REJECT DIAGNOSTIC: Fake evidence ID detected', diagnostic.evidence)
          return null
        }
        
        // Ensure confidence is within bounds
        if (typeof diagnostic.confidence === 'number') {
          diagnostic.confidence = Math.max(0, Math.min(1, diagnostic.confidence))
        }

        console.log(`[AI Engine] Diagnosed incident ${incident.id} in ${Date.now() - t0}ms (success: true, validation_success: true)`)
        this.lastStatus = 'success'
        return diagnostic
      }
    } catch (e) {
      console.error(`[AI Engine] Diagnosed incident ${incident.id} in ${Date.now() - t0}ms (success: false)`)
      console.error('Error details:', e)
      this.lastError = e instanceof Error ? e.message : 'AI provider error'
    }
    
    return null
  }
}
