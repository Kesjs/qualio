import type { DiscoveryResult, FormInfo } from '../types'
import { assertPublicScanUrl, fetchPublicResource } from '../ssrf'

export class DiscoveryEngine {
  async initialize(): Promise<void> {}
  async cleanup(): Promise<void> {}

  async discover(url: string): Promise<DiscoveryResult> {
    const result: DiscoveryResult = {
      url,
      homepage: url,
      sitemap: null,
      robots: null,
      internalLinks: [url],
      navigation: [],
      forms: [],
      ctaCandidates: [],
      images: [],
      scripts: [],
    }

    try {
      const base = new URL(url)
      await assertPublicScanUrl(url)

      // Check robots.txt
      try {
        const robotsRes = await fetchPublicResource(`${base.origin}/robots.txt`, { signal: AbortSignal.timeout(5000) })
        if (robotsRes.ok) {
          const robotsText = await robotsRes.text()
          result.robots = robotsText
          // Extract sitemap from robots.txt
          const sitemapMatch = robotsText.match(/Sitemap:\s*(.+)/i)
          if (sitemapMatch) {
            const sitemapUrl = new URL(sitemapMatch[1].trim(), base.origin).toString()
            await assertPublicScanUrl(sitemapUrl)
            if (new URL(sitemapUrl).origin === base.origin) result.sitemap = sitemapUrl
          }
        }
      } catch {}

      // Try sitemap.xml
      if (!result.sitemap) {
        try {
          const sitemapRes = await fetchPublicResource(`${base.origin}/sitemap.xml`, { signal: AbortSignal.timeout(5000) })
          if (sitemapRes.ok) {
            result.sitemap = `${base.origin}/sitemap.xml`
            const sitemapText = await sitemapRes.text()
            // Extract URLs from sitemap
            const urlMatches = sitemapText.matchAll(/<loc>(.*?)<\/loc>/g)
            for (const match of urlMatches) {
              const sitemapUrl = match[1].trim()
              try {
                const parsedSitemapUrl = new URL(sitemapUrl)
                if (parsedSitemapUrl.origin === base.origin) {
                  await assertPublicScanUrl(parsedSitemapUrl.toString())
                  result.internalLinks.push(parsedSitemapUrl.toString())
                }
              } catch {
                // Ignore invalid or unsafe sitemap entries.
              }
            }
          }
        } catch {}
      }

      // Deduplicate
      result.internalLinks = [...new Set(result.internalLinks)].slice(0, 50)
    } catch (err) {
      console.error('Discovery error:', err)
    }

    return result
  }
}
