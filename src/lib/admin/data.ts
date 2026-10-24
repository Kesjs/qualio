import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { isAllowedAdmin } from '@/lib/admin/auth'
import { LIFECYCLE_EMAIL_TYPES } from '@/lib/email/policy'
import { escapeLike, OPEN_FEEDBACK_STATUSES } from '@/lib/admin/format'

export const PAGE_SIZE = 25
const WEEK_MS = 7 * 86_400_000
/** Les comptes sont lus par pages de 1 000, jusqu'à 5 pages : au-delà, l'affichage est signalé comme partiel. */
const AUTH_PAGE_SIZE = 1000
const AUTH_MAX_PAGES = 5

export type AdminFeedback = {
  id: string; category: string; message: string; context: string | null; status: string; priority: string
  allow_contact: boolean; allow_public_testimonial: boolean; testimonial_name: string | null; testimonial_role: string | null; admin_note: string | null; created_at: string
}
export type AdminEmail = { id: string; event_type: string; recipient: string; status: string; created_at: string; last_error: string | null }
export type AdminSite = { id: string; name: string | null; url: string; created_at: string }
export type AdminUser = { id: string; email: string | null; created_at: string; last_sign_in_at: string | null; isAdmin: boolean; plan: string | null; projects: number }
export type Paged<T> = { rows: T[]; total: number; page: number; pageSize: number; failed: boolean }
export type AcquisitionCompany = { id: string; name: string; domain: string; website_url: string | null; company_size: string | null; relevance_score: number | null; status: string; source_url: string | null; source_notes: string | null; created_at: string }
export type AcquisitionContact = { id: string; company_id: string; full_name: string | null; role: string | null; email: string; email_status: string; confidence: number | null; company?: { name: string; domain: string } | null }
export type AcquisitionSignal = { id: string; company_id: string; signal_type: string; label: string; source_url: string; evidence: string | null; confidence: number | null; company?: { name: string; domain: string } | null }

const FEEDBACK_COLUMNS = 'id, category, message, context, status, priority, allow_contact, allow_public_testimonial, testimonial_name, testimonial_role, admin_note, created_at'
const EMAIL_COLUMNS = 'id, event_type, recipient, status, created_at, last_error'

/** Retours qui attendent une décision : nouveaux, ou prioritaires et encore ouverts. */
const ACTION_FILTER = `status.eq.new,and(priority.eq.high,status.in.(${OPEN_FEEDBACK_STATUSES.join(',')}))`

async function fetchAuthUsers(admin: any) {
  const users: any[] = []
  for (let page = 1; page <= AUTH_MAX_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: AUTH_PAGE_SIZE })
    if (error) return { users, truncated: false, failed: true }
    const batch = data?.users ?? []
    users.push(...batch)
    if (batch.length < AUTH_PAGE_SIZE) return { users, truncated: false, failed: false }
  }
  return { users, truncated: true, failed: false }
}

const byNewest = (a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at))

/** Exécute une requête paginée ; si la page demandée dépasse la fin, revient à la première. */
async function ranged<T>(build: () => any, page: number): Promise<Paged<T>> {
  const run = (p: number) => build().range((p - 1) * PAGE_SIZE, p * PAGE_SIZE - 1)
  let current = page
  let result = await run(current)
  if (result.error && current > 1) { current = 1; result = await run(current) }
  return { rows: (result.data ?? []) as T[], total: result.count ?? 0, page: current, pageSize: PAGE_SIZE, failed: Boolean(result.error) }
}

export async function getOverview() {
  const admin = getSupabaseAdminClient() as any
  const since = new Date(Date.now() - WEEK_MS).toISOString()
  const [users, sites, feedback, newFeedback, lifecycleSent, actions, latestFeedback, recentEmails, weekEmails, recentSites, siteOwners, auth] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('sites').select('id', { count: 'exact', head: true }),
    admin.from('product_feedback').select('id', { count: 'exact', head: true }),
    admin.from('product_feedback').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    admin.from('email_log').select('id', { count: 'exact', head: true }).eq('status', 'sent').in('event_type', [...LIFECYCLE_EMAIL_TYPES]),
    admin.from('product_feedback').select(FEEDBACK_COLUMNS, { count: 'exact' }).or(ACTION_FILTER).order('created_at', { ascending: false }).limit(5),
    admin.from('product_feedback').select(FEEDBACK_COLUMNS).order('created_at', { ascending: false }).limit(5),
    admin.from('email_log').select(EMAIL_COLUMNS).order('created_at', { ascending: false }).limit(8),
    admin.from('email_log').select('status').gte('created_at', since).limit(5000),
    admin.from('sites').select('id, name, url, created_at').order('created_at', { ascending: false }).limit(6),
    admin.from('sites').select('user_id').limit(10000),
    fetchAuthUsers(admin),
  ])
  const emailsByStatus: Record<string, number> = { pending: 0, sent: 0, failed: 0, suppressed: 0 }
  for (const row of (weekEmails.data ?? []) as Array<{ status: string }>) emailsByStatus[row.status] = (emailsByStatus[row.status] ?? 0) + 1
  const usersTotal = users.count ?? 0
  const activated = new Set(((siteOwners.data ?? []) as Array<{ user_id: string }>).map((row) => row.user_id)).size
  const sortedUsers = [...auth.users].sort(byNewest)
  const recentUsers: AdminUser[] = sortedUsers.slice(0, 6).map((user) => ({ id: user.id, email: user.email ?? null, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at ?? null, isAdmin: isAllowedAdmin(user), plan: null, projects: 0 }))
  const failed = [users, sites, feedback, newFeedback, lifecycleSent, actions, latestFeedback, recentEmails, weekEmails, recentSites, siteOwners].some((result) => result.error) || auth.failed
  return {
    failed,
    generatedAt: new Date(),
    metrics: {
      users: usersTotal,
      newUsersWeek: auth.users.filter((user) => Date.now() - Date.parse(user.created_at) < WEEK_MS).length,
      activated,
      sites: sites.count ?? 0,
      feedback: feedback.count ?? 0,
      newFeedback: newFeedback.count ?? 0,
      lifecycleSent: lifecycleSent.count ?? 0,
      emailsByStatus,
    },
    actionsTotal: (actions.count ?? 0) as number,
    actions: (actions.data ?? []) as AdminFeedback[],
    latestFeedback: (latestFeedback.data ?? []) as AdminFeedback[],
    recentEmails: (recentEmails.data ?? []) as AdminEmail[],
    recentSites: (recentSites.data ?? []) as AdminSite[],
    recentUsers,
  }
}

export async function getUsersPage({ page, q }: { page: number; q: string }): Promise<Paged<AdminUser> & { truncated: boolean }> {
  const admin = getSupabaseAdminClient() as any
  const auth = await fetchAuthUsers(admin)
  const term = q.toLowerCase()
  const filtered = auth.users.filter((user) => !term || String(user.email ?? '').toLowerCase().includes(term)).sort(byNewest)
  const total = filtered.length
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const current = Math.min(page, lastPage)
  const slice = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const ids = slice.map((user) => user.id)
  const [profiles, sites] = ids.length
    ? await Promise.all([admin.from('profiles').select('id, plan').in('id', ids), admin.from('sites').select('user_id').in('user_id', ids)])
    : [{ data: [], error: null }, { data: [], error: null }]
  const plans = new Map<string, string>(((profiles.data ?? []) as Array<{ id: string; plan: string | null }>).map((row) => [row.id, row.plan ?? '']))
  const projects = new Map<string, number>()
  for (const row of (sites.data ?? []) as Array<{ user_id: string }>) projects.set(row.user_id, (projects.get(row.user_id) ?? 0) + 1)
  const rows: AdminUser[] = slice.map((user) => ({ id: user.id, email: user.email ?? null, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at ?? null, isAdmin: isAllowedAdmin(user), plan: plans.get(user.id) || null, projects: projects.get(user.id) ?? 0 }))
  return { rows, total, page: current, pageSize: PAGE_SIZE, failed: auth.failed || Boolean(profiles.error) || Boolean(sites.error), truncated: auth.truncated }
}

export async function getFeedbackPage({ page, status, category, priority, q }: { page: number; status: string; category: string; priority: string; q: string }) {
  const admin = getSupabaseAdminClient() as any
  return ranged<AdminFeedback>(() => {
    let query = admin.from('product_feedback').select(FEEDBACK_COLUMNS, { count: 'exact' })
    if (status) query = query.eq('status', status)
    if (category) query = query.eq('category', category)
    if (priority) query = query.eq('priority', priority)
    if (q) query = query.ilike('message', `%${escapeLike(q)}%`)
    return query.order('created_at', { ascending: false })
  }, page)
}

export async function getActionsPage({ page }: { page: number }) {
  const admin = getSupabaseAdminClient() as any
  return ranged<AdminFeedback>(() => admin.from('product_feedback').select(FEEDBACK_COLUMNS, { count: 'exact' }).or(ACTION_FILTER).order('created_at', { ascending: false }), page)
}

export async function getEmailsPage({ page, status, type }: { page: number; status: string; type: string }) {
  const admin = getSupabaseAdminClient() as any
  return ranged<AdminEmail>(() => {
    let query = admin.from('email_log').select(EMAIL_COLUMNS, { count: 'exact' })
    if (status) query = query.eq('status', status)
    if (type) query = query.eq('event_type', type)
    return query.order('created_at', { ascending: false })
  }, page)
}

/** Témoignages déjà publiés, par identifiant de retour. */
export async function getPublishedTestimonials(feedbackIds: string[]) {
  if (feedbackIds.length === 0) return new Map<string, { quote: string; name: string; role: string }>()
  const admin = getSupabaseAdminClient() as any
  const { data } = await admin.from('public_testimonials').select('feedback_id, quote, name, role').in('feedback_id', feedbackIds)
  return new Map<string, { quote: string; name: string; role: string }>(((data ?? []) as Array<{ feedback_id: string; quote: string; name: string; role: string }>).map((row) => [row.feedback_id, { quote: row.quote, name: row.name, role: row.role }]))
}

export async function getAcquisitionOverview() {
  const admin = getSupabaseAdminClient() as any
  const [companies, approved, contacts, verified, messages, events] = await Promise.all([
    admin.from('acquisition_companies').select('id', { count: 'exact', head: true }),
    admin.from('acquisition_companies').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    admin.from('acquisition_contacts').select('id', { count: 'exact', head: true }),
    admin.from('acquisition_contacts').select('id', { count: 'exact', head: true }).eq('email_status', 'verified'),
    admin.from('acquisition_messages').select('status').limit(5000),
    admin.from('acquisition_visitor_events').select('session_id, event_name, path, company_domain, created_at').order('created_at', { ascending: false }).limit(100),
  ])
  const messageCounts = { draft: 0, approved: 0, sent: 0, replied: 0, bounced: 0, suppressed: 0 } as Record<string, number>
  for (const row of messages.data ?? []) messageCounts[row.status] = (messageCounts[row.status] ?? 0) + 1
  return { companies: companies.count ?? 0, approved: approved.count ?? 0, contacts: contacts.count ?? 0, verified: verified.count ?? 0, messageCounts, events: events.data ?? [], failed: [companies, approved, contacts, verified, messages, events].some((r) => r.error) }
}

export async function getAcquisitionCompanies(): Promise<{ rows: AcquisitionCompany[]; failed: boolean }> {
  const { data, error } = await (getSupabaseAdminClient() as any).from('acquisition_companies').select('id, name, domain, website_url, company_size, relevance_score, status, source_url, source_notes, created_at').order('created_at', { ascending: false }).limit(100)
  return { rows: data ?? [], failed: Boolean(error) }
}

export async function getAcquisitionContacts(): Promise<{ rows: AcquisitionContact[]; failed: boolean }> {
  const { data, error } = await (getSupabaseAdminClient() as any).from('acquisition_contacts').select('id, company_id, full_name, role, email, email_status, confidence, company:acquisition_companies(name, domain)').order('created_at', { ascending: false }).limit(100)
  return { rows: data ?? [], failed: Boolean(error) }
}

export async function getAcquisitionSignals(): Promise<{ rows: AcquisitionSignal[]; failed: boolean }> {
  const { data, error } = await (getSupabaseAdminClient() as any).from('acquisition_signals').select('id, company_id, signal_type, label, source_url, evidence, confidence, company:acquisition_companies(name, domain)').order('created_at', { ascending: false }).limit(200)
  const unique = Array.from(new Map((data ?? []).map((row: AcquisitionSignal) => [`${row.company_id}:${row.signal_type}:${row.source_url}`, row])).values()) as AcquisitionSignal[]
  return { rows: unique, failed: Boolean(error) }
}
