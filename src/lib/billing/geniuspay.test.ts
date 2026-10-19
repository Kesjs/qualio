import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyGeniusPaySignature } from './geniuspay'

describe('verifyGeniusPaySignature', () => {
  const payload = JSON.stringify({ id: 'test-event', event: 'payment.success' })
  const secret = 'test-geniuspay-secret'

  it('accepts a correctly signed recent payload', () => {
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
    expect(verifyGeniusPaySignature(payload, timestamp, signature, secret)).toBe(true)
  })

  it('rejects an expired signature', () => {
    const timestamp = String(Math.floor((Date.now() - 6 * 60_000) / 1000))
    const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
    expect(verifyGeniusPaySignature(payload, timestamp, signature, secret)).toBe(false)
  })

  it('rejects a falsified signature', () => {
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
    expect(verifyGeniusPaySignature(`${payload}.tampered`, timestamp, signature, secret)).toBe(false)
  })

  it('rejects a non-numeric timestamp', () => {
    expect(verifyGeniusPaySignature(payload, 'not-a-timestamp', '00', secret)).toBe(false)
  })
})
