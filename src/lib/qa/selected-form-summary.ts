export function scanSummaryText(value: string | null | undefined): string {
  if (!value) return ''
  try {
    const summary = JSON.parse(value)
    if (summary.kind === 'selected_forms' && typeof summary.summary === 'string') return summary.summary
  } catch { /* Historical scans have plain-text summaries. */ }
  return value
}
