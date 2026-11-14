const SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i
const HTTP_SCHEME_RE = /^https?:\/\//i
const DOMAIN_HOST_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i
const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export type ProjectUrlResult = {
  url: string | null
  error: string | null
}

/**
 * Normalise et valide une URL de projet facultative (sans exiger https:// à la saisie).
 * Accepte une chaîne vide ou composée uniquement d'espaces comme absence d'URL.
 */
export function parseOptionalProjectUrl(value: unknown): ProjectUrlResult {
  if (value == null) return { url: null, error: null }
  if (typeof value !== 'string') return { url: null, error: 'URL invalide.' }

  const trimmed = value.trim()
  if (!trimmed) return { url: null, error: null }

  if (SCHEME_RE.test(trimmed) && !HTTP_SCHEME_RE.test(trimmed)) {
    return { url: null, error: 'L’URL doit commencer par http:// ou https://.' }
  }

  const candidate = HTTP_SCHEME_RE.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const parsed = new URL(candidate)
    const hostname = parsed.hostname.toLowerCase()
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { url: null, error: 'L’URL doit commencer par http:// ou https://.' }
    }
    if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.local') || !DOMAIN_HOST_RE.test(hostname)) {
      return { url: null, error: 'Indiquez une URL publique valide (ex. https://mon-site.com).' }
    }
    return { url: parsed.toString().replace(/\/$/, ''), error: null }
  } catch {
    return { url: null, error: 'Indiquez une URL publique valide (ex. https://mon-site.com).' }
  }
}

export function normalizeProjectUrl(value: unknown): string | null {
  return parseOptionalProjectUrl(value).url
}
