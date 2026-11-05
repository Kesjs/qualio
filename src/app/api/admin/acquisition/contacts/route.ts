import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/auth'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { validatePublicEmail } from '@/lib/admin/email-validation'

export const maxDuration = 30

/**
 * Ajout ou modification manuelle d'un contact pour un prospect.
 * Permet de débloquer immédiatement les prospects sans email détecté par le crawler.
 */
export async function POST(request: Request) {
  if (!await requireAdminApi()) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    companyId?: string
    contactId?: string
    email?: string
    fullName?: string
    role?: string
  }

  const companyId = String(body.companyId ?? '').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const fullName = body.fullName ? String(body.fullName).trim().slice(0, 120) : null
  const role = body.role ? String(body.role).trim().slice(0, 80) : null

  if (!companyId) {
    return NextResponse.json({ error: 'Entreprise manquante.' }, { status: 400 })
  }
  if (!email || !email.includes('@') || email.length < 5) {
    return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient() as any
  const { data: company, error: companyError } = await admin
    .from('acquisition_companies')
    .select('id, name, domain, relevance_score, status')
    .eq('id', companyId)
    .maybeSingle()

  if (companyError || !company) {
    return NextResponse.json({ error: 'Entreprise introuvable.' }, { status: 404 })
  }

  const validation = await validatePublicEmail(email)
  const emailStatus = validation.status === 'invalid' ? 'unverified' : validation.status

  let contactRow
  if (body.contactId) {
    const { data: updated, error: updateError } = await admin
      .from('acquisition_contacts')
      .update({
        email,
        full_name: fullName,
        role,
        email_status: emailStatus,
        confidence: 90,
      })
      .eq('id', body.contactId)
      .eq('company_id', companyId)
      .select()
      .maybeSingle()

    if (updateError) {
      return NextResponse.json({ error: 'Impossible de mettre à jour le contact.' }, { status: 500 })
    }
    contactRow = updated
  } else {
    // Vérifier si un contact existe déjà avec cet email
    const { data: existing } = await admin
      .from('acquisition_contacts')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      const { data: updated, error: updateError } = await admin
        .from('acquisition_contacts')
        .update({
          company_id: companyId,
          full_name: fullName,
          role,
          email_status: emailStatus,
          confidence: 90,
        })
        .eq('id', existing.id)
        .select()
        .maybeSingle()

      if (updateError) {
        return NextResponse.json({ error: 'Impossible de mettre à jour le contact existant.' }, { status: 500 })
      }
      contactRow = updated
    } else {
      const { data: inserted, error: insertError } = await admin
        .from('acquisition_contacts')
        .insert({
          company_id: companyId,
          email,
          full_name: fullName,
          role,
          email_status: emailStatus,
          confidence: 90,
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: 'Impossible d’enregistrer le contact.' }, { status: 500 })
      }
      contactRow = inserted
    }
  }

  // Augmenter le score de pertinence et passer le statut en 'review' pour rendre le prospect prêt
  const newScore = Math.min(100, Math.max(company.relevance_score ?? 0, 45))
  await admin
    .from('acquisition_companies')
    .update({
      relevance_score: newScore,
      status: 'review',
    })
    .eq('id', companyId)

  return NextResponse.json({ success: true, contact: contactRow })
}
