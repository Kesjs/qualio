/** Mise en page commune des emails Qualio : texte écrit en dur, valeurs dynamiques toujours échappées. */

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char)
}

export function plural(count: number, one: string, many: string) {
  return `${count} ${count > 1 ? many : one}`
}

export function renderEmail(input: {
  heading: string
  lines: string[]
  cta?: { label: string; url: string }
  unsubscribeUrl?: string
}) {
  const ctaHtml = input.cta
    ? `<p style="margin-top:24px"><a href="${escapeHtml(input.cta.url)}" style="display:inline-block;background:#ee6018;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">${escapeHtml(input.cta.label)}</a></p>`
    : ''
  const unsubscribeHtml = input.unsubscribeUrl
    ? `<p style="font-size:12px;color:#666"><a href="${escapeHtml(input.unsubscribeUrl)}">Ne plus recevoir ces emails</a></p>`
    : ''
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#171717"><p style="color:#ee6018;font-weight:700">QUALIO</p><h1>${escapeHtml(input.heading)}</h1>${input.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}${ctaHtml}${unsubscribeHtml}</div>`
  const text = [
    input.heading,
    ...input.lines,
    input.cta ? `${input.cta.label} : ${input.cta.url}` : '',
    input.unsubscribeUrl ? `Ne plus recevoir ces emails : ${input.unsubscribeUrl}` : '',
  ].filter(Boolean).join('\n\n')
  return { html, text }
}
