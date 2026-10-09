import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured')
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY)
  return stripeClient
}

export function getBillingOrigin(requestOrigin?: string) {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || requestOrigin?.replace(/\/$/, '') || 'http://localhost:3000'
}
