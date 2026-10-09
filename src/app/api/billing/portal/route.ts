import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getBillingOrigin, getStripeClient } from '@/lib/billing/stripe'

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: subscription } = await (supabase as any).from('billing_subscriptions').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()
  if (!subscription?.stripe_customer_id) return NextResponse.json({ error: 'Aucun abonnement Stripe trouvé.' }, { status: 404 })
  const portal = await getStripeClient().billingPortal.sessions.create({ customer: subscription.stripe_customer_id, return_url: `${getBillingOrigin(request.nextUrl.origin)}/dashboard/settings` })
  return NextResponse.json({ url: portal.url })
}
