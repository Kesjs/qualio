import { NextResponse } from 'next/server'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'

export async function DELETE() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await getSupabaseAdminClient().auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[Account deletion] failed', error)
    return NextResponse.json({ error: 'Le compte n’a pas pu être supprimé. Réessayez.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
