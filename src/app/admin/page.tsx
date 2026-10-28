import type { Metadata } from 'next'
import Link from 'next/link'
import { getAdminContext } from '@/lib/admin/auth'
import { getOverview } from '@/lib/admin/data'
import { CATEGORY_LABELS, EMAIL_STATUS_LABELS, EMAIL_TYPE_LABELS, STATUS_LABELS, excerpt, formatDate, formatDateTime, formatTime, labelOf, percent } from '@/lib/admin/format'
import { Badge, EmptyState, FOCUS, Notice, PageHeader, Panel, StatCard, emailTone, statusTone } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Vue d’ensemble' }

const LINK = `rounded text-sm font-semibold text-[#c2410c] dark:text-[#ff9a66] underline-offset-4 hover:underline ${FOCUS}`

export default async function AdminPage() {
  await getAdminContext()
  const data = await getOverview()
  const { metrics } = data
  const sentWeek = metrics.emailsByStatus.sent ?? 0
  const failedWeek = metrics.emailsByStatus.failed ?? 0
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Console interne"
        title="Vue d’ensemble"
        description="Les utilisateurs, projets, retours et emails réels de Qualio."
        aside={<Badge tone="success">Données lues à {formatTime(data.generatedAt)}</Badge>}
      />
      {data.failed && <Notice tone="warning">Certaines données n’ont pas pu être chargées. Les chiffres affichés peuvent être incomplets : rechargez la page dans un instant.</Notice>}

      <section aria-label="Chiffres clés" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Utilisateurs inscrits" value={metrics.users} hint={`${metrics.newUsersWeek} sur les 7 derniers jours`} href="/admin/users" />
        <StatCard label="Activation" value={`${percent(metrics.activated, metrics.users)} %`} hint={`${metrics.activated} sur ${metrics.users} ont créé un projet`} />
        <StatCard label="Projets créés" value={metrics.sites} hint="Espaces configurés" />
        <StatCard label="Retours à traiter" value={metrics.newFeedback} hint={`sur ${metrics.feedback} au total`} href="/admin/feedback?status=new" tone={metrics.newFeedback > 0 ? 'accent' : 'neutral'} />
        <StatCard label="Emails envoyés (7 jours)" value={sentWeek} hint={`${metrics.lifecycleSent} bienvenue et relances au total`} href="/admin/emails?status=sent" />
        <StatCard label="Échecs d’envoi (7 jours)" value={failedWeek} hint={failedWeek > 0 ? 'À vérifier dans l’historique' : 'Aucun échec'} href="/admin/emails?status=failed" tone={failedWeek > 0 ? 'danger' : 'neutral'} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel id="actions" title="À traiter maintenant" description="Retours nouveaux, ou prioritaires et encore ouverts." action={data.actionsTotal > 0 ? <Link href="/admin/actions" className={LINK}>Tout voir ({data.actionsTotal})</Link> : undefined}>
          {data.actions.length === 0 ? (
            <EmptyState title="Rien en attente" description="Tous les retours ont reçu une décision. Revenez après les prochains retours." />
          ) : (
            <ul role="list" className="divide-y divide-gray-200/80 dark:divide-white/[0.08]">
              {data.actions.map((item) => (
                <li key={item.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{labelOf(CATEGORY_LABELS, item.category)}</p>
                    <p className="mt-1 break-words text-sm leading-6 text-gray-600 dark:text-zinc-300">{excerpt(item.message, 140)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {item.priority === 'high' && <Badge tone="danger">Prioritaire</Badge>}
                    <Badge tone={statusTone(item.status)}>{labelOf(STATUS_LABELS, item.status)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel id="sante-envois" title="Santé des envois" description="Emails des 7 derniers jours, par statut." action={<Link href="/admin/emails" className={LINK}>Historique</Link>}>
          <dl className="grid grid-cols-2 gap-3">
            {(['sent', 'failed', 'pending', 'suppressed'] as const).map((status) => (
              <div key={status} className="rounded-xl border border-gray-200/80 dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#111216] p-4">
                <dt className="text-xs font-medium text-gray-500 dark:text-zinc-400">{labelOf(EMAIL_STATUS_LABELS, status)}</dt>
                <dd className={`mt-2 font-mono text-2xl font-semibold ${status === 'failed' && (metrics.emailsByStatus.failed ?? 0) > 0 ? 'text-red-700 dark:text-red-300' : ''}`}>{metrics.emailsByStatus[status] ?? 0}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel id="inscriptions" title="Inscriptions récentes" action={<Link href="/admin/users" className={LINK}>Tous les comptes</Link>}>
          {data.recentUsers.length === 0 ? <EmptyState title="Aucun compte" /> : (
            <ul role="list" className="divide-y divide-gray-200/80 dark:divide-white/[0.08]">
              {data.recentUsers.map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-gray-900 dark:text-zinc-100" title={user.email ?? undefined}>{user.email ?? 'Email indisponible'}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Inscrit le <time dateTime={user.created_at}>{formatDate(user.created_at)}</time></p>
                  </div>
                  {user.isAdmin && <Badge tone="accent">Admin</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel id="projets" title="Projets récents" description="Les espaces créés en dernier.">
          {data.recentSites.length === 0 ? <EmptyState title="Aucun projet" /> : (
            <ul role="list" className="divide-y divide-gray-200/80 dark:divide-white/[0.08]">
              {data.recentSites.map((site) => (
                <li key={site.id} className="py-3">
                  <p className="truncate text-sm text-gray-900 dark:text-zinc-100">{site.name || site.url}</p>
                  <p className="mt-1 truncate font-mono text-xs text-gray-500 dark:text-zinc-400">{site.url} · <time dateTime={site.created_at}>{formatDate(site.created_at)}</time></p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel id="derniers-emails" title="Derniers emails" action={<Link href="/admin/emails" className={LINK}>Voir tout</Link>}>
          {data.recentEmails.length === 0 ? <EmptyState title="Aucun email envoyé" /> : (
            <ul role="list" className="divide-y divide-gray-200/80 dark:divide-white/[0.08]">
              {data.recentEmails.map((email) => (
                <li key={email.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-gray-900 dark:text-zinc-100" title={email.recipient}>{email.recipient}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{labelOf(EMAIL_TYPE_LABELS, email.event_type)} · <time dateTime={email.created_at}>{formatDateTime(email.created_at)}</time></p>
                  </div>
                  <Badge tone={emailTone(email.status)}>{labelOf(EMAIL_STATUS_LABELS, email.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel id="retours-recents" title="Retours récents" action={<Link href="/admin/feedback" className={LINK}>Voir tout</Link>}>
          {data.latestFeedback.length === 0 ? <EmptyState title="Aucun retour reçu" description="Les retours envoyés depuis le tableau de bord apparaîtront ici." /> : (
            <ul role="list" className="divide-y divide-gray-200/80 dark:divide-white/[0.08]">
              {data.latestFeedback.map((item) => (
                <li key={item.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{labelOf(CATEGORY_LABELS, item.category)}</p>
                    <time dateTime={item.created_at} className="font-mono text-xs text-gray-500 dark:text-zinc-400">{formatDate(item.created_at)}</time>
                  </div>
                  <p className="mt-1 break-words text-sm leading-6 text-gray-600 dark:text-zinc-300">{excerpt(item.message, 120)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
