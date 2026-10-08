import { describe, expect, it } from 'vitest'
import { scanPollInterval, scanListPollInterval } from './scan-polling'

describe('scan polling lifecycle', () => {
  it.each(['queued', 'running', 'discovering', 'crawling', 'browser_testing', 'analyzing', undefined])('keeps polling %s, including when the first response is missing', status => {
    expect(scanPollInterval(status)).toBe(2000)
  })

  it.each(['completed', 'failed', 'partial', 'blocked'])('stops polling terminal status %s', status => {
    expect(scanPollInterval(status)).toBe(false)
  })

  it('polls a mixed list until every scan has finished', () => {
    expect(scanListPollInterval([{ status: 'completed' }, { status: 'running' }])).toBe(2000)
    expect(scanListPollInterval([{ status: 'completed' }, { status: 'partial' }])).toBe(false)
    expect(scanListPollInterval([])).toBe(false)
  })
})
