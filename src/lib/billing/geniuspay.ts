import crypto from 'node:crypto'

const BASE_URL = (process.env.GENIUSPAY_BASE_URL ?? 'https://geniuspay.ci/api/v1/merchant').replace(/\/$/, '')

export async function createGeniusPayPayment(input: { amount: number; currency?: string; externalReference: string; description: string; customer: { email?: string; country?: string }; metadata: Record<string, string>; successUrl: string; errorUrl: string }) {
  const apiKey = process.env.GENIUSPAY_API_KEY
  const apiSecret = process.env.GENIUSPAY_API_SECRET
  if (!apiKey || !apiSecret) throw new Error('GeniusPay n’est pas configuré')
  const currency = input.currency ?? 'EUR'
  const response = await fetch(`${BASE_URL}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'X-API-Secret': apiSecret, 'Idempotency-Key': input.externalReference }, body: JSON.stringify({ amount: input.amount, currency, description: input.description, external_reference: input.externalReference, customer: { ...input.customer, country: input.customer.country ?? 'FR' }, metadata: input.metadata, success_url: input.successUrl, error_url: input.errorUrl }), cache: 'no-store' })
  const payload = await response.json().catch(() => null)
  const paymentUrl = payload?.data?.payment_url ?? payload?.data?.checkout_url
  if (!response.ok || !payload?.success || !paymentUrl) throw new Error(payload?.message ?? 'Impossible de créer le paiement GeniusPay')
  return { ...payload.data, payment_url: paymentUrl } as { reference: string; payment_url: string; checkout_url?: string; status: string }
}

export function verifyGeniusPaySignature(payload: string, timestamp: string, signature: string, secret: string) {
  const timestampMs = Number(timestamp) * 1000
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60_000) return false
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
