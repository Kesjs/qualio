import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import type { BrowserContext } from 'playwright-core'

function isPrivateIpv4(address: string): boolean {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return true
  const [a, b, c] = parts
  return a === 0 || a === 10 || a === 100 && b >= 64 && b <= 127 || a === 127
    || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 0
    || a === 192 && b === 168 || a === 198 && b >= 18 && b <= 19
    || a === 192 && b === 2 || a === 198 && b === 51 && c === 100
    || a === 203 && b === 0 && c === 113 || a >= 224
}

function mappedIpv4FromIpv6(address: string): string | null {
  const value = address.toLowerCase().split('%')[0]
  if (!value.includes(':')) return null
  const groups = value.split(':')
  const lastTwo = groups.slice(-2)
  if (lastTwo.length !== 2 || lastTwo.some(group => !/^[0-9a-f]{1,4}$/.test(group))) return null
  const high = Number.parseInt(lastTwo[0], 16)
  const low = Number.parseInt(lastTwo[1], 16)
  const prefix = groups.slice(0, -2).join(':')
  if (!prefix.includes('ffff') && !value.startsWith('::ffff:')) return null
  return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`
}

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase().split('%')[0]
  if (normalized.startsWith('::ffff:') && normalized.slice(7).includes('.')) return isPrivateIpv4(normalized.slice(7))
  if (isIP(normalized) === 4) return isPrivateIpv4(normalized)
  if (isIP(normalized) === 6) {
    const mappedIpv4 = mappedIpv4FromIpv6(normalized)
    if (mappedIpv4) return isPrivateIpv4(mappedIpv4)
    return normalized === '::' || normalized === '::1'
      || normalized.startsWith('fc') || normalized.startsWith('fd')
      || normalized.startsWith('2001:db8') || normalized.startsWith('ff') || /^fe[89ab]/.test(normalized)
  }
  return true
}

/** Reject private, loopback and link-local destinations before browser work begins. */
export async function assertPublicScanUrl(url: string): Promise<void> {
  const parsed = new URL(url)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS scan URLs are allowed')
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs containing credentials are not allowed')
  }
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    throw new Error('Only standard HTTP and HTTPS ports are allowed')
  }
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (!hostname || hostname.endsWith('.') || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === 'metadata.google.internal' || hostname.endsWith('.metadata.google.internal')) {
    throw new Error('This URL is not allowed for security reasons')
  }

  if (isIP(hostname) !== 0 && isPrivateAddress(hostname)) {
    throw new Error('This URL resolves to a private or reserved network address')
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true })
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('This URL resolves to a private or reserved network address')
  }
}

/** Fetch a crawler resource without following an unchecked redirect. */
export async function fetchPublicResource(
  url: string,
  init: RequestInit = {},
  maxRedirects = 5,
): Promise<Response> {
  let currentUrl = url

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    await assertPublicScanUrl(currentUrl)
    const response = await fetch(currentUrl, { ...init, redirect: 'manual' })
    const location = response.headers.get('location')
    if (!location || response.status < 300 || response.status >= 400) return response
    currentUrl = new URL(location, currentUrl).toString()
  }

  throw new Error('Too many redirects while fetching a public resource')
}

/**
 * Protect every browser request, including redirects and subresources.
 * The initial URL check alone is insufficient because a public hostname can
 * redirect to a private address after navigation has started.
 */
export async function installPublicNetworkGuard(context: BrowserContext) {
  await context.route('**/*', async (route) => {
    const requestUrl = route.request().url()
    if (/^(about:blank|data:|blob:)/i.test(requestUrl)) {
      await route.continue()
      return
    }
    if (!/^https?:/i.test(requestUrl)) {
      await route.abort('blockedbyclient')
      return
    }
    try {
      await assertPublicScanUrl(requestUrl)
      await route.continue()
    } catch {
      await route.abort('blockedbyclient')
    }
  })
}
