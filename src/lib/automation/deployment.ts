import { createHash, randomBytes } from 'node:crypto'

export type DeploymentScanMode = 'manual' | 'automatic'

export function createDeploymentWebhookToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashDeploymentWebhookToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function deploymentWebhookUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, '')}/api/webhooks/deployment/${encodeURIComponent(token)}`
}

export function eventIdFromPayload(rawBody: string, request: Request): string {
  const headerId = request.headers.get('x-event-id') || request.headers.get('x-deployment-id')
  if (headerId) return headerId.slice(0, 200)
  return createHash('sha256').update(rawBody).digest('hex')
}

export function isSuccessfulDeployment(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  return ['success', 'succeeded', 'successful', 'ready', 'completed', 'complete', 'deployed'].includes(String(value).toLowerCase())
}

export function readDeploymentPayload(payload: unknown) {
  const body = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
  const nested = body.deployment && typeof body.deployment === 'object' ? body.deployment as Record<string, unknown> : {}
  const meta = body.payload && typeof body.payload === 'object' ? body.payload as Record<string, unknown> : {}
  const deployment = meta.deployment && typeof meta.deployment === 'object' ? meta.deployment as Record<string, unknown> : {}
  const pick = (...values: unknown[]) => values.find((value) => typeof value === 'string' && value.length > 0) as string | undefined

  return {
    status: pick(body.status, body.state, body.conclusion, nested.status, nested.state, meta.status, deployment.status),
    source: pick(body.source, body.provider, body.type) || 'webhook',
    environment: pick(body.environment, body.target, nested.environment, nested.target, meta.target, deployment.target),
    commitSha: pick(body.commit_sha, body.commitSha, body.sha, body.commit, nested.commit_sha, nested.commitSha, meta.commitSha, deployment.commitSha),
    deploymentUrl: pick(body.deployment_url, body.deploymentUrl, body.url, nested.url, meta.url, deployment.url),
  }
}
