import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { CrawlerEngine } from '@/lib/qa/crawler'
import { QAConfigManager } from '@/lib/qa/config'

type Params = { params: Promise<{ siteId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { siteId } = await params
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: site, error } = await supabase.from('sites').select('url').eq('id', siteId).eq('user_id', user.id).maybeSingle()
  if (error || !site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  const crawler = new CrawlerEngine(new QAConfigManager())
  try {
    await crawler.initialize()
    const crawl = await crawler.crawl(site.url)
    const suggestions = crawl.pages.flatMap((page) => [
      ...page.forms.map((form) => ({ kind: 'form', pageUrl: page.url, target: form.submitButton ? 'button[type="submit"], input[type="submit"]' : 'form', label: form.submitButton || 'Formulaire détecté' })),
      ...page.links.filter((link) => /contact|demo|signup|register|pricing|checkout|book|reserve/i.test(link)).slice(0, 5).map((link) => ({ kind: 'link', pageUrl: page.url, target: `a[href="${link}"]`, label: link })),
    ]).slice(0, 30)
    return NextResponse.json({ suggestions })
  } finally {
    await crawler.cleanup()
  }
}
