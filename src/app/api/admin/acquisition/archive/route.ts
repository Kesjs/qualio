import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const { companyIds } = await request.json().catch(() => ({})) as { companyIds?: string[] }
  if (!Array.isArray(companyIds) || !companyIds.length || companyIds.length > 200) return NextResponse.json({ error: 'Sélection vide.' }, { status: 400 })
  const { error } = await (getSupabaseAdminClient() as any).from('acquisition_companies').update({ status: 'archived', updated_at: new Date().toISOString() }).in('id', companyIds)
  if (error) return NextResponse.json({ error: 'Impossible d’archiver ces entreprises.' }, { status: 500 })
  return NextResponse.json({ archived: companyIds.length })
}
