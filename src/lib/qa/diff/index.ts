import { Issue } from '../types'
import { Incident } from '../evidence'

export interface DiffResult {
  resolved: Issue[]
  persistent: { issue: Issue; incident: Incident }[]
  newIncidents: Incident[]
}

export class DiffEngine {
  /**
   * Compares the previous scan's issues with the current scan's incidents
   * to determine what is resolved, persistent, and new.
   */
  public diff(previousIssues: Issue[], currentIncidents: Incident[]): DiffResult {
    const resolved: Issue[] = []
    const persistent: { issue: Issue; incident: Incident }[] = []
    const newIncidents: Incident[] = []

    const currentMatched = new Set<string>()

    for (const oldIssue of previousIssues) {
      // Find a matching incident in the current scan by category
      const matchIndex = currentIncidents.findIndex(
        inc => inc.category === oldIssue.category && !currentMatched.has(inc.id)
      )

      if (matchIndex !== -1) {
        const incident = currentIncidents[matchIndex]
        persistent.push({ issue: oldIssue, incident })
        currentMatched.add(incident.id)
      } else {
        resolved.push(oldIssue)
      }
    }

    // Any current incident that wasn't matched is new
    for (const incident of currentIncidents) {
      if (!currentMatched.has(incident.id)) {
        newIncidents.push(incident)
      }
    }

    return { resolved, persistent, newIncidents }
  }
}
