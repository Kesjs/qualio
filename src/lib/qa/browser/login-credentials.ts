import type { JourneyDefinition } from '../types'
import type { LoginTestCredentials } from './submit-selected-form'
import { getSiteSecretName } from '../security/site-secrets'

/** Reuse explicitly configured journey secret references; never infer secret values. */
export function loginCredentialsForPage(journeys: JourneyDefinition[], secrets: Map<string, string>, pageUrl: string): LoginTestCredentials | undefined {
  for (const journey of journeys) {
    if (!journey.startUrl || new URL(journey.startUrl).pathname !== new URL(pageUrl).pathname) continue
    const credentials: Partial<LoginTestCredentials> = {}
    for (const step of journey.steps) {
      if (step.action.type !== 'fill') continue
      const fields = typeof step.action.value === 'object' ? Object.entries(step.action.value)
        : [[step.action.target ?? '', step.action.value ?? step.action.details?.value]]
      for (const [selector, reference] of fields) {
        if (typeof reference !== 'string') continue
        const secretName = getSiteSecretName(reference)
        const value = secretName ? secrets.get(secretName) : undefined
        if (!value) continue
        if (/password|motdepasse|mot_de_passe/i.test(String(selector))) credentials.password = value
        else if (/email|mail/i.test(String(selector))) credentials.email = value
        else if (/user|login|identifiant/i.test(String(selector))) credentials.username = value
      }
    }
    if (credentials.password && (credentials.email || credentials.username)) return credentials as LoginTestCredentials
  }
  // Canonical test credentials configured directly in site-secrets.
  const password = secrets.get('TEST_PASSWORD')
  const email = secrets.get('TEST_EMAIL')
  const username = secrets.get('TEST_USERNAME')
  return password && (email || username) ? { password, email, username } : undefined
}
