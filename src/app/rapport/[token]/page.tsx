import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StarIcon } from '@heroicons/react/20/solid'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { isAutomatedUserAgent } from '@/lib/admin/acquisition-clicks'
import { reportImageUrl } from '@/lib/admin/acquisition-report-url'
import type { ProspectReport, ReportProblem } from '@/lib/admin/acquisition-report'
import { ACCENT, ACCENT_INK, FOCUS, INK, LINE, MUTED, SIGNUP, SOFT } from '@/components/landing/tokens'

export const dynamic = 'force-dynamic'
const BASE_METADATA: Metadata = {
  title: 'Rapport d’analyse · Qualio',
  robots: { index: false, follow: false },
}

/** Aperçu de partage (LinkedIn, X, WhatsApp) : l'image générée pour ce rapport. */
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params
  if (!/^[\w-]{12,80}$/.test(token)) return BASE_METADATA
  const image = reportImageUrl(token)
  return {
    ...BASE_METADATA,
    openGraph: { title: 'Rapport d’analyse · Qualio', type: 'website', images: [{ url: image, width: 1200, height: 600 }] },
    twitter: { card: 'summary_large_image', title: 'Rapport d’analyse · Qualio', images: [image] },
  }
}

const dateFr = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null

const PRIORITY_STYLE = {
  high: { label: 'Priorité haute', bg: '#fff1e9', ink: ACCENT_INK },
  medium: { label: 'Priorité moyenne', bg: SOFT, ink: INK },
  low: { label: 'À surveiller', bg: SOFT, ink: MUTED },
} as const

function Stars({ value, size = 'h-3.5 w-3.5' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} sur 5 étoiles`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} aria-hidden className={size} style={{ color: star <= value ? ACCENT : LINE }} />
      ))}
    </span>
  )
}

function ProspectProblemRow({ item, rank, totalReviews }: { item: ReportProblem; rank: number; totalReviews: number }) {
  const badge = PRIORITY_STYLE[item.priority]
  const share = totalReviews > 0 ? Math.max(1, Math.round((item.mentions / totalReviews) * 100)) : null
  return (
    <li className="grid gap-x-8 gap-y-4 border-t py-10 first:border-t-0 first:pt-0 md:grid-cols-[3.25rem_1fr]" style={{ borderColor: LINE }}>
      <span aria-hidden className="font-mono text-sm font-medium tabular-nums" style={{ color: MUTED }}>
        {String(rank).padStart(2, '0')}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: badge.bg, color: badge.ink }}
          >
            {badge.label}
          </span>
          <span className="font-mono text-xs tabular-nums" style={{ color: MUTED }}>
            {item.mentions} avis cités{share != null ? ` · ${share} % de l’échantillon` : ''}
          </span>
        </div>
        <h3 className="mt-2.5 text-xl font-semibold leading-snug tracking-[-0.015em] [text-wrap:balance] sm:text-2xl">
          {item.title}
        </h3>
        <p className="mt-3 max-w-[65ch] text-[15px] leading-7" style={{ color: '#3a3a40' }}>
          {item.rationale}
        </p>
        {item.quotes.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {item.quotes.map((quote, index) => (
              <figure key={index} className="rounded-xl border px-4 py-3.5" style={{ background: SOFT, borderColor: LINE }}>
                {quote.rating != null && (
                  <div className="mb-1.5 flex items-center justify-between">
                    <Stars value={quote.rating} />
                    <span className="font-mono text-[11px] tabular-nums" style={{ color: MUTED }}>{quote.rating}/5</span>
                  </div>
                )}
                <blockquote className="text-[14px] leading-6" style={{ color: '#27272a' }}>
                  « {quote.text} »
                </blockquote>
              </figure>
            ))}
          </div>
        )}
        <div className="mt-5 rounded-xl border px-4 py-3.5" style={{ borderColor: '#fed7aa', background: '#fffaf6' }}>
          <p className="max-w-[65ch] text-[14px] leading-6" style={{ color: INK }}>
            <span className="font-semibold" style={{ color: ACCENT_INK }}>Action produit recommandée : </span>
            {item.action}
          </p>
        </div>
      </div>
    </li>
  )
}

/**
 * Page publique /rapport/[token] :
 * 1. Rapport d'avis publics préparé pour un prospect (`acquisition_reports`) — verbatims anonymisés, histogramme et 3 priorités.
 * 2. Rapport client partageable du plan Agence (`feedback_reports`) — synthèse et recommandations sans exposer le texte brut des avis.
 */
export default async function SharedReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ apercu?: string }>
}) {
  const [{ token }, { apercu }] = await Promise.all([params, searchParams])
  if (!token || token.length < 12 || token.length > 80) notFound()
  const admin = getSupabaseAdminClient() as any

  // 1. Vérifier s'il s'agit d'un rapport d'acquisition (avis publics analysés pour un prospect)
  const { data: prospectRow } = await admin
    .from('acquisition_reports')
    .select('subject_name, source_label, source_url, created_at, report')
    .eq('token', token)
    .is('revoked_at', null)
    .maybeSingle()

  if (prospectRow?.report) {
    const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
    const isAdminPreview = apercu === '1' || cookieStore.get('qualio_ignore')?.value === '1'
    const isBot = isAutomatedUserAgent(headerStore.get('user-agent'))
    if (!isAdminPreview && !isBot) {
      await admin.rpc('track_acquisition_report_view', { report_token: token })
    }

    const report = prospectRow.report as ProspectReport
    const maxBucket = Math.max(1, ...report.ratingDistribution)
    const claimHref = `${SIGNUP}&utm_source=rapport&redirectTo=${encodeURIComponent(`/onboarding?report=${token}`)}`
    const period =
      report.periodStart && report.periodEnd && report.periodStart.slice(0, 10) !== report.periodEnd.slice(0, 10)
        ? `du ${dateFr(report.periodStart)} au ${dateFr(report.periodEnd)}`
        : null

    return (
      <div className="min-h-screen bg-white selection:bg-[#ee6018]/20" style={{ color: INK }}>
        <header className="border-b" style={{ borderColor: LINE }}>
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
            <Link href="/" className={`rounded text-base font-semibold tracking-tight ${FOCUS}`}>
              Qualio
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden font-mono text-xs tabular-nums sm:inline" style={{ color: MUTED }}>
                Rapport du {dateFr(prospectRow.created_at)}
              </span>
              <Link
                href={claimHref}
                className={`inline-flex min-h-9 items-center rounded-lg px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#9a3412] ${FOCUS}`}
                style={{ background: ACCENT_INK }}
              >
                Ouvrir dans Qualio
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6">
          <section className="pb-12 pt-14 sm:pt-20">
            <h1 className="max-w-3xl text-[clamp(1.875rem,4.5vw,3rem)] font-semibold leading-[1.1] tracking-[-0.03em] [text-wrap:balance]">
              Analyse de {report.reviewCount} avis {prospectRow.source_label} — {prospectRow.subject_name}
            </h1>
            <p className="mt-5 max-w-[65ch] text-base leading-7 sm:text-lg sm:leading-8" style={{ color: '#3a3a40' }}>
              {report.summary}
            </p>
            <dl
              className="mt-10 grid grid-cols-2 gap-6 border-t pt-6 sm:grid-cols-4"
              style={{ borderColor: LINE }}
            >
              <div>
                <dt className="text-xs font-medium" style={{ color: MUTED }}>Avis analysés</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">{report.reviewCount}</dd>
              </div>
              {report.averageRating != null && (
                <div>
                  <dt className="text-xs font-medium" style={{ color: MUTED }}>Note de l’échantillon</dt>
                  <dd className="mt-1 flex items-center gap-2 font-mono text-2xl font-semibold tabular-nums">
                    {report.averageRating.toLocaleString('fr-FR')}
                    <Stars value={Math.round(report.averageRating)} />
                  </dd>
                </div>
              )}
              {report.ratingDistribution.some(Boolean) && (
                <div>
                  <dt className="text-xs font-medium" style={{ color: MUTED }}>Avis critiques (1–2 ★)</dt>
                  <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums" style={{ color: report.negativeCount > 0 ? ACCENT_INK : INK }}>
                    {report.negativeCount}
                  </dd>
                </div>
              )}
              {period && (
                <div>
                  <dt className="text-xs font-medium" style={{ color: MUTED }}>Fenêtre couverte</dt>
                  <dd className="mt-1.5 font-mono text-xs leading-5 tabular-nums">{period}</dd>
                </div>
              )}
            </dl>
          </section>

          <section aria-labelledby="priorites" className="border-t py-14" style={{ borderColor: LINE }}>
            <h2 id="priorites" className="text-2xl font-semibold tracking-[-0.02em]">
              {report.problems.length > 1
                ? `Les ${report.problems.length} problèmes qui reviennent le plus`
                : 'Le problème principal détecté'}
            </h2>
            <p className="mt-2 max-w-[65ch] text-[15px] leading-7" style={{ color: MUTED }}>
              Chaque recommandation ci-dessous est calculée uniquement à partir des avis réels qui la mentionnent, extraits tels quels sans données personnelles.
            </p>
            <ol className="mt-10">
              {report.problems.map((item, index) => (
                <ProspectProblemRow key={index} item={item} rank={index + 1} totalReviews={report.reviewCount} />
              ))}
            </ol>
          </section>

          {(report.themes.length > 0 || report.ratingDistribution.some(Boolean)) && (
            <section aria-labelledby="repartition" className="grid gap-12 border-t py-14 md:grid-cols-[1.25fr_1fr]" style={{ borderColor: LINE }}>
              {report.themes.length > 0 && (
                <div>
                  <h2 id="repartition" className="text-lg font-semibold">Thèmes récurrents</h2>
                  <table className="mt-5 w-full text-sm">
                    <thead>
                      <tr className="text-left font-mono text-xs" style={{ color: MUTED }}>
                        <th className="pb-2.5 font-normal">Thème</th>
                        <th className="pb-2.5 text-right font-normal">Avis</th>
                        <th className="pb-2.5 text-right font-normal">Critiques</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.themes.map((theme) => (
                        <tr key={theme.name} className="border-t align-top" style={{ borderColor: LINE }}>
                          <td className="py-3 pr-4">
                            <span className="font-medium">{theme.name}</span>
                            {theme.insight && (
                              <span className="mt-0.5 block text-xs leading-5" style={{ color: MUTED }}>
                                {theme.insight}
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right font-mono tabular-nums">{theme.mentions}</td>
                          <td className="py-3 text-right font-mono tabular-nums">
                            {theme.negativeShare == null ? '–' : `${theme.negativeShare} %`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {report.ratingDistribution.some(Boolean) && (
                <div>
                  <h2 className="text-lg font-semibold">Distribution des notes</h2>
                  <ul className="mt-5 space-y-3">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = report.ratingDistribution[star - 1]
                      return (
                        <li key={star} className="grid grid-cols-[4.75rem_1fr_2.5rem] items-center gap-3 font-mono text-xs tabular-nums">
                          <Stars value={star} size="h-3 w-3" />
                          <span className="h-2 overflow-hidden rounded-full" style={{ background: SOFT }} aria-hidden>
                            <span
                              className="block h-full rounded-full"
                              style={{ width: `${(count / maxBucket) * 100}%`, background: star <= 2 ? ACCENT : '#c9c9cf' }}
                            />
                          </span>
                          <span className="text-right">{count}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </section>
          )}

          <section aria-labelledby="suite" className="my-6 rounded-2xl px-6 py-10 sm:px-10" style={{ background: INK, color: '#f4f4f5' }}>
            <h2 id="suite" className="max-w-xl text-2xl font-semibold leading-tight tracking-[-0.02em] [text-wrap:balance]">
              Ce rapport est déjà prêt. Ouvrez-le dans votre espace Qualio en un clic.
            </h2>
            <p className="mt-3 max-w-[62ch] text-[15px] leading-7" style={{ color: '#b4b4bb' }}>
              Vos avis, cette synthèse et ses {report.problems.length > 1 ? `${report.problems.length} actions prioritaires` : 'recommandations'} sont pré-chargés gratuitement dans votre projet. Vous pourrez ensuite ajouter un CSV, connecter le widget et suivre l’effet de vos décisions chaque semaine.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={claimHref}
                className={`inline-flex min-h-11 items-center rounded-lg px-5 text-sm font-semibold text-white transition-colors hover:bg-[#9a3412] ${FOCUS}`}
                style={{ background: ACCENT_INK }}
              >
                Ouvrir ce rapport dans mon espace Qualio (gratuit)
              </Link>
              <Link
                href="/exemple"
                className={`inline-flex min-h-11 items-center rounded-lg border border-white/20 px-5 text-sm font-semibold transition-colors hover:bg-white/10 ${FOCUS}`}
              >
                Voir l’espace produit en démo
              </Link>
            </div>
          </section>

          <footer className="pb-16 pt-8 text-xs leading-6" style={{ color: MUTED }}>
            <p className="max-w-[75ch]">
              Méthodologie : analyse réalisée par Qualio à partir des avis publics récents
              {prospectRow.source_url ? (
                <>
                  {' '}consultables sur{' '}
                  <a href={prospectRow.source_url} className={`underline underline-offset-4 ${FOCUS}`} rel="noopener noreferrer" target="_blank">
                    la page {prospectRow.source_label}
                  </a>
                </>
              ) : null}
              . Chaque compteur est recalculé côté serveur à partir des avis effectivement rattachés au thème ; aucun nom d’auteur n’est conservé.
            </p>
          </footer>
        </main>
      </div>
    )
  }

  // 2. Sinon, rapport partageable client (plan Agence) : synthèse et recommandations sans verbatims ni auteurs.
  const { data: agencyReport } = await admin
    .from('feedback_reports')
    .select('site_id, created_at')
    .eq('token', token)
    .is('revoked_at', null)
    .maybeSingle()
  if (!agencyReport) notFound()

  const [{ data: site }, { data: synthesis }, { count }] = await Promise.all([
    admin.from('sites').select('name, url').eq('id', agencyReport.site_id).maybeSingle(),
    admin
      .from('feedback_syntheses')
      .select('title, summary, themes, recommendations, created_at')
      .eq('site_id', agencyReport.site_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('feedback_items')
      .select('id', { count: 'exact', head: true })
      .eq('site_id', agencyReport.site_id)
      .not('status', 'in', '(archived,locked)'),
  ])

  const recommendations = ((synthesis?.recommendations ?? []) as Array<{ title?: string; rationale?: string; action?: string }>).slice(0, 3)
  const themes = ((synthesis?.themes ?? []) as Array<{ name?: string; count?: number }>).slice(0, 5)

  return (
    <div className="min-h-screen bg-white selection:bg-[#ee6018]/20" style={{ color: INK }}>
      <header className="border-b" style={{ borderColor: LINE }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className={`rounded text-base font-semibold tracking-tight ${FOCUS}`}>
            Qualio
          </Link>
          <span className="font-mono text-xs tabular-nums" style={{ color: MUTED }}>
            {count ?? 0} avis analysés{synthesis ? ` · synthèse du ${dateFr(synthesis.created_at)}` : ''}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-6 py-14">
        <section>
          <h1 className="text-3xl font-semibold tracking-[-0.025em] [text-wrap:balance] sm:text-4xl">
            {site?.name || site?.url || 'Projet'}
          </h1>
          {synthesis ? (
            <div className="mt-6">
              <h2 className="text-lg font-semibold">{synthesis.title}</h2>
              <p className="mt-2 max-w-[65ch] text-[15px] leading-7" style={{ color: '#3a3a40' }}>
                {synthesis.summary}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm" style={{ color: MUTED }}>
              Aucune synthèse n’a encore été publiée pour ce projet.
            </p>
          )}
        </section>

        {synthesis && themes.length > 0 && (
          <section className="border-t pt-8" style={{ borderColor: LINE }}>
            <h2 className="text-lg font-semibold">Thèmes principaux</h2>
            <ul className="mt-4 divide-y text-sm" style={{ borderColor: LINE }}>
              {themes.map((theme, index) => (
                <li key={index} className="flex items-center justify-between py-2.5" style={{ borderColor: LINE }}>
                  <span>{theme.name}</span>
                  {theme.count != null && (
                    <span className="font-mono text-xs tabular-nums" style={{ color: MUTED }}>
                      {theme.count} avis
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {synthesis && recommendations.length > 0 && (
          <section className="border-t pt-8" style={{ borderColor: LINE }}>
            <h2 className="text-lg font-semibold">Recommandations prioritaires</h2>
            <ol className="mt-5 space-y-5">
              {recommendations.map((item, index) => (
                <li key={index} className="rounded-xl border p-5" style={{ borderColor: LINE, background: SOFT }}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-xs tabular-nums" style={{ color: MUTED }}>
                      0{index + 1}
                    </span>
                    <strong className="text-base font-semibold">{item.title}</strong>
                  </div>
                  {item.rationale && (
                    <p className="mt-2 max-w-[65ch] text-sm leading-6" style={{ color: '#3a3a40' }}>
                      {item.rationale}
                    </p>
                  )}
                  {item.action && (
                    <p className="mt-2 text-sm leading-6">
                      <span className="font-semibold" style={{ color: ACCENT_INK }}>Action : </span>
                      {item.action}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        <footer className="border-t pt-6 text-xs leading-6" style={{ borderColor: LINE, color: MUTED }}>
          Rapport généré par Qualio. Les tendances observées ne prouvent pas un lien de cause à effet.
        </footer>
      </main>
    </div>
  )
}
