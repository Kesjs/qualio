import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const COOKIE = 'qualio_github_state'

export function createGithubState() {
  const nonce = randomBytes(24).toString('hex')
  const secret = process.env.GITHUB_APP_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) throw new Error('GITHUB_APP_STATE_SECRET is not configured')
  const signature = createHmac('sha256', secret).update(nonce).digest('hex')
  return { value: `${nonce}.${signature}`, cookie: COOKIE }
}

export function verifyGithubState(value: string | undefined) {
  if (!value) return false
  const [nonce, signature] = value.split('.')
  const secret = process.env.GITHUB_APP_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret || !nonce || !signature) return false
  const expected = createHmac('sha256', secret).update(nonce).digest('hex')
  return signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
