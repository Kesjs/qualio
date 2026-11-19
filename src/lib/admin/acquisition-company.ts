import { cleanDomain } from '@/lib/admin/acquisition-ai'
import { GENERIC_EMAIL } from '@/lib/admin/acquisition-draft'

export type ContactCandidate = {
  id: string
  email: string
  full_name: string | null
  email_status: string
  email_source_url?: string | null
  confidence: number | null
}

/**
 * Sélectionne le meilleur contact utilisable :
 * exclut les adresses supprimées ou invalides, puis priorise les adresses nominatives
 * avant les boîtes génériques (GENERIC_EMAIL), et enfin la confiance la plus élevée.
 */
export function pickBestContact<T extends Pick<ContactCandidate, 'email' | 'email_status' | 'confidence'>>(contacts: T[]): T | null {
  const usable = contacts.filter((contact) => !['suppressed', 'invalid'].includes(String(contact.email_status ?? '')))
  if (usable.length === 0) return null
  return [...usable].sort(
    (a, b) =>
      Number(GENERIC_EMAIL.test(a.email)) - Number(GENERIC_EMAIL.test(b.email)) ||
      (b.confidence ?? 0) - (a.confidence ?? 0),
  )[0]
}

export type ResolvedCompany = {
  id: string
  name: string
  domain: string
  source_notes: string | null
  created: boolean
}

/**
 * Retrouve ou crée l'entreprise dans `acquisition_companies` à partir de `sellerUrl` (App Store).
 * Retourne `null` si `sellerUrl` est vide ou pointe vers un réseau social, apple.com, github, etc.
 */
export async function resolveAppStoreCompany(
  admin: any,
  input: {
    sellerUrl?: string | null
    companyName: string
    sourceUrl?: string | null
    country?: string | null
  },
): Promise<ResolvedCompany | null> {
  const domain = cleanDomain(input.sellerUrl)
  if (!domain) return null

  const { data: existing } = await admin
    .from('acquisition_companies')
    .select('id, name, domain, source_notes')
    .ilike('domain', domain)
    .maybeSingle()

  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      domain: existing.domain,
      source_notes: existing.source_notes ?? null,
      created: false,
    }
  }

  const cleanName = input.companyName.trim().slice(0, 200) || domain
  const { data: inserted, error } = await admin
    .from('acquisition_companies')
    .insert({
      name: cleanName,
      domain,
      website_url: input.sellerUrl?.trim().slice(0, 500) ?? `https://${domain}`,
      country: input.country ? input.country.trim().toUpperCase().slice(0, 4) : null,
      source_url: input.sourceUrl ?? null,
      source_notes: 'App Store',
      status: 'review',
    })
    .select('id, name, domain, source_notes')
    .single()

  if (error || !inserted) {
    // Gestion d'une éventuelle insertion concurrente sur l'index unique lower(domain)
    const { data: retry } = await admin
      .from('acquisition_companies')
      .select('id, name, domain, source_notes')
      .ilike('domain', domain)
      .maybeSingle()
    if (!retry) return null
    return {
      id: retry.id,
      name: retry.name,
      domain: retry.domain,
      source_notes: retry.source_notes ?? null,
      created: false,
    }
  }

  return {
    id: inserted.id,
    name: inserted.name,
    domain: inserted.domain,
    source_notes: inserted.source_notes ?? null,
    created: true,
  }
}
