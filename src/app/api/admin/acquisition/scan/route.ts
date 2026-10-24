import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { scanCompany } from '@/lib/admin/acquisition-scan'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const { companyId } = await request.json().catch(() => ({})) as { companyId?: string }
  if (!companyId) return NextResponse.json({ error: 'Entreprise manquante.' }, { status: 400 })
  const admin = getSupabaseAdminClient() as any
  const { data: company, error: companyError } = await admin.from('acquisition_companies').select('id, name, domain').eq('id', companyId).maybeSingle()
  if (companyError || !company) return NextResponse.json({ error: 'Entreprise introuvable.' }, { status: 404 })
  return NextResponse.json(await scanCompany(admin, company))
}
