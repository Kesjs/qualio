import chromium from '@sparticuz/chromium'
import { chromium as playwrightChromium, type Browser, type BrowserContext } from 'playwright-core'
import type { QAConfigManager } from '../config'
import type { CheckResult, CheckCategory, CheckStatus, IssueSeverity, PageResult, FormInfo } from '../types'
import { assertPublicScanUrl, installPublicNetworkGuard } from '../ssrf'

export class CrawlerEngine {
  private config: QAConfigManager
  private browser: Browser | null = null
  private context: BrowserContext | null = null

  constructor(config: QAConfigManager) {
    this.config = config
  }

  async initialize(): Promise<void> {
    const executablePath = process.env.VERCEL
      ? await chromium.executablePath()
      : process.env.PLAYWRIGHT_EXECUTABLE_PATH

    if (!executablePath) {
      throw new Error('PLAYWRIGHT_EXECUTABLE_PATH is required outside Vercel.')
    }

    this.browser = await playwrightChromium.launch({
      headless: true,
      args: process.env.VERCEL
        ? [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath,
    })
    this.context = await this.browser.newContext({
      userAgent: 'Qualio-QA/1.0 (https://qualio.dev)',
      ignoreHTTPSErrors: false,
    })
    await installPublicNetworkGuard(this.context)
  }

  async cleanup(): Promise<void> {
    await this.context?.close()
    await this.browser?.close()
    this.context = null
    this.browser = null
  }

  async crawl(startUrl: string): Promise<{ pages: PageResult[]; total: number; duration: number }> {
    await assertPublicScanUrl(startUrl)
    const startTime = Date.now()
    const maxPages = this.config.getMaxPages()
    const maxDepth = this.config.getMaxCrawlDepth()
    const visited = new Set<string>()
    const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }]
    const pages: PageResult[] = []

    const base = new URL(startUrl).origin

    while (queue.length > 0 && pages.length < maxPages) {
      const item = queue.shift()!
      const normalized = this.normalizeUrl(item.url)
      if (visited.has(normalized)) continue
      visited.add(normalized)

      try {
        const page = await this.context!.newPage()
        const t0 = Date.now()
        let statusCode: number | null = null

        page.on('response', res => {
          if (res.url() === item.url || res.url() === normalized) statusCode = res.status()
        })

        let navigationError: string | null = null
        try {
          await assertPublicScanUrl(item.url)
          const response = await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 20000 })
          statusCode = response?.status() ?? null
          await assertPublicScanUrl(page.url())
        } catch (e: any) {
          navigationError = e instanceof Error ? e.message : String(e)
          statusCode = 0
        }

        const responseTime = Date.now() - t0
        const finalUrl = page.url()
        if (navigationError || statusCode === 0) {
          pages.push({
            url: item.url,
            status: 0,
            finalUrl,
            responseTime,
            title: '',
            depth: item.depth,
            links: [],
            images: [],
            forms: [],
            htmlSnippet: '',
            scriptUrls: [],
            repositoryLinks: [],
          })
          await page.close()
          continue
        }
        const title = await page.title().catch(() => '')
        const htmlSnippet = await page.content().then((html) => html.slice(0, 200_000)).catch(() => '')
        const scriptUrls = await page.$$eval('script[src]', scripts =>
          scripts.map(script => (script as HTMLScriptElement).src).filter(Boolean).slice(0, 100)
        ).catch(() => [] as string[])
        const repositoryLinks = await page.$$eval('a[href]', anchors =>
          anchors.map(anchor => (anchor as HTMLAnchorElement).href)
            .filter(href => /github\.com|gitlab\.com|bitbucket\.org/i.test(href)).slice(0, 20)
        ).catch(() => [] as string[])

        // Extract links (same origin only)
        const links = await page.$$eval('a[href]', (anchors, baseOrigin) =>
          anchors
            .map(a => (a as HTMLAnchorElement).href)
            .filter(href => {
              try { return new URL(href).origin === baseOrigin } catch { return false }
            })
            .slice(0, 50),
          base
        ).catch(() => [] as string[])

        // Extract images
        const images = await page.$$eval('img[src]', imgs =>
          imgs.map(i => (i as HTMLImageElement).src).filter(s => s.startsWith('http')).slice(0, 20)
        ).catch(() => [] as string[])

        // Extract forms (in-browser scope — safe)
        const forms = await page.$$eval('form', (formEls) =>
          formEls.map(form => {
            const f = form as HTMLFormElement
            const fields = Array.from(f.querySelectorAll('input, select, textarea')).map(input => {
              const el = input as HTMLInputElement
              return {
                name: el.name || el.id || '',
                type: el.type || 'text',
                required: el.required,
                label: null as string | null,
              }
            })
            return {
              action: f.action || '',
              method: f.method || 'get',
              fields,
              submitButton: f.querySelector('[type=submit]')?.textContent?.trim() || null,
            }
          })
        ).catch(() => [] as FormInfo[])

        const pageResult: PageResult = {
          url: item.url,
          status: statusCode ?? 0,
          finalUrl,
          responseTime,
          title,
          depth: item.depth,
          links,
          images,
          forms,
          htmlSnippet,
          scriptUrls,
          repositoryLinks,
        }
        pages.push(pageResult)

        // Enqueue unvisited links
        if (item.depth < maxDepth) {
          for (const link of links) {
            const norm = this.normalizeUrl(link)
            if (!visited.has(norm)) {
              queue.push({ url: link, depth: item.depth + 1 })
            }
          }
        }

        await page.close()
      } catch (err) {
        console.error(`Crawler error for ${item.url}:`, err)
      }
    }

    return { pages, total: pages.length, duration: Date.now() - startTime }
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid']
      trackingParams.forEach(p => parsed.searchParams.delete(p))
      parsed.hash = ''
      if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
        parsed.pathname = parsed.pathname.slice(0, -1)
      }
      return parsed.toString()
    } catch { return url }
  }
}
