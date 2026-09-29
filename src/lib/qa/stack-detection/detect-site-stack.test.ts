import { describe, expect, it } from 'vitest'
import { detectRepositoryProvider, detectSiteStack } from './detect-site-stack'

describe('site technology detection', () => {
  it('detects Next.js from public runtime markers', () => {
    expect(detectSiteStack({
      url: 'https://example.com',
      finalUrl: 'https://example.com',
      htmlSnippet: '<script id="__NEXT_DATA__"></script><script src="/_next/static/chunks/app.js">',
      scriptUrls: [],
    }).stackType).toBe('nextjs')
  })

  it('detects repository provider from public links', () => {
    expect(detectRepositoryProvider(['https://github.com/acme/site'])).toBe('github')
    expect(detectRepositoryProvider([])).toBe('none')
  })

  it('stays unknown when there is no reliable signal', () => {
    expect(detectSiteStack({ url: 'https://example.com', finalUrl: 'https://example.com', htmlSnippet: '', scriptUrls: [] }).stackType).toBe('unknown')
  })
})
