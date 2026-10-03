import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const VERSION = 'v1'

function getKey(): Buffer {
  const raw = process.env.SITE_SECRETS_ENCRYPTION_KEY
  if (!raw) throw new Error('SITE_SECRETS_ENCRYPTION_KEY is not configured')
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64')
  if (key.length !== 32) throw new Error('SITE_SECRETS_ENCRYPTION_KEY must encode 32 bytes')
  return key
}

export function encryptSiteSecret(value: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.')
}

export function decryptSiteSecret(payload: string): string {
  const [version, ivValue, tagValue, encryptedValue] = payload.split('.')
  if (version !== VERSION || !ivValue || !tagValue || !encryptedValue) throw new Error('Invalid site secret payload')
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivValue, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8')
}

export function isSiteSecretReference(value: unknown): value is string {
  return typeof value === 'string' && /^\{\{secret:[A-Z][A-Z0-9_]{1,63}\}\}$/.test(value)
}

export function getSiteSecretName(value: string): string | null {
  return isSiteSecretReference(value) ? value.slice(9, -2) : null
}
