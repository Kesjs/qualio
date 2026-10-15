import { notFound } from 'next/navigation'
import { getSupabaseAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

/** Rapport partageable (plan Agence) : synthèse et recommandations, sans le texte des avis ni les auteurs. */
export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = getSupabaseAdminClient() as any
  const { data: report } = await admin.from('feedback_reports').select('site_id, created_at').eq('token', token).is('revoked_at', null).maybeSingle()
  if (!report) notFound()
  const [{ data: site }, { data: synthesis }, { count }] = await Promise.all([
    admin.from('sites').select('name, url').eq('id', report.site_id).maybeSingle(),
    admin.from('feedback_syntheses').select('title, summary, themes, recommendations, created_at').eq('site_id', report.site_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('feedback_items').select('id', { count: 'exact', head: true }).eq('site_id', report.site_id).not('status', 'in', '(archived,locked)'),
  ])
  const recommendations = ((synthesis?.recommendations ?? []) as Array<{ title?: string; rationale?: string }>).slice(0, 3)
  const themes = ((synthesis?.themes ?? []) as Array<{ name?: string; count?: number }>).slice(0, 5)
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6 text-gray-900">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ee6018]">Rapport Qualio</p>
        <h1 className="mt-2 text-2xl font-bold">{site?.name || site?.url || 'Projet'}</h1>
        <p className="mt-1 text-sm text-gray-600">{count ?? 0} avis analysés{synthesis ? ` · synthèse du ${new Date(synthesis.created_at).toLocaleDateString('fr-FR')}` : ''}</p>
      </header>
      {synthesis ? (
        <>
          <section><h2 className="text-lg font-semibold">{synthesis.title}</h2><p className="mt-2 text-sm leading-6 text-gray-700">{synthesis.summary}</p></section>
          {themes.length > 0 && <section><h2 className="text-lg font-semibold">Thèmes principaux</h2><ul className="mt-2 space-y-1 text-sm text-gray-700">{themes.map((theme, index) => <li key={index}>{theme.name}{theme.count != null ? ` · ${theme.count} avis` : ''}</li>)}</ul></section>}
          {recommendations.length > 0 && <section><h2 className="text-lg font-semibold">Recommandations</h2><ol className="mt-2 space-y-3 text-sm text-gray-700">{recommendations.map((item, index) => <li key={index}><strong>{item.title}</strong>{item.rationale ? <span className="block text-gray-600">{item.rationale}</span> : null}</li>)}</ol></section>}
        </>
      ) : <p className="text-sm text-gray-600">Aucune synthèse n’a encore été publiée pour ce projet.</p>}
      <footer className="border-t pt-4 text-xs text-gray-500">Rapport généré par Qualio. Les tendances observées ne prouvent pas un lien de cause à effet.</footer>
    </main>
  )
}
