import Link from 'next/link'
import type { Metadata } from 'next'
import { getAdminContext } from '@/lib/admin/auth'
import { getAcquisitionOverview } from '@/lib/admin/data'
import { BTN_PRIMARY, BTN_SECONDARY, EmptyState, FOCUS, Notice, PageHeader, Panel, TableRegion, TD, TH } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Visiteurs' }

type Period = 7 | 30 | null
type VisitorEvent = {
  session_id: string
  event_name: string
  path: string
  company_domain: string | null
  acquisition_message_id: string | null
  utm_campaign: string | null
  created_at: string
}
type MessageRow = {
  id: string
  status: string
  subject: string | null
  sent_at: string | null
  delivered_at: string | null
  contact?: { email?: string | null; company?: { name?: string | null; domain?: string | null } | null } | null
}

const EVENT_LABELS: Record<string, string> = {
  email_clicked: 'Clic dans un email',
  page_view: 'Page consultée',
  cta_clicked: 'CTA cliqué',
  widget_opened: 'Widget ouvert',
  feedback_submitted: 'Avis envoyé',
}

function parsePeriod(value: string | string[] | undefined): Period {
  const candidate = Array.isArray(value) ? value[0] : value
  if (candidate === '30') return 30
  if (candidate === 'all') return null
  return 7
}

function periodLabel(period: Period) {
  return period === 30 ? '30 derniers jours' : period === null ? 'Depuis le début' : '7 derniers jours'
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function messageContact(message: MessageRow | undefined) {
  const contact = Array.isArray(message?.contact) ? message?.contact[0] : message?.contact
  const company = Array.isArray(contact?.company) ? contact?.company[0] : contact?.company
  return { email: contact?.email ?? null, company: company?.name ?? company?.domain ?? null }
}

export default async function VisitorsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await getAdminContext()
  const params = await searchParams
  const period = parsePeriod(params.period)
  const data = await getAcquisitionOverview(period)
  const events = data.events as VisitorEvent[]
  const messages = data.messages as MessageRow[]
  const messageById = new Map(messages.map((message) => [message.id, message]))
  const sessions = new Map<string, { latest: VisitorEvent; events: VisitorEvent[]; paths: Set<string> }>()

  for (const event of events) {
    const current = sessions.get(event.session_id)
    if (current) {
      current.events.push(event)
      current.paths.add(event.path)
      if (new Date(event.created_at).getTime() > new Date(current.latest.created_at).getTime()) current.latest = event
    } else {
      sessions.set(event.session_id, { latest: event, events: [event], paths: new Set([event.path]) })
    }
  }

  const sessionRows = [...sessions.values()].sort((a, b) => new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime())
  const emailSessions = new Set(events.filter((event) => event.event_name === 'email_clicked' || event.acquisition_message_id).map((event) => event.session_id))
  const pageViews = events.filter((event) => event.event_name === 'page_view').length
  const actions = events.filter((event) => ['cta_clicked', 'widget_opened', 'feedback_submitted'].includes(event.event_name)).length
  const sent = messages.filter((message) => message.sent_at).length
  const delivered = messages.filter((message) => message.delivered_at).length
  const clickRate = sent ? Math.round((emailSessions.size / sent) * 100) : 0
  const actionRate = sessionRows.length ? Math.round((actions / sessionRows.length) * 100) : 0

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Acquisition / Visiteurs"
        title="Visiteurs et signaux"
        description="Comprends l’intérêt généré par tes emails, puis choisis la prochaine action. Les identités restent anonymes tant qu’une personne ne se signale pas volontairement."
        aside={<Link href="/admin/acquisition" className={BTN_SECONDARY}>Ouvrir la prospection</Link>}
      />

      <section aria-labelledby="period-title" className="rounded-2xl border border-white/10 bg-[#1d1a18] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="period-title" className="text-xl font-semibold">Ce qui mérite ton attention</h2>
            <p className="mt-1 text-sm text-stone-400">{periodLabel(period)} · données mises à jour à l’ouverture de la page</p>
          </div>
          <nav aria-label="Période" className="flex flex-wrap gap-2">
            <Link href="/admin/acquisition/visitors?period=7" aria-current={period === 7 ? 'page' : undefined} className={period === 7 ? BTN_PRIMARY : BTN_SECONDARY}>7 jours</Link>
            <Link href="/admin/acquisition/visitors?period=30" aria-current={period === 30 ? 'page' : undefined} className={period === 30 ? BTN_PRIMARY : BTN_SECONDARY}>30 jours</Link>
            <Link href="/admin/acquisition/visitors?period=all" aria-current={period === null ? 'page' : undefined} className={period === null ? BTN_PRIMARY : BTN_SECONDARY}>Tout</Link>
          </nav>
        </div>
        <div className="mt-6 grid divide-y divide-white/10 border-y border-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          <Metric value={sessionRows.length} label="Sessions distinctes" hint="visites observées" />
          <Metric value={emailSessions.size} label="Depuis un email" hint="clic confirmé" />
          <Metric value={pageViews} label="Pages consultées" hint="événements enregistrés" />
          <Metric value={actions} label="Actions utiles" hint="CTA, widget ou avis" />
        </div>
      </section>

      {data.failed && <Notice tone="warning">Une partie des données n’a pas pu être chargée. Recharge la page ; les chiffres affichés peuvent être incomplets.</Notice>}

      <Panel id="funnel" title="Du message à l’action" description="Un même indicateur de période pour comprendre où l’intérêt se transforme — ou se perd.">
        <div className="grid gap-3 md:grid-cols-4">
          <FunnelStep label="Emails envoyés" value={sent} hint={`${delivered} livrés`} />
          <FunnelStep label="Clics confirmés" value={emailSessions.size} hint={sent ? `${clickRate} % des emails` : 'Aucun envoi sur la période'} />
          <FunnelStep label="Sessions" value={sessionRows.length} hint="visites distinctes" />
          <FunnelStep label="Actions" value={actions} hint={sessionRows.length ? `${actionRate} % des sessions` : 'Aucune session'} />
        </div>
      </Panel>

      <Notice tone="info">Les domaines d’entreprise sont des estimations et ne permettent pas d’identifier une personne. Un clic email est associé à une session technique, pas à une identité personnelle.</Notice>

      <Panel id="events" title="Sessions récentes" description="Une ligne par session, avec le contexte nécessaire pour décider quoi faire ensuite.">
        {sessionRows.length === 0 ? (
          <EmptyState title="Aucun signal sur cette période" description="Les sessions apparaîtront après un clic dans un email ou une action sur le site." action={<Link href="/admin/acquisition" className={BTN_PRIMARY}>Voir la prospection</Link>} />
        ) : (
          <TableRegion label="Sessions récentes">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-white/10 bg-[#161413]"><tr><th className={TH}>Session</th><th className={TH}>Source</th><th className={TH}>Activité</th><th className={TH}>Dernier signal</th><th className={TH}><span className="sr-only">Action</span></th></tr></thead>
              <tbody className="divide-y divide-white/10 bg-[#1d1a18]">
                {sessionRows.map((session) => {
                  const first = session.events.find((event) => event.acquisition_message_id) ?? session.latest
                  const message = first.acquisition_message_id ? messageById.get(first.acquisition_message_id) : undefined
                  const contact = messageContact(message)
                  return (
                    <tr key={session.latest.session_id}>
                      <td className={TD}><span className="block font-medium text-stone-100">{first.company_domain ?? contact.company ?? 'Session anonyme'}</span><span className="mt-1 block font-mono text-xs text-stone-500">{dateLabel(session.latest.created_at)}</span></td>
                      <td className={TD}><span className="block text-stone-200">{first.acquisition_message_id ? 'Email Qualio' : 'Accès direct'}</span>{contact.email && <span className="mt-1 block font-mono text-xs text-stone-500">{contact.email}</span>}</td>
                      <td className={TD}><span className="block text-stone-200">{session.events.length} événement(s) · {session.paths.size} page(s)</span><span className="mt-1 block text-xs text-stone-500">{session.events.map((event) => EVENT_LABELS[event.event_name] ?? event.event_name).filter((label, index, list) => list.indexOf(label) === index).join(' · ')}</span></td>
                      <td className={TD}><span className="block text-stone-200">{EVENT_LABELS[session.latest.event_name] ?? session.latest.event_name}</span><span className="mt-1 block font-mono text-xs text-stone-500">{session.latest.path}</span></td>
                      <td className={`${TD} text-right`}><Link href="/admin/acquisition" className={`inline-flex min-h-10 items-center rounded-lg border border-[#ee6018]/50 px-3 text-xs font-semibold text-[#ffb08a] hover:bg-[#ee6018]/10 ${FOCUS}`}>Voir la prospection</Link></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableRegion>
        )}
      </Panel>
    </div>
  )
}

function Metric({ value, label, hint }: { value: number; label: string; hint: string }) {
  return <div className="px-1 py-4 sm:px-4"><p className="font-mono text-3xl font-semibold text-[#ffb08a]">{value}</p><p className="mt-1 text-sm font-semibold text-stone-200">{label}</p><p className="mt-1 text-xs text-stone-500">{hint}</p></div>
}

function FunnelStep({ label, value, hint }: { label: string; value: number; hint: string }) {
  return <div className="rounded-xl border border-white/10 bg-[#161413] p-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-stone-500">{label}</p><p className="mt-3 font-mono text-2xl font-semibold text-stone-100">{value}</p><p className="mt-1 text-xs text-stone-400">{hint}</p></div>
}
