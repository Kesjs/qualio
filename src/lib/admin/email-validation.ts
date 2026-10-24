import { resolveMx } from 'node:dns/promises'

export type LocalEmailValidation = {
  status: 'verified' | 'unverified' | 'invalid'
  reason: 'format' | 'placeholder' | 'no_mx' | 'mx_found' | 'mx_lookup_failed'
}

const PLACEHOLDER_HOSTS = new Set(['email.com', 'example.com', 'yourdomain.com', 'test.com', 'domain.com'])
const PLACEHOLDER_LOCALS = new Set(['votre', 'adresse', 'email', 'test', 'example', 'demo', 'placeholder'])

export async function validatePublicEmail(value: string): Promise<LocalEmailValidation> {
  const email = value.trim().toLowerCase()
  const match = email.match(/^([^\s@]+)@([^\s@]+\.[^\s@]+)$/)
  if (!match) return { status: 'invalid', reason: 'format' }
  const [, local, host] = match
  if (PLACEHOLDER_HOSTS.has(host) || PLACEHOLDER_LOCALS.has(local)) return { status: 'invalid', reason: 'placeholder' }
  try {
    const records = await resolveMx(host)
    return records.length ? { status: 'verified', reason: 'mx_found' } : { status: 'invalid', reason: 'no_mx' }
  } catch {
    return { status: 'unverified', reason: 'mx_lookup_failed' }
  }
}
