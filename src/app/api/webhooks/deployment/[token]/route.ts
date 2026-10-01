import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/server'
import { eventIdFromPayload, hashDeploymentWebhookToken, isSuccessfulDeployment, readDeploymentPayload } from '@/lib/automation/deployment'

type Params = { params: Promise<{ token: string }> }

export async function POST(request: Request, { params }: Params) {
  const { token } = await params
  if (!token || token.length < 32) return NextResponse.json({ error: 'Invalid webhook' }, { status: 401 })
  const rawBody = await request.text()
  let body: unknown = {}
  try {
    body = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }
  const deployment = readDeploymentPayload(body)
  const admin = getSupabaseAdminClient()
  const tokenHash = hashDeploymentWebhookToken(token)
  const { data: site, error: siteError } = await admin.from('sites').select('id, user_id, url, environment, deployment_scan_mode').eq('deployment_webhook_token_hash', tokenHash).maybeSingle()
  if (siteError) return NextResponse.json({ error: siteError.message }, { status: 500 })
  if (!site) return NextResponse.json({ error: 'Invalid webhook' }, { status: 401 })

  const externalEventId = eventIdFromPayload(rawBody, request)
  const { data: existing } = await admin.from('deployment_events').select('id, scan_id').eq('site_id', site.id).eq('external_event_id', externalEventId).maybeSingle()
  if (existing) return NextResponse.json({ received: true, duplicate: true, scanId: existing.scan_id })

  const successful = isSuccessfulDeployment(deployment.status)
  if (!successful) {
    await admin.from('deployment_events').insert({
      site_id: site.id, user_id: site.user_id, external_event_id: externalEventId, source: deployment.source,
      status: deployment.status || 'failed', environment: deployment.environment || site.environment,
      commit_sha: deployment.commitSha, deployment_url: deployment.deploymentUrl, payload: body,
    } as never)
    return NextResponse.json({ received: true, queued: false, reason: 'Deployment was not successful' })
  }

  const { data: previousScan } = await admin.from('scans').select('id, scan_modules, consent_confirmed_at').eq('site_id', site.id).eq('status', 'completed').order('completed_at', { ascending: false }).limit(1).maybeSingle()
  let scanId: string | null = null
  if (site.deployment_scan_mode === 'automatic') {
    const { data: scan, error: scanError } = await admin.from('scans').insert({
      site_id: site.id, user_id: site.user_id, status: 'queued', previous_scan_id: previousScan?.id ?? null,
      scan_modules: previousScan?.scan_modules ?? null, consent_confirmed_at: previousScan?.consent_confirmed_at ?? new Date().toISOString(), queued_at: new Date().toISOString(),
    } as never).select('id').single()
    if (scanError) return NextResponse.json({ error: scanError.message }, { status: 500 })
    scanId = scan.id
  }

  const { error: eventError } = await admin.from('deployment_events').insert({
    site_id: site.id, user_id: site.user_id, external_event_id: externalEventId, source: deployment.source,
    status: deployment.status || 'succeeded', environment: deployment.environment || site.environment,
    commit_sha: deployment.commitSha, deployment_url: deployment.deploymentUrl, scan_id: scanId, payload: body,
  } as never)
  if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 })

  await admin.from('sites').update({
    last_deployment_event_at: new Date().toISOString(), last_deployment_commit_sha: deployment.commitSha ?? null, last_deployment_url: deployment.deploymentUrl ?? null,
  } as never).eq('id', site.id)

  return NextResponse.json({ received: true, queued: Boolean(scanId), scanId, mode: site.deployment_scan_mode })
}
