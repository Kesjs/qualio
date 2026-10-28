import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { GENERIC_EMAIL } from '@/lib/admin/acquisition-draft'

export const FOLLOW_UP_AFTER_DAYS = 4

export type PipelineContact = { id: string; email: string; full_name: string | null; role: string | null; email_status: string; email_source_url: string | null; generic: boolean }
export type QueueState = 'scan' | 'empty' | 'ready'
export type QueueItem = { id: string; name: string; domain: string; state: QueueState; contacts: PipelineContact[] }
export type PipelineMessage = {
  id: string; contactId: string; subject: string; body: string; status: string; createdAt: string; sentAt: string | null
  deliveredAt: string | null; bouncedAt: string | null; bounceReason: string | null; repliedAt: string | null
  isFollowUp: boolean; followUpDue: boolean; email: string; company: string
}
export type PipelineStats = { sentToday: number; dailyLimit: number; sentTotal: number; delivered: number; bounced: number; bounceRate: number; pausedForBounces: boolean; replied: number; replyRate: number; drafts: number }
export type PipelineData = { queue: QueueItem[]; drafts: PipelineMessage[]; tracking: PipelineMessage[]; stats: PipelineStats; failed: boolean }

export function dailyLimit() {
  const value = Number(process.env.ACQUISITION_DAILY_LIMIT)
  return Number.isFinite(value) && value >= 1 ? Math.min(Math.floor(value), 200) : 25
}

export function startOfTodayIso() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}

const BLOCKED_CONTACT = new Set(['suppressed', 'invalid'])

export async function getAcquisitionPipeline(): Promise<PipelineData> {
  const admin = getSupabaseAdminClient() as any
  const [companiesResult, contactsResult, messagesResult] = await Promise.all([
    admin.from('acquisition_companies').select('id, name, domain, status, created_at').neq('status', 'archived').order('created_at', { ascending: false }).limit(500),
    admin.from('acquisition_contacts').select('id, company_id, email, full_name, role, email_status, email_source_url, confidence').limit(3000),
    admin.from('acquisition_messages').select('id, contact_id, subject, body, status, created_at, sent_at, delivered_at, bounced_at, bounce_reason, replied_at, follow_up_of, contact:acquisition_contacts(email, company:acquisition_companies(name, domain))').order('created_at', { ascending: false }).limit(3000),
  ])
  const failed = Boolean(companiesResult.error || contactsResult.error || messagesResult.error)
  const companies = (companiesResult.data ?? []) as Array<{ id: string; name: string; domain: string; status: string }>
  const contacts = (contactsResult.data ?? []) as Array<{ id: string; company_id: string; email: string; full_name: string | null; role: string | null; email_status: string; email_source_url: string | null; confidence: number | null }>
  const rawMessages = (messagesResult.data ?? []) as any[]

  const contactIdsWithMessage = new Set(rawMessages.map((message) => message.contact_id as string))
  const latestByContact = new Map<string, any>()
  for (const message of rawMessages) if (!latestByContact.has(message.contact_id)) latestByContact.set(message.contact_id, message)
  const dueBefore = Date.now() - FOLLOW_UP_AFTER_DAYS * 86_400_000

  const messages: PipelineMessage[] = rawMessages.map((message) => ({
    id: message.id, contactId: message.contact_id, subject: message.subject, body: message.body, status: message.status, createdAt: message.created_at,
    sentAt: message.sent_at ?? null, deliveredAt: message.delivered_at ?? null, bouncedAt: message.bounced_at ?? null, bounceReason: message.bounce_reason ?? null, repliedAt: message.replied_at ?? null,
    isFollowUp: Boolean(message.follow_up_of),
    followUpDue: message.status === 'sent' && !message.follow_up_of && latestByContact.get(message.contact_id)?.id === message.id && message.sent_at != null && new Date(message.sent_at).getTime() <= dueBefore,
    email: message.contact?.email ?? 'Contact inconnu', company: message.contact?.company?.name ?? message.contact?.company?.domain ?? 'Entreprise inconnue',
  }))

  const contactsByCompany = new Map<string, PipelineContact[]>()
  for (const contact of contacts.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))) {
    const list = contactsByCompany.get(contact.company_id) ?? []
    list.push({ id: contact.id, email: contact.email, full_name: contact.full_name, role: contact.role, email_status: contact.email_status, email_source_url: contact.email_source_url, generic: GENERIC_EMAIL.test(contact.email) })
    contactsByCompany.set(contact.company_id, list)
  }

  const queue: QueueItem[] = []
  for (const company of companies) {
    const all = contactsByCompany.get(company.id) ?? []
    const usable = all.filter((contact) => !BLOCKED_CONTACT.has(contact.email_status))
    const alreadyContacted = usable.some((contact) => contactIdsWithMessage.has(contact.id))
    if (all.length === 0) queue.push({ id: company.id, name: company.name, domain: company.domain, state: company.status === 'discovered' ? 'scan' : 'empty', contacts: [] })
    else if (usable.length > 0 && !alreadyContacted) queue.push({ id: company.id, name: company.name, domain: company.domain, state: 'ready', contacts: usable.sort((a, b) => Number(a.generic) - Number(b.generic)) })
  }

  const todayStart = new Date(startOfTodayIso()).getTime()
  const sent = messages.filter((message) => message.sentAt)
  const bounced = messages.filter((message) => message.status === 'bounced').length
  const replied = messages.filter((message) => message.status === 'replied').length
  const reached = Math.max(0, sent.length - bounced)
  const bounceRate = sent.length ? Math.round((bounced / sent.length) * 100) : 0
  const stats: PipelineStats = {
    sentToday: sent.filter((message) => new Date(message.sentAt as string).getTime() >= todayStart).length,
    dailyLimit: dailyLimit(),
    sentTotal: sent.length,
    delivered: messages.filter((message) => message.deliveredAt).length,
    bounced,
    bounceRate,
    pausedForBounces: sent.length >= 10 && bounceRate > 10,
    replied,
    replyRate: reached ? Math.round((replied / reached) * 100) : 0,
    drafts: messages.filter((message) => message.status === 'draft' || message.status === 'approved').length,
  }
  return {
    queue,
    drafts: messages.filter((message) => message.status === 'draft' || message.status === 'approved').reverse(),
    tracking: messages.filter((message) => ['sent', 'replied', 'bounced', 'suppressed'].includes(message.status)).sort((a, b) => new Date(b.sentAt ?? b.createdAt).getTime() - new Date(a.sentAt ?? a.createdAt).getTime()),
    stats,
    failed,
  }
}
