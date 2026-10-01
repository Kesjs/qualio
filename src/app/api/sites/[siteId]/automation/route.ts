import { NextResponse } from 'next/server'
import { getSupabaseAdminClient, getSupabaseServerClient } from '@/lib/supabase/server'
import { createDeploymentWebhookToken, deploymentWebhookUrl, hashDeploymentWebhookToken, type DeploymentScanMode } from '@/lib/automation/deployment'

type Params = { params: Promise<{ siteId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { siteId } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: site, error } = await supabase
    .from('sites')
    .select('deployment_scan_mode, deployment_webhook_token_hash')
    .eq('id', siteId)
    .eq('user_id', user.id)
    .maybeSingle() as unknown as { data: { deployment_scan_mode: DeploymentScanMode; deployment_webhook_token_hash: string | null } | null; error: { message: string } | null }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  return NextResponse.json({ mode: site.deployment_scan_mode, hasWebhook: Boolean(site.deployment_webhook_token_hash) })
}

export async function POST(request: Request, { params }: Params) {
  const { siteId } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { mode?: DeploymentScanMode; rotateToken?: boolean }
  const mode: DeploymentScanMode = body.mode === 'automatic' ? 'automatic' : 'manual'
  const admin = getSupabaseAdminClient()
  const { data: site } = await supabase.from('sites').select('id, deployment_webhook_token_hash').eq('id', siteId).eq('user_id', user.id).maybeSingle() as unknown as { data: { id: string; deployment_webhook_token_hash: string | null } | null }
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  const shouldCreateToken = body.rotateToken === true || !site.deployment_webhook_token_hash
  const token = shouldCreateToken ? createDeploymentWebhookToken() : null
  const { error } = await admin.from('sites').update({
    deployment_scan_mode: mode,
    ...(token ? { deployment_webhook_token_hash: hashDeploymentWebhookToken(token), deployment_webhook_created_at: new Date().toISOString() } : {}),
  } as never).eq('id', siteId).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    mode,
    hasWebhook: true,
    webhookUrl: token ? deploymentWebhookUrl(new URL(request.url).origin, token) : undefined,
    tokenShownOnce: Boolean(token),
  })
}
