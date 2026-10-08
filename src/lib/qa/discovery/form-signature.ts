import { createHash } from 'node:crypto'
import type { DiscoveredForm, FormInfo } from '../types'

export function formSignature(form: Pick<FormInfo, 'action' | 'method' | 'fields'>, pageUrl: string): string {
  const action = form.action ? new URL(form.action, pageUrl) : null
  if (action) action.hash = ''
  return createHash('sha256').update(JSON.stringify([
    action?.toString() ?? '', (form.method || 'get').toUpperCase(), form.fields.map(field => field.name).sort(),
  ])).digest('hex')
}

export function matchFormBySignature<T extends FormInfo>(forms: T[], signature: string, pageUrl: string): T | undefined {
  return forms.find(form => formSignature(form, pageUrl) === signature)
}

export function deduplicateForms(forms: DiscoveredForm[]): DiscoveredForm[] {
  const bySignature = new Map<string, DiscoveredForm>()
  for (const form of forms) {
    const existing = bySignature.get(form.signature)
    if (!existing) {
      bySignature.set(form.signature, { ...form, occurrences: [...form.occurrences] })
      continue
    }
    for (const occurrence of form.occurrences) {
      if (!existing.occurrences.some(item => item.pageUrl === occurrence.pageUrl)) existing.occurrences.push(occurrence)
    }
    // Never let one testable occurrence conceal a blocked occurrence.
    if (!form.testability.testable) existing.testability = form.testability
  }
  return [...bySignature.values()]
}
