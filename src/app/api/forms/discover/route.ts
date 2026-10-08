import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { CrawlerEngine } from '@/lib/qa/crawler'
import { QAConfigManager } from '@/lib/qa/config'
import { assertPublicScanUrl } from '@/lib/qa/ssrf'
import { deduplicateForms } from '@/lib/qa/discovery/form-signature'
import type { DiscoveredForm } from '@/lib/qa/types'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (typeof body?.siteId !== 'string') return NextResponse.json({ error: 'Site requis.' }, { status: 400 })
  const { data: site } = await supabase.from('sites').select('url').eq('id', body.siteId).eq('user_id', user.id).single()
  if (!site) return NextResponse.json({ error: 'Site introuvable.' }, { status: 404 })
  try { await assertPublicScanUrl(site.url) } catch {
    return NextResponse.json({ error: 'Cette URL ne peut pas être explorée.' }, { status: 400 })
  }
  const crawler = new CrawlerEngine(new QAConfigManager({ maxPages: 12, maxCrawlDepth: 2 }))
  try {
    await crawler.initialize()
    const crawl = await crawler.crawl(site.url, undefined, 40000)
    if (!crawl.pages.some(page => page.status >= 200 && page.status < 400)) throw new Error('Le site est inaccessible. Vérifiez son URL et son accès public.')
    const forms = deduplicateForms(crawl.pages.flatMap(page => page.forms as DiscoveredForm[]))
    return NextResponse.json({ forms, pagesExplored: crawl.pages.length, pageLimit: 12, limited: crawl.pages.length >= 12 || crawl.duration >= 40000 }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[forms/discover]', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Découverte indisponible.' }, { status: 502 })
  } finally { await crawler.cleanup() }
}
