import { QAAIProvider, QAIncidentInput } from '../types'
import { QAAIDiagnostic } from '../index'

export class MockQAProvider implements QAAIProvider {
  public async diagnose(input: QAIncidentInput): Promise<QAAIDiagnostic | null> {
    const scenario = process.env.MOCK_QA_SCENARIO || 'valid'
    
    if (scenario === 'timeout') {
      await new Promise(r => setTimeout(r, 5000))
      throw new Error('Mock timeout')
    }

    if (scenario === 'error') {
      throw new Error('Mock provider error')
    }

    if (scenario === 'invalid_json') {
      // simulate returning null (which in the real engine happens when JSON parse fails)
      return null
    }

    // Default valid scenario
    const diag: QAAIDiagnostic = {
      title: 'MOCK DIAGNOSTIC',
      severity: 'major',
      summary: 'Mock summary',
      impact: 'Mock impact',
      probable_cause: 'Mock cause',
      recommendation: 'Mock recommendation',
      confidence: 0.9,
      evidence: input.observed_facts.playwright_results.map(r => ({
        id: r.id,
        type: 'playwright',
        reason: 'Mock reason'
      })),
      _meta: {
        tokens_input: 100,
        tokens_output: 50,
        cost_usd: 0,
        duration_ms: 100,
        model: 'mock-model'
      }
    }

    if (scenario === 'invalid_evidence') {
      diag.evidence = [{ id: 'fake-evidence-id', type: 'network', reason: 'fake' }]
    }

    if (scenario === 'invalid_confidence') {
      diag.confidence = 1.5 // > 1
    }

    if (scenario === 'incomplete') {
      // @ts-ignore
      delete diag.title
    }
    
    if (scenario === 'empty') {
      return null
    }

    return diag
  }
}
