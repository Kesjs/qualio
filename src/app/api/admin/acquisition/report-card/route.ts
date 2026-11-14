import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { loadReportCard } from '@/lib/admin/acquisition-report-card'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

/** Carte récap d'un rapport, pour que l'aperçu d'email de l'admin montre exactement ce que recevra le prospect. */
export async function GET(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const token = new URL(request.url).searchParams.get('token') ?? ''
  if (!/^[\w-]{12,80}$/.test(token)) return NextResponse.json({ card: null })
  const card = await loadReportCard(getSupabaseAdminClient() as any, token)
  return NextResponse.json({ card })
}
