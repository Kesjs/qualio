import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { GENERIC_EMAIL, isAgency } from '@/lib/admin/acquisition-draft'
import { publicReportUrl } from '@/lib/admin/acquisition-report-url'
import type { ProspectReport } from '@/lib/admin/acquisition-report'

export const FOLLOW_UP_AFTER_DAYS = 4
export const BOUNCE_RATE_WINDOW_DAYS = 30

export type PipelineContact = {
  id: string
  email: string
  full_name: string | null
  role: string | null
  email_status: string
  email_source_url: string | null
  generic: boolean
}

export type PipelineReviewSource = {
  type: string
  label: string
  url: string
}

export type PipelineReportSummary = {
  token: string
  url: string
  subjectName: string
  sourceLabel: string
  reviewCount: number
  topProblem: string | null
  viewCount: number
  lastViewedAt: string | null
}

export type QueueState = 'scan' | 'empty' | 'ready'

export type QueueItemCategory = 'saas' | 'agency' | 'ecommerce' | 'other'

export type QueueItem = {
  id: string
  name: string
  domain: string
  state: QueueState
  relevanceScore: number | null
  notes: string | null
  isAgency: boolean
  category: QueueItemCategory
  reviewSources: PipelineReviewSource[]
  report: PipelineReportSummary | null
  contacts: PipelineContact[]
}

export type PipelineMessage = {
  id: string
  contactId: string
  companyId: string | null
  subject: string
  body: string
  status: string
  createdAt: string
  sentAt: string | null
  deliveredAt: string | null
  clickedAt: string | null
  bouncedAt: string | null
  bounceReason: string | null
  repliedAt: string | null
  isFollowUp: boolean
  followUpDue: boolean
  email: string
  company: string
  report: PipelineReportSummary | null
}

export type PipelineStats = {
  sentToday: number
  dailyLimit: number
  sentTotal: number
  delivered: number
  bounced: number
  bounceRate: number
  pausedForBounces: boolean
  replied: number
  replyRate: number
  drafts: number
  reportsCreated: number
  reportsOpened: number
}

export type PipelineData = {
  queue: QueueItem[]
  drafts: PipelineMessage[]
  tracking: PipelineMessage[]
  stats: PipelineStats
  failed: boolean
}

/** Plafond maximal réglable (ACQUISITION_DAILY_LIMIT). Défaut : 80 mails par jour une fois le domaine chauffé. */
export function dailyLimit() {
  const value = Number(process.env.ACQUISITION_DAILY_LIMIT)
  return Number.isFinite(value) && value >= 1 ? Math.min(Math.floor(value), 200) : 80
}

export const WARMUP_START_LIMIT = 25
const WARMUP_STEPS: Array<[number, number]> = [[7, 25], [14, 40], [21, 60]]

/**
 * Montée en charge automatique : 25/jour la 1re semaine, 40 la 2e, 60 la 3e, puis le plafond.
 * Si le taux de rebond des 30 derniers jours dépasse 5 % (20 envois minimum), on retombe à 25/jour.
 */
export function rampedDailyLimit(input: { firstSentAt: string | null; recentSent: number; recentBounced: number; now?: number }) {
  const cap = dailyLimit()
  const now = input.now ?? Date.now()
  if (input.recentSent >= 20 && input.recentBounced / input.recentSent > 0.05) return Math.min(cap, WARMUP_START_LIMIT)
  if (!input.firstSentAt) return Math.min(cap, WARMUP_START_LIMIT)
  const days = Math.max(0, (now - new Date(input.firstSentAt).getTime()) / 86_400_000)
  const step = WARMUP_STEPS.find(([until]) => days < until)
  return Math.min(cap, step ? step[1] : cap)
}

/** Version serveur : lit la date du premier envoi et le taux de rebond récent. */
export async function effectiveDailyLimit(admin: any) {
  const since = new Date(Date.now() - BOUNCE_RATE_WINDOW_DAYS * 86_400_000).toISOString()
  const [first, recent, bounced] = await Promise.all([
    admin.from('acquisition_messages').select('sent_at').not('sent_at', 'is', null).order('sent_at', { ascending: true }).limit(1).maybeSingle(),
    admin.from('acquisition_messages').select('id', { count: 'exact', head: true }).gte('sent_at', since),
    admin.from('acquisition_messages').select('id', { count: 'exact', head: true }).eq('status', 'bounced').gte('sent_at', since),
  ])
  return rampedDailyLimit({ firstSentAt: first.data?.sent_at ?? null, recentSent: recent.count ?? 0, recentBounced: bounced.count ?? 0 })
}

export function startOfTodayIso() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}

const BLOCKED_CONTACT = new Set(['suppressed', 'invalid'])
const REVIEW_SIGNAL_TYPES = new Set(['app_store', 'google_play', 'trustpilot', 'g2', 'capterra'])
const REVIEW_SIGNAL_LABEL: Record<string, string> = {
  app_store: 'App Store',
  google_play: 'Google Play',
  trustpilot: 'Trustpilot',
  g2: 'G2',
  capterra: 'Capterra',
}

export async function getAcquisitionPipeline(): Promise<PipelineData> {
  const admin = getSupabaseAdminClient() as any
  const [companiesResult, contactsResult, messagesResult, signalsResult, reportsResult] = await Promise.all([
    admin
      .from('acquisition_companies')
      .select('id, name, domain, status, relevance_score, source_notes, created_at')
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(500),
    admin
      .from('acquisition_contacts')
      .select('id, company_id, email, full_name, role, email_status, email_source_url, confidence')
      .limit(3000),
    admin
      .from('acquisition_messages')
      .select('id, contact_id, subject, body, status, created_at, sent_at, delivered_at, clicked_at, bounced_at, bounce_reason, replied_at, follow_up_of, contact:acquisition_contacts(email, company_id, company:acquisition_companies(name, domain))')
      .order('created_at', { ascending: false })
      .limit(3000),
    admin
      .from('acquisition_signals')
      .select('company_id, signal_type, source_url')
      .limit(5000),
    admin
      .from('acquisition_reports')
      .select('company_id, token, subject_name, source_label, review_count, view_count, last_viewed_at, report, created_at')
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1000),
  ])

  // Si la migration acquisition_reports n'est pas encore appliquée, on ne bloque pas la console.
  const failed = Boolean(companiesResult.error || contactsResult.error || messagesResult.error)
  const companies = (companiesResult.data ?? []) as Array<{
    id: string
    name: string
    domain: string
    status: string
    relevance_score: number | null
    source_notes: string | null
  }>
  const contacts = (contactsResult.data ?? []) as Array<{
    id: string
    company_id: string
    email: string
    full_name: string | null
    role: string | null
    email_status: string
    email_source_url: string | null
    confidence: number | null
  }>
  const rawMessages = (messagesResult.data ?? []) as any[]
  const rawSignals = (signalsResult.data ?? []) as Array<{ company_id: string; signal_type: string; source_url: string }>
  const rawReports = (reportsResult.error ? [] : (reportsResult.data ?? [])) as Array<{
    company_id: string | null
    token: string
    subject_name: string
    source_label: string
    review_count: number
    view_count: number
    last_viewed_at: string | null
    report: ProspectReport | null
  }>

  const reviewSourcesByCompany = new Map<string, PipelineReviewSource[]>()
  for (const sig of rawSignals) {
    if (!REVIEW_SIGNAL_TYPES.has(sig.signal_type)) continue
    const list = reviewSourcesByCompany.get(sig.company_id) ?? []
    if (!list.some((item) => item.type === sig.signal_type)) {
      list.push({
        type: sig.signal_type,
        label: REVIEW_SIGNAL_LABEL[sig.signal_type] ?? sig.signal_type,
        url: sig.source_url,
      })
      reviewSourcesByCompany.set(sig.company_id, list)
    }
  }

  const reportByCompany = new Map<string, PipelineReportSummary>()
  const reportByToken = new Map<string, PipelineReportSummary>()
  for (const row of rawReports) {
    const summary: PipelineReportSummary = {
      token: row.token,
      url: publicReportUrl(row.token),
      subjectName: row.subject_name,
      sourceLabel: row.source_label,
      reviewCount: row.review_count,
      topProblem: row.report?.problems?.[0]?.title ?? null,
      viewCount: row.view_count ?? 0,
      lastViewedAt: row.last_viewed_at ?? null,
    }
    reportByToken.set(row.token, summary)
    if (row.company_id && !reportByCompany.has(row.company_id)) {
      reportByCompany.set(row.company_id, summary)
    }
  }

  const contactIdsWithMessage = new Set(rawMessages.map((message) => message.contact_id as string))
  const latestByContact = new Map<string, any>()
  for (const message of rawMessages) if (!latestByContact.has(message.contact_id)) latestByContact.set(message.contact_id, message)
  const dueBefore = Date.now() - FOLLOW_UP_AFTER_DAYS * 86_400_000

  const messages: PipelineMessage[] = rawMessages.map((message) => {
    const companyId: string | null = message.contact?.company_id ?? null
    const tokenInBody = typeof message.body === 'string' ? message.body.match(/\/rapport\/([\w-]{12,80})/)?.[1] : undefined
    const attachedReport = (tokenInBody ? reportByToken.get(tokenInBody) : undefined) ?? (companyId ? reportByCompany.get(companyId) : undefined) ?? null
    return {
      id: message.id,
      contactId: message.contact_id,
      companyId,
      subject: message.subject,
      body: message.body,
      status: message.status,
      createdAt: message.created_at,
      sentAt: message.sent_at ?? null,
      deliveredAt: message.delivered_at ?? null,
      clickedAt: message.clicked_at ?? null,
      bouncedAt: message.bounced_at ?? null,
      bounceReason: message.bounce_reason ?? null,
      repliedAt: message.replied_at ?? null,
      isFollowUp: Boolean(message.follow_up_of),
      followUpDue:
        message.status === 'sent' &&
        !message.follow_up_of &&
        latestByContact.get(message.contact_id)?.id === message.id &&
        message.sent_at != null &&
        new Date(message.sent_at).getTime() <= dueBefore,
      email: message.contact?.email ?? 'Contact inconnu',
      company: message.contact?.company?.name ?? message.contact?.company?.domain ?? 'Entreprise inconnue',
      report: attachedReport,
    }
  })

  const contactsByCompany = new Map<string, PipelineContact[]>()
  for (const contact of contacts.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))) {
    const list = contactsByCompany.get(contact.company_id) ?? []
    list.push({
      id: contact.id,
      email: contact.email,
      full_name: contact.full_name,
      role: contact.role,
      email_status: contact.email_status,
      email_source_url: contact.email_source_url,
      generic: GENERIC_EMAIL.test(contact.email),
    })
    contactsByCompany.set(contact.company_id, list)
  }

  const queue: QueueItem[] = []
  for (const company of companies) {
    const all = contactsByCompany.get(company.id) ?? []
    const usable = all.filter((contact) => !BLOCKED_CONTACT.has(contact.email_status))
    const alreadyContacted = usable.some((contact) => contactIdsWithMessage.has(contact.id))
    const isAgencyCompany = isAgency(company.name, company.source_notes)
    const isEcommerceCompany = /e-?commerce|d2c|boutique|shopify|maroquinerie|vêtement/i.test(`${company.name} ${company.source_notes ?? ''}`)
    const isSaasCompany = !isAgencyCompany && !isEcommerceCompany && (/saas|logiciel|app\b|software|btp|b2b|compta|facturation|gestion/i.test(`${company.name} ${company.source_notes ?? ''}`))
    const category: QueueItemCategory = isAgencyCompany ? 'agency' : isEcommerceCompany ? 'ecommerce' : isSaasCompany ? 'saas' : 'other'

    const base = {
      id: company.id,
      name: company.name,
      domain: company.domain,
      relevanceScore: company.relevance_score,
      notes: company.source_notes,
      isAgency: isAgencyCompany,
      category,
      reviewSources: reviewSourcesByCompany.get(company.id) ?? [],
      report: reportByCompany.get(company.id) ?? null,
    }
    if (all.length === 0) {
      queue.push({ ...base, state: company.status === 'discovered' ? 'scan' : 'empty', contacts: [] })
    } else if (usable.length > 0 && !alreadyContacted) {
      queue.push({ ...base, state: 'ready', contacts: usable.sort((a, b) => Number(a.generic) - Number(b.generic)) })
    }
  }

  // Tri intelligent : rapports prêts en tête, puis prêts à rédiger, puis score de pertinence décroissant.
  const stateRank: Record<QueueState, number> = { ready: 0, scan: 1, empty: 2 }
  queue.sort((a, b) => {
    if (Boolean(a.report) !== Boolean(b.report)) return a.report ? -1 : 1
    if (stateRank[a.state] !== stateRank[b.state]) return stateRank[a.state] - stateRank[b.state]
    return (b.relevanceScore ?? -1) - (a.relevanceScore ?? -1)
  })

  const todayStart = new Date(startOfTodayIso()).getTime()
  const sent = messages.filter((message) => message.sentAt)
  const bounceSince = Date.now() - BOUNCE_RATE_WINDOW_DAYS * 86_400_000
  const recentSent = sent.filter((message) => new Date(message.sentAt as string).getTime() >= bounceSince)
  const recentBounced = messages.filter((message) => message.status === 'bounced' && new Date(message.bouncedAt ?? message.sentAt ?? message.createdAt).getTime() >= bounceSince)
  const bounced = messages.filter((message) => message.status === 'bounced').length
  const replied = messages.filter((message) => message.status === 'replied').length
  const reached = Math.max(0, sent.length - bounced)
  const bounceRate = recentSent.length ? Math.round((recentBounced.length / recentSent.length) * 100) : 0
  const stats: PipelineStats = {
    sentToday: sent.filter((message) => new Date(message.sentAt as string).getTime() >= todayStart).length,
    dailyLimit: rampedDailyLimit({ firstSentAt: sent.length ? sent.map((m) => m.sentAt as string).sort()[0] : null, recentSent: recentSent.length, recentBounced: recentBounced.length }),
    sentTotal: sent.length,
    delivered: messages.filter((message) => message.deliveredAt).length,
    bounced,
    bounceRate,
    pausedForBounces: recentSent.length >= 10 && bounceRate > 10,
    replied,
    replyRate: reached ? Math.round((replied / reached) * 100) : 0,
    drafts: messages.filter((message) => message.status === 'draft' || message.status === 'approved').length,
    reportsCreated: rawReports.length,
    reportsOpened: rawReports.filter((r) => (r.view_count ?? 0) > 0).length,
  }
  return {
    queue,
    drafts: messages.filter((message) => message.status === 'draft' || message.status === 'approved').reverse(),
    tracking: messages
      .filter((message) => ['sent', 'replied', 'bounced', 'suppressed'].includes(message.status))
      .sort((a, b) => new Date(b.sentAt ?? b.createdAt).getTime() - new Date(a.sentAt ?? a.createdAt).getTime()),
    stats,
    failed,
  }
}
