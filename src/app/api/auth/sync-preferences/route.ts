import { NextResponse } from 'next/server'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'
import { syncWeeklyDigestPreference } from '@/lib/auth/notification-preferences'
import { isPaidPlan } from '@/lib/billing/plans'

export async function POST() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await syncWeeklyDigestPreference(user)

    // Si l'utilisateur s'est inscrit en choisissant un plan payant (Pro ou Agence)
    const intendedPlan = user.user_metadata?.intended_plan
    if (isPaidPlan(intendedPlan)) {
      const admin = getSupabaseAdminClient() as any
      try {
        await admin.auth.admin.updateUserById(user.id, {
          app_metadata: { plan: intendedPlan },
        })
      } catch (authErr) {
        console.error('[sync-preferences] auth metadata update error:', authErr)
      }

      const { data: existing } = await admin
        .from('billing_subscriptions')
        .select('id, plan, status')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existing) {
        const { error: insErr } = await admin.from('billing_subscriptions').insert({
          user_id: user.id,
          plan: intendedPlan,
          status: 'active',
          source: 'manual',
          stripe_customer_id: `cus_intent_${user.id.slice(0, 8)}`,
          updated_at: new Date().toISOString(),
        })
        if (insErr) {
          console.warn('[sync-preferences] billing_subscriptions insert warning:', insErr.message)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[sync-preferences] failed:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Préférences temporairement indisponibles.' }, { status: 503 })
  }
}
