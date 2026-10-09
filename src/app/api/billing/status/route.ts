import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await (supabase as any).from('billing_subscriptions').select('plan, status, current_period_end, cancel_at_period_end').eq('user_id', user.id).maybeSingle()
  const hasAccess = data?.status === 'active' || data?.status === 'trialing'
  return NextResponse.json({ plan: hasAccess ? data.plan : 'free', status: data?.status ?? 'free', currentPeriodEnd: data?.current_period_end ?? null, cancelAtPeriodEnd: data?.cancel_at_period_end ?? false })
}
