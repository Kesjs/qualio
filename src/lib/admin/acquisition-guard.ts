import { BOUNCE_RATE_WINDOW_DAYS } from '@/lib/admin/acquisition'

/** Au-delà de ce taux de rebond (sur 30 jours, 10 envois minimum), plus aucun envoi : la réputation du domaine passe avant tout. */
export const BOUNCE_PAUSE_RATE = 10
export const BOUNCE_PAUSE_MIN_SENT = 10

type ContactLike = { email?: string | null; email_status?: string | null; email_source_url?: string | null }

/**
 * Pourquoi on n'envoie PAS à ce contact (null = envoi autorisé).
 * `permanent` : le brouillon est clos ; sinon il reste en brouillon (l'adresse peut encore être confirmée par une analyse).
 */
export function contactSkipReason(contact: ContactLike | null | undefined): { reason: string; permanent: boolean } | null {
  if (!contact?.email) return { reason: 'Aucune adresse', permanent: true }
  if (['suppressed', 'invalid'].includes(contact.email_status ?? '')) return { reason: 'Adresse invalide ou désinscrite', permanent: true }
  if (!contact.email_source_url) return { reason: 'Adresse non trouvée sur une page publique du site', permanent: false }
  if (contact.email_status === 'unverified') return { reason: 'Domaine mail non confirmé', permanent: false }
  return null
}

export async function bouncePause(admin: any): Promise<{ paused: boolean; rate: number; sent: number }> {
  const since = new Date(Date.now() - BOUNCE_RATE_WINDOW_DAYS * 86_400_000).toISOString()
  const [sent, bounced] = await Promise.all([
    admin.from('acquisition_messages').select('id', { count: 'exact', head: true }).gte('sent_at', since),
    admin.from('acquisition_messages').select('id', { count: 'exact', head: true }).eq('status', 'bounced').gte('sent_at', since),
  ])
  const total = sent.count ?? 0
  const rate = total ? Math.round(((bounced.count ?? 0) / total) * 100) : 0
  return { paused: total >= BOUNCE_PAUSE_MIN_SENT && rate > BOUNCE_PAUSE_RATE, rate, sent: total }
}

export const pauseMessage = (state: { rate: number; sent: number }) =>
  `Envois en pause : ${state.rate} % de rebonds sur ${state.sent} mails des 30 derniers jours (limite ${BOUNCE_PAUSE_RATE} %). Nettoie la liste avant de reprendre.`

/** Adresses à ne plus jamais contacter (déjà contactées, invalides ou désinscrites, conservées après une remise à zéro). */
export async function doNotContactSet(admin: any, emails: string[]): Promise<Set<string>> {
  const list = [...new Set(emails.map((email) => email.toLowerCase()))]
  if (!list.length) return new Set()
  const { data } = await admin.from('acquisition_do_not_contact').select('email').in('email', list)
  return new Set((data ?? []).map((row: { email: string }) => String(row.email).toLowerCase()))
}
