import { validateFormSelection } from '@/lib/qa/discovery/validate-selection'
import type { FormSelection } from '@/lib/qa/types'

/** A monitor reuses the last explicitly consented selection, never all forms. */
export function monitoredFormSelection(value: unknown, siteUrl: string, targetUrl?: string | null): FormSelection[] {
  const selection = validateFormSelection(value, siteUrl)
  if (!targetUrl) return selection
  const target = new URL(targetUrl, siteUrl)
  return selection.filter(form => new URL(form.pageUrl).pathname === target.pathname)
}
