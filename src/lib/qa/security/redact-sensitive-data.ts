const REDACTED = '[REDACTED]'
const MAX_STRING_LENGTH = 4_000
const SENSITIVE_KEY = /^(authorization|cookie|set-cookie|x-api-key|access_token|refresh_token|code|secret|password)$/i
const SENSITIVE_QUERY_PARAM = /^(access_token|refresh_token|token|code|secret|password|api_key|apikey|key)$/i

function redactUrl(value: string): string {
  try {
    const url = new URL(value)
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_QUERY_PARAM.test(key)) url.searchParams.set(key, REDACTED)
    }
    return url.toString()
  } catch {
    return value
  }
}

function redactString(value: string): string {
  const redactedHeaders = value
    .replace(/(authorization\s*[:=]\s*)([^\s,;]+)/gi, `$1${REDACTED}`)
    .replace(/((?:access_token|refresh_token|password|secret|api[_-]?key)\s*[:=]\s*)([^\s,;&]+)/gi, `$1${REDACTED}`)
  return redactUrl(redactedHeaders).slice(0, MAX_STRING_LENGTH)
}

export function redactSensitiveData(value: unknown, key = ''): unknown {
  if (SENSITIVE_KEY.test(key)) return REDACTED
  if (typeof value === 'string') return redactString(value)
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => redactSensitiveData(item))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 100)
        .map(([childKey, childValue]) => [childKey, redactSensitiveData(childValue, childKey)])
    )
  }
  return value
}

export { REDACTED }
