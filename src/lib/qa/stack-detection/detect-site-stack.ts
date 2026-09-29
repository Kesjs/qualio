import type { PageResult } from '../types'
import type { RepositoryProvider, SiteStackType } from '../fix-context/types'

export interface StackDetectionResult {
  stackType: SiteStackType
  confidence: 'high' | 'medium' | 'low'
  signals: string[]
}

const providerPatterns: Array<[RepositoryProvider, RegExp]> = [
  ['github', /github\.com(?:\/|$)/i],
  ['gitlab', /gitlab\.com(?:\/|$)/i],
  ['bitbucket', /bitbucket\.org(?:\/|$)/i],
]

export function detectRepositoryProvider(urls: string[] = []): RepositoryProvider {
  for (const url of urls) {
    const match = providerPatterns.find(([, pattern]) => pattern.test(url))
    if (match) return match[0]
  }
  return 'none'
}

export function detectSiteStack(page: Pick<PageResult, 'htmlSnippet' | 'scriptUrls' | 'url' | 'finalUrl'>): StackDetectionResult {
  const html = `${page.htmlSnippet ?? ''} ${(page.scriptUrls ?? []).join(' ')} ${page.url} ${page.finalUrl}`.toLowerCase()
  const signals: string[] = []

  if (html.includes('cdn.shopify.com') || html.includes('shopify.theme') || html.includes('shopify.shop')) {
    signals.push('Shopify public runtime markers')
    return { stackType: 'shopify', confidence: 'high', signals }
  }
  if (html.includes('data-wf-page') || html.includes('webflow.js') || html.includes('webflow')) {
    signals.push('Webflow public runtime markers')
    return { stackType: 'webflow', confidence: 'high', signals }
  }
  if (html.includes('/wp-content/') || html.includes('/wp-includes/') || html.includes('wp-json')) {
    signals.push('WordPress public asset markers')
    return { stackType: 'wordpress', confidence: 'high', signals }
  }
  if (html.includes('/_next/') || html.includes('__next_data__') || html.includes('x-powered-by: next.js')) {
    signals.push('Next.js public runtime markers')
    return { stackType: 'nextjs', confidence: 'high', signals }
  }
  if (html.includes('/assets/index-') || html.includes('vite') || html.includes('id="root"')) {
    signals.push('React/Vite public asset markers')
    return { stackType: 'react_vite', confidence: 'medium', signals }
  }

  return { stackType: 'unknown', confidence: 'low', signals: [] }
}
