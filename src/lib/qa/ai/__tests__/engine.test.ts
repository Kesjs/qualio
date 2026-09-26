import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIEngine } from '../engine'
import { QAAIProvider, QAIncidentInput } from '../types'
import { QAAIDiagnostic } from '../index'
import { Incident } from '../../evidence'

class MockProvider implements QAAIProvider {
  public mockResponse: QAAIDiagnostic | null = null

  async diagnose(input: QAIncidentInput): Promise<QAAIDiagnostic | null> {
    return this.mockResponse
  }
}

describe('AIEngine', () => {
  let engine: AIEngine
  let mockProvider: MockProvider

  beforeEach(() => {
    process.env.QA_AI_PROVIDER = 'mock'
    mockProvider = new MockProvider()
    engine = new AIEngine()
    // Inject mock provider
    ;(engine as any).provider = mockProvider
  })

  it('Test 2: Preuve insuffisante (probable_cause = null)', async () => {
    const incident: Incident = {
      id: 'inc_1', category: 'forms', title: 'Form error', severity: 'minor', pageId: 'page_1',
      checks: [
        { id: 'ev_1', scanId: 'scan_1', pageId: 'page_1', category: 'forms', key: 'form_err', status: 'failed', severity: 'minor', title: 'Error', message: 'Submit failed', duration: 100 }
      ]
    }

    mockProvider.mockResponse = {
      title: 'FORM SUBMISSION FAILED', severity: 'minor', summary: 'The form submission failed.',
      impact: 'Users cannot submit the form.', probable_cause: null, recommendation: 'Check form action.',
      confidence: 0.8,
      evidence: [{ id: 'ev_1', type: 'playwright', reason: 'Failed' }]
    }

    const result = await engine.diagnoseIncident(incident)
    expect(result).not.toBeNull()
    expect(result?.probable_cause).toBeNull()
  })

  it('Test 3: Fake evidence ID rejection', async () => {
    const incident: Incident = {
      id: 'inc_1', category: 'forms', title: 'Form error', severity: 'minor', pageId: 'page_1',
      checks: [
        { id: 'ev_1', scanId: 'scan_1', pageId: 'page_1', category: 'forms', key: 'form_err', status: 'failed', severity: 'minor', title: 'Error', message: 'Submit failed', duration: 100 }
      ]
    }

    mockProvider.mockResponse = {
      title: 'ERROR', severity: 'minor', summary: 'Sum', impact: 'Imp', probable_cause: null, recommendation: 'Rec', confidence: 0.8,
      evidence: [{ id: 'FAKE_ID', type: 'playwright', reason: 'Fake' }] // Fake ID
    }

    const result = await engine.diagnoseIncident(incident)
    expect(result).toBeNull() // Should be rejected
  })

  it('Test 1: HTTP 500 error diagnostic validation', async () => {
    const incident: Incident = {
      id: 'inc_1', category: 'network', title: 'HTTP 500', severity: 'critical', pageId: 'page_1',
      checks: [
        { id: 'ev_1', scanId: 'scan_1', pageId: 'page_1', category: 'network', key: 'net_err', status: 'failed', severity: 'critical', title: '500 Error', message: 'POST /api/payments -> 500', duration: 100 }
      ]
    }

    mockProvider.mockResponse = {
      title: 'PAYMENT API 500 ERROR', severity: 'critical', summary: 'The payment API returned a 500 error.',
      impact: 'Users cannot complete checkout.', probable_cause: 'Backend crash on payment processing.', recommendation: 'Check backend logs.',
      confidence: 0.9,
      evidence: [{ id: 'ev_1', type: 'network', reason: '500 error on POST' }]
    }

    const result = await engine.diagnoseIncident(incident)
    expect(result).not.toBeNull()
    expect(result?.severity).toBe('critical')
  })
})
