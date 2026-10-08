import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, getSupabaseAdminClient } from '@/lib/supabase/server'
import { validateUrl } from '@/lib/qa/utils'
import { assertPublicScanUrl } from '@/lib/qa/ssrf'
import { AVAILABLE_SCAN_MODULES, DEFAULT_SCAN_MODULES, type ScanModule } from '@/lib/qa/types'
import { validateFormSelection } from '@/lib/qa/discovery/validate-selection'
import type { FormSelection } from '@/lib/qa/types'

// POST /api/scan/start
// Creates a scan record and returns the real scanId immediately.
// The actual scan is triggered by GitHub Actions cron via /api/scan/run.
export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  const { siteId, url, consentConfirmedAt, previousScanId, selectedModules, selectedForms } = body

  if (!siteId || !url) return NextResponse.json({ error: 'siteId and url are required' }, { status: 400 })

  const validation = validateUrl(url)
  if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 })
  try {
    await assertPublicScanUrl(url)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'This URL is not allowed' }, { status: 400 })
  }

  const modules = Array.isArray(selectedModules)
    ? selectedModules.filter((module): module is ScanModule => AVAILABLE_SCAN_MODULES.includes(module))
    : DEFAULT_SCAN_MODULES
  if (modules.length === 0) return NextResponse.json({ error: 'Select at least one scan module' }, { status: 400 })

  // Verify site belongs to user
  const { data: site } = await supabase.from('sites').select('id, url').eq('id', siteId).eq('user_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  if (new URL(url).origin !== new URL(site.url).origin) return NextResponse.json({ error: 'URL does not belong to the site' }, { status: 400 })
  let selection: FormSelection[] | undefined
  try {
    if (selectedForms !== undefined) {
      selection = validateFormSelection(selectedForms, site.url)
      for (const form of selection) await assertPublicScanUrl(form.pageUrl)
    }
    if (modules.includes('forms') && !selection) throw new Error('Découvrez les formulaires et sélectionnez ceux à tester avant de lancer l’audit.')
    if (typeof consentConfirmedAt !== 'string' || !Number.isFinite(Date.parse(consentConfirmedAt))) throw new Error('Consentement de soumission requis.')
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid selection' }, { status: 400 })
  }

  const admin = getSupabaseAdminClient()
  const { data: activeScan, error: activeScanError } = await admin
    .from('scans')
    .select('id, status')
    .eq('site_id', siteId)
    .eq('user_id', user.id)
    .in('status', ['queued', 'running', 'discovering', 'crawling', 'browser_testing', 'analyzing', 'reporting'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeScanError) return NextResponse.json({ error: activeScanError.message }, { status: 500 })
  if (activeScan) {
    return NextResponse.json(
      { error: 'Un scan est déjà en cours pour ce site.', scanId: activeScan.id, status: activeScan.status },
      { status: 409 },
    )
  }

  let validatedPreviousScanId: string | null = null
  if (previousScanId) {
    const { data: previousScan } = await supabase
      .from('scans')
      .select('id')
      .eq('id', previousScanId)
      .eq('site_id', siteId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!previousScan) {
      return NextResponse.json({ error: 'Previous scan not found' }, { status: 400 })
    }
    validatedPreviousScanId = previousScan.id
  }

  // Create scan record with service_role (bypasses RLS for insert)
  const { data: scan, error } = await admin
    .from('scans')
    .insert({
      site_id: siteId,
      user_id: user.id,
      status: 'queued',
      previous_scan_id: validatedPreviousScanId,
      scan_modules: modules,
      ...(selection ? { selected_forms: selection, max_attempts: 1 } : {}),
      queued_at: new Date().toISOString(),
      consent_confirmed_at: consentConfirmedAt ? new Date(consentConfirmedAt).toISOString() : null,
    })
    .select('id')
    .single()

  if (error || !scan) {
    if (error?.code === '23505') {
      const { data: concurrentScan } = await admin
        .from('scans')
        .select('id, status')
        .eq('site_id', siteId)
        .eq('user_id', user.id)
        .in('status', ['queued', 'running', 'discovering', 'crawling', 'browser_testing', 'analyzing', 'reporting'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return NextResponse.json(
        { error: 'Un scan est déjà en cours pour ce site.', scanId: concurrentScan?.id, status: concurrentScan?.status },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error?.message ?? 'Failed to create scan' }, { status: 500 })
  }

  // Return the real scanId — no fake UUID
  return NextResponse.json({ scanId: scan.id, siteId, status: 'queued' }, { status: 201 })
}
