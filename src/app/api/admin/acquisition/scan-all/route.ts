import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { scanCompany } from '@/lib/admin/acquisition-scan'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export const maxDuration = 300

export async function POST() {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const admin = getSupabaseAdminClient() as any
  const { data: companies, error } = await admin.from('acquisition_companies').select('id, name, domain').neq('status', 'archived').limit(500)
  if (error) return NextResponse.json({ error: 'Impossible de charger les entreprises.' }, { status: 500 })

  let scanned = 0
  let failed = 0
  for (const company of companies ?? []) {
    try { await scanCompany(admin, company); scanned += 1 } catch { failed += 1 }
  }
  return NextResponse.json({ scanned, failed, total: companies?.length ?? 0 })
}
