import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import type { BrowserContext } from 'playwright'

function isPrivateIpv4(address: string): boolean {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return true
  const [a, b] = parts
  return a === 0 || a === 10 || a === 100 && b >= 64 && b <= 127 || a === 127
    || a === 169 && b === 254 || a === 172 && b >= 16 && b <= 31 || a === 192 && b === 0
    || a === 192 && b === 168 || a === 198 && b >= 18 && b <= 19
}

function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase()
  if (normalized.startsWith('::ffff:')) return isPrivateIpv4(normalized.slice(7))
  if (isIP(normalized) === 4) return isPrivateIpv4(normalized)
  if (isIP(normalized) === 6) {
    return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || /^fe[89ab]/.test(normalized)
  }
  return true
}

/** Reject private, loopback and link-local destinations before browser work begins. */
export async function assertPublicScanUrl(url: string): Promise<void> {
  const parsed = new URL(url)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS scan URLs are allowed')
  }
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === 'metadata.google.internal' || hostname.endsWith('.metadata.google.internal')) {
    throw new Error('This URL is not allowed for security reasons')
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true })
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('This URL resolves to a private or reserved network address')
  }
}

/**
 * Protect every browser request, including redirects and subresources.
 * The initial URL check alone is insufficient because a public hostname can
 * redirect to a private address after navigation has started.
 */
export async function installPublicNetworkGuard(context: BrowserContext) {
  await context.route('**/*', async (route) => {
    const requestUrl = route.request().url()
    if (!/^https?:/i.test(requestUrl)) {
      await route.continue()
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
