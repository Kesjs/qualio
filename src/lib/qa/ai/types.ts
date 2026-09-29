import type { QAAIDiagnostic } from './index'

export interface QAIncidentInput {
  incident: {
    id: string
    category: string
    title: string
    severity: string
  }
  test_context?: {
    url?: string
    test_action?: string
    viewport?: {
      name: string
      width: number
      height: number
    }
  }
  observed_facts: {
    playwright_results: Array<{
      id: string
      status: string
      message: string
      title: string
      key: string
      evidence?: Array<{ type: string; payload: Record<string, unknown> }>
    }>
  }
}

export interface QAAIProvider {
  /**
   * Translates an structured incident input into a structured diagnostic output
   */
  diagnose(input: QAIncidentInput): Promise<QAAIDiagnostic | null>
}
