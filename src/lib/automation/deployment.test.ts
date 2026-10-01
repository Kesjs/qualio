import { describe, expect, it } from 'vitest'
import {
  createDeploymentWebhookToken,
  deploymentWebhookUrl,
  hashDeploymentWebhookToken,
  isSuccessfulDeployment,
  readDeploymentPayload,
} from './deployment'

describe('deployment automation helpers', () => {
  it('creates a one-time webhook URL without storing the raw token', () => {
    const token = createDeploymentWebhookToken()
    expect(token.length).toBeGreaterThanOrEqual(32)
    expect(hashDeploymentWebhookToken(token)).not.toBe(token)
    expect(deploymentWebhookUrl('https://app.qualio.test/', token)).toContain(`/api/webhooks/deployment/${encodeURIComponent(token)}`)
  })

  it('normalizes common deployment payload shapes', () => {
    expect(readDeploymentPayload({
      type: 'deployment.succeeded',
      payload: { target: 'production', deployment: { url: 'https://example.test', commitSha: 'abc123' } },
    })).toEqual({
      status: undefined,
      source: 'deployment.succeeded',
      environment: 'production',
      commitSha: 'abc123',
      deploymentUrl: 'https://example.test',
    })
  })

  it('only treats known successful states as successful', () => {
    expect(isSuccessfulDeployment(undefined)).toBe(true)
    expect(isSuccessfulDeployment('succeeded')).toBe(true)
    expect(isSuccessfulDeployment('error')).toBe(false)
  })
})
