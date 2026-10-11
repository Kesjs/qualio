import { createHmac, timingSafeEqual } from 'node:crypto'

function secret() { return process.env.UNSUBSCRIBE_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'development-only-unsubscribe-secret' }

export function createUnsubscribeToken(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 90 * 86400000 })).toString('base64url')
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifyUnsubscribeToken(token: string) {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url')
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { userId?: unknown; exp?: unknown }
    if (typeof value.userId !== 'string' || typeof value.exp !== 'number' || value.exp < Date.now()) return null
    return value.userId
  } catch { return null }
}
