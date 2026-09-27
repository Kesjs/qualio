import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS_PER_WINDOW = 5

function getClientIp(req: NextRequest): string {
  // Standard proxy header order: x-forwarded-for (may hold a list), then
  // x-real-ip as fallback. Hostinger/most reverse proxies set one of these.
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

// POST /api/auth/signup-check — called by the client right before
// supabase.auth.signUp(). Records the attempt and rejects once an IP has
// hit MAX_ATTEMPTS_PER_WINDOW within WINDOW_MS, to slow down signup abuse
// (mass fake accounts, credential-stuffing style registration spam).
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const admin = getSupabaseAdminClient()
  const cutoff = new Date(Date.now() - WINDOW_MS).toISOString()

  const { count, error: countError } = await admin
    .from('signup_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('created_at', cutoff)

  if (countError) {
    // Fail open on infra errors: a broken count check must never block
    // legitimate signups, it's a soft protection layer, not an auth gate.
    console.error('[signup-check] count query failed:', countError.message)
    return NextResponse.json({ ok: true })
  }

  if ((count ?? 0) >= MAX_ATTEMPTS_PER_WINDOW) {
    return NextResponse.json(
      { ok: false, error: 'too_many_attempts' },
      { status: 429 }
    )
  }

  const { error: insertError } = await admin
    .from('signup_attempts')
    .insert({ ip_address: ip })

  if (insertError) {
    console.error('[signup-check] insert failed:', insertError.message)
  }

  return NextResponse.json({ ok: true })
}
