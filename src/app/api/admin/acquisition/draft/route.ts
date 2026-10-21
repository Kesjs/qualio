import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!await requireAdminApi()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const { contactId } = await request.json().catch(() => ({})) as { contactId?: string }
  if (!contactId) return NextResponse.json({ error: 'Contact manquant.' }, { status: 400 })
  const admin = getSupabaseAdminClient() as any
  const { data: contact } = await admin.from('acquisition_contacts').select('id, email, full_name, company:acquisition_companies(name)').eq('id', contactId).maybeSingle()
  if (!contact) return NextResponse.json({ error: 'Contact introuvable.' }, { status: 404 })
  const company = contact.company?.name ?? 'votre équipe'
  const { data, error } = await admin.from('acquisition_messages').insert({ contact_id: contact.id, subject: `Une question sur les retours clients chez ${company}`, body: `Bonjour${contact.full_name ? ` ${contact.full_name}` : ''},\n\nJe travaille sur Qualio, un espace qui aide les équipes produit à transformer les retours clients en thèmes, tendances et actions prioritaires.\n\nComment centralisez-vous aujourd’hui ces retours ?\n\nSi ce sujet concerne une autre personne, pourriez-vous m’indiquer le bon contact ?\n\nBonne journée,\nKennedy\n\nSi vous ne souhaitez pas recevoir d’autres messages, répondez simplement « stop ».`, status: 'draft' }).select('id').single()
  if (error) return NextResponse.json({ error: 'Le brouillon n’a pas pu être enregistré.' }, { status: 500 })
  return NextResponse.json({ draft: data })
}
