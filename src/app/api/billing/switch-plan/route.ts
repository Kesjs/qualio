import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'
import { isPaidPlan, type PlanId } from '@/lib/billing/plans'

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { plan?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }
  const plan = body.plan as PlanId
  if (plan !== 'free' && !isPaidPlan(plan)) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient() as any

  // Mettre à jour app_metadata et user_metadata de l'utilisateur
  try {
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { plan },
      user_metadata: { ...user.user_metadata, intended_plan: plan },
    })
  } catch (authErr) {
    console.error('[switch-plan] auth metadata update error:', authErr)
  }

  // Mettre à jour billing_subscriptions
  const { error: dbError } = await admin.from('billing_subscriptions').upsert({
    user_id: user.id,
    plan,
    status: 'active',
    source: 'manual',
    stripe_customer_id: `cus_manual_${user.id.slice(0, 8)}`,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (dbError) {
    console.warn('[switch-plan] billing_subscriptions upsert warning (check constraint or db sync):', dbError.message)
  }

  return NextResponse.json({ ok: true, plan })
}
