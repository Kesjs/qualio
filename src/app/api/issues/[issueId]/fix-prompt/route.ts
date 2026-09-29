import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { buildFixPrompt } from '@/lib/qa/fix-prompt/buildFixPrompt'
import { isFixContext, type FixContext, type RepositoryProvider, type SiteStackType } from '@/lib/qa/fix-context/types'
import { redactSensitiveData } from '@/lib/qa/security/redact-sensitive-data'

type Params = { params: Promise<{ issueId: string }> }

function fallbackContext(issue: { description: string | null }, pageUrl: string | null): FixContext {
  let actual = issue.description ?? 'Un incident a été observé pendant le scan.'
  try {
    const parsed = JSON.parse(issue.description ?? '{}') as { summary?: unknown }
    if (typeof parsed.summary === 'string') actual = parsed.summary
  } catch {
    // Existing plain-text incidents remain supported.
  }
  return {
    expected: 'Le contrôle doit produire le comportement attendu sans erreur.',
    actual,
    repro_steps: pageUrl ? [`Ouvrir ${pageUrl}`, 'Reproduire le contrôle signalé par Qualio'] : ['Reproduire le contrôle signalé par Qualio'],
    locate_hints: ['Rechercher la route, le texte visible et le sélecteur dans le dépôt', 'Identifier le composant ou le gestionnaire responsable'],
    acceptance_check: 'Le contrôle réussit après déploiement sans erreur console ou réseau.',
    page_url: pageUrl,
    viewport: null,
    selector: null,
    visible_text: null,
    uncertainties: ['Cet incident est antérieur au contexte de correction structuré.'],
  }
}

export async function GET(_request: Request, { params }: Params) {
  const { issueId } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: issue, error: issueError } = await supabase
    .from('issues')
    .select('*')
    .eq('id', issueId)
    .maybeSingle()
  if (issueError) return NextResponse.json({ error: issueError.message }, { status: 500 })
  if (!issue) return NextResponse.json({ error: 'Incident not found' }, { status: 404 })

  const { data: scan } = await supabase
    .from('scans')
    .select('id, site_id, user_id')
    .eq('id', issue.scan_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!scan) return NextResponse.json({ error: 'Incident not found' }, { status: 404 })

  const [{ data: site }, { data: evidence }, { data: page }] = await Promise.all([
    supabase.from('sites').select('url, environment, stack_type, repository_provider').eq('id', scan.site_id).eq('user_id', user.id).maybeSingle(),
    supabase.from('evidence').select('id, type, payload').eq('issue_id', issue.id).order('created_at'),
    issue.page_id ? supabase.from('pages').select('url').eq('id', issue.page_id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  if (!site) return NextResponse.json({ error: 'Incident not found' }, { status: 404 })

  const context = isFixContext(issue.fix_context) ? issue.fix_context : fallbackContext(issue, page?.url ?? null)
  const cleanContext = redactSensitiveData(context) as FixContext
  const cleanEvidence = (redactSensitiveData(evidence ?? []) as Array<{ id: string; type: string; payload: unknown }>).slice(0, 20)
  const prompt = buildFixPrompt({
    issue: {
      id: issue.id,
      title: issue.title,
      severity: issue.severity,
      category: issue.category,
      created_at: issue.created_at,
    },
    context: cleanContext,
    evidence: cleanEvidence,
    site: {
      url: site.url,
      environment: site.environment,
      stack_type: site.stack_type as SiteStackType,
      repository_provider: site.repository_provider as RepositoryProvider,
    },
  })

  return NextResponse.json({
    prompt,
    generated_at: new Date().toISOString(),
    evidence_count: cleanEvidence.length,
    stack_type: site.stack_type,
  })
}
