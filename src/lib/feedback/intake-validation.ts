export const MAX_INTAKE_BODY_BYTES = 10 * 1024
const MAX_INTAKE_CONTENT_LENGTH = 2000
const MAX_INTAKE_AUTHOR_NAME_LENGTH = 160

export type IntakeBody = { key?: unknown; content?: unknown; authorName?: unknown; authorEmail?: unknown; honeypot?: unknown }

export function validateIntakeBody(body: IntakeBody, bodyBytes: number) {
  if (bodyBytes > MAX_INTAKE_BODY_BYTES) return 'Votre message est trop volumineux.'
  if (typeof body.honeypot === 'string' && body.honeypot.trim()) return null
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  const authorName = typeof body.authorName === 'string' ? body.authorName.trim() : ''
  if (typeof body.key !== 'string' || !body.key.trim() || !content) return 'Votre avis ne peut pas être vide.'
  if (content.length > MAX_INTAKE_CONTENT_LENGTH) return `Votre avis ne peut pas dépasser ${MAX_INTAKE_CONTENT_LENGTH} caractères.`
  if (authorName.length > MAX_INTAKE_AUTHOR_NAME_LENGTH) return 'Votre nom est trop long.'
  if (typeof body.authorEmail === 'string' && body.authorEmail.trim().length > 320) return 'Votre email est trop long.'
  return null
}

export function isIntakeRateLimited(ipCount: number, keyCount: number) {
  return ipCount >= 10 || keyCount >= 200
}

export function isDuplicateIntakeEvent(found: unknown) {
  return Boolean(found)
}
