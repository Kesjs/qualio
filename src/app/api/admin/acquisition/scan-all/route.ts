import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { scanCompany } from '@/lib/admin/acquisition-scan'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export const maxDuration = 300

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const body = await request.json().catch(() => ({})) as { offset?: number; limit?: number }
  const offset = Math.max(0, Math.floor(Number(body.offset) || 0))
  const limit = Math.min(5, Math.max(1, Math.floor(Number(body.limit) || 5)))
  const admin = getSupabaseAdminClient() as any
  const { data: companies, error, count } = await admin.from('acquisition_companies').select('id, name, domain', { count: 'exact' }).neq('status', 'archived').order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: 'Impossible de charger les entreprises.' }, { status: 500 })

  let scanned = 0
  let failed = 0
  for (const company of companies ?? []) {
    try { await scanCompany(admin, company); scanned += 1 } catch { failed += 1 }
  }
  return NextResponse.json({ scanned, failed, total: count ?? 0, nextOffset: offset + (companies?.length ?? 0), hasMore: offset + (companies?.length ?? 0) < (count ?? 0) })
}
