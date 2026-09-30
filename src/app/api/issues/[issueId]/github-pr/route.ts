import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { createProposedPullRequest } from '@/lib/github/app'
import { buildFixPrompt } from '@/lib/qa/fix-prompt/buildFixPrompt'
import { isFixContext } from '@/lib/qa/fix-context/types'
import { redactSensitiveData } from '@/lib/qa/security/redact-sensitive-data'

export async function POST(_request: Request, { params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: issue } = await supabase.from('issues').select('*').eq('id', issueId).maybeSingle()
  if (!issue) return NextResponse.json({ error: 'Incident introuvable' }, { status: 404 })
  const { data: scan } = await supabase.from('scans').select('site_id, user_id').eq('id', issue.scan_id).eq('user_id', user.id).maybeSingle()
  if (!scan) return NextResponse.json({ error: 'Incident introuvable' }, { status: 404 })
  const { data: site } = await supabase.from('sites').select('id, url, environment, stack_type, github_installation_id, github_owner, github_repo, github_default_branch').eq('id', scan.site_id).eq('user_id', user.id).maybeSingle() as unknown as { data: { id: string; url: string; environment: string; stack_type: string; github_installation_id: number | null; github_owner: string | null; github_repo: string | null; github_default_branch: string | null } | null }
  if (!site?.github_installation_id || !site.github_owner || !site.github_repo) return NextResponse.json({ error: 'Associez d’abord un dépôt GitHub à ce site.' }, { status: 400 })

  const context = isFixContext(issue.fix_context) ? issue.fix_context : {
    expected: 'Le comportement attendu doit fonctionner sans erreur.', actual: issue.description || 'Incident détecté par Qualio.',
    repro_steps: ['Ouvrir la page concernée', 'Reproduire l’incident'], locate_hints: ['Rechercher le composant lié au parcours testé'],
    acceptance_check: 'Le scan suivant ne reproduit plus l’incident.', page_url: null, viewport: null, selector: null, visible_text: null, uncertainties: [],
  }
  const prompt = buildFixPrompt({ issue: { id: issue.id, title: issue.title, severity: issue.severity, category: issue.category }, context: redactSensitiveData(context) as typeof context, evidence: [], site: { url: site.url, environment: site.environment, stack_type: site.stack_type as never, repository_provider: 'github' } })
  const branch = `qualio/proposal-${issue.id.slice(0, 8)}`
  const title = `Qualio proposal: ${issue.title}`
  const content = `# Proposition Qualio\n\nCette branche contient une proposition générée à partir de l’incident **${issue.title}**.\n\nQualio n’applique pas automatiquement de modification au code source. Utilisez le prompt ci-dessous pour réaliser et vérifier le correctif dans votre environnement.\n\n## Prompt de correction\n\n${prompt}\n`
  const body = `## Proposition Qualio\n\nCette pull request brouillon contient le contexte et le prompt de correction de l’incident détecté par Qualio.\n\n- Incident : ${issue.id}\n- Sévérité : ${issue.severity}\n- Catégorie : ${issue.category}\n- Scan : ${issue.scan_id}\n\nLe code applicatif n’est pas modifié automatiquement. Vérifiez la proposition, appliquez le correctif, puis relancez un scan Qualio.`
  try {
    const pr = await createProposedPullRequest({ installationId: Number(site.github_installation_id), owner: site.github_owner, repo: site.github_repo, base: site.github_default_branch || 'main', branch, filePath: `.qualio/proposals/${issue.id}.md`, content, title, body })
    await supabase.from('github_pull_requests' as never).insert({ user_id: user.id, issue_id: issue.id, site_id: site.id, owner: site.github_owner, repo: site.github_repo, number: pr.number, url: pr.html_url, branch, status: 'draft' } as never)
    return NextResponse.json({ url: pr.html_url, number: pr.number, status: 'draft' }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Impossible de créer la proposition GitHub' }, { status: 502 })
  }
}
