import { CheckResult, IssueSeverity, Evidence } from '../types'

export interface Incident {
  id: string
  category: string
  pageId: string | null
  title: string
  severity: IssueSeverity
  checks: CheckResult[]
}

export class EvidenceEngine {
  /**
   * Transforms raw Playwright/browser checks into deduplicated, correlated Incidents.
   * Rule: 40 checks -> 5 incidents.
   */
  public groupChecksIntoIncidents(checks: CheckResult[]): Incident[] {
    const failedChecks = checks.filter(c => c.status === 'failed' && c.severity)
    const incidentsMap = new Map<string, Incident>()

    for (const check of failedChecks) {
      // Basic grouping key: category + page + key (or title)
      // This is a simplistic correlation strategy. In a real world, this could involve more heuristics.
      const groupingKey = `${check.category}_${check.pageId}_${check.key}`

      if (incidentsMap.has(groupingKey)) {
        const existing = incidentsMap.get(groupingKey)!
        existing.checks.push(check)
        // Upgrade severity if current check is critical and existing is not
        if (check.severity === 'critical' && existing.severity !== 'critical') {
          existing.severity = 'critical'
        }
      } else {
        incidentsMap.set(groupingKey, {
          id: crypto.randomUUID(),
          category: check.category,
          pageId: check.pageId,
          title: check.title || 'Unknown Issue',
          severity: check.severity as IssueSeverity,
          checks: [check],
        })
      }
    }

    return Array.from(incidentsMap.values())
  }
}
