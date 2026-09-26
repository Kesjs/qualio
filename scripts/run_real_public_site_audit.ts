import { BrowserEngine } from '../src/lib/qa/browser'
import { CrawlerEngine } from '../src/lib/qa/crawler'
import { DiscoveryEngine } from '../src/lib/qa/discovery'
import { EvidenceEngine } from '../src/lib/qa/evidence'
import { QAConfigManager } from '../src/lib/qa/config'

async function runRealPublicSiteAudit() {
  console.log('======================================================================')
  console.log('QUALIO READ-ONLY REAL PUBLIC SITE SMOKE TEST')
  console.log('Site cible : https://example.com (Domaine de référence public RFC 2606)')
  console.log('Mode : STRICTEMENT READ-ONLY (aucun login, aucun achat, aucune donnée sensible)')
  console.log('======================================================================\n')

  const targetUrl = 'https://example.com'
  const config = new QAConfigManager({ maxPages: 2, maxCrawlDepth: 1 })
  const discovery = new DiscoveryEngine()
  const crawler = new CrawlerEngine(config)
  const browser = new BrowserEngine(config)
  const evidenceEngine = new EvidenceEngine()

  try {
    // 1. DISCOVERY
    console.log('1. DISCOVERY ENGINE : Analyse de découverte...')
    const discoveryResult = await discovery.discover(targetUrl)
    console.log(`   - Robots.txt : ${discoveryResult.robots ? 'Présent' : 'Non fourni/404 (normal pour example.com)'}`)
    console.log(`   - Sitemap    : ${discoveryResult.sitemap || 'Aucun'}`)
    console.log(`   - Liens internes découverts : ${discoveryResult.internalLinks.length}`)

    // 2. INITIALISATION BROWSER & CRAWLER
    console.log('\n2. MOTEUR BROWSER & CRAWLER : Initialisation Chromium headless...')
    await browser.initialize()
    await crawler.initialize()

    // 3. NAVIGATION & HTTP & CONSOLE
    console.log('\n3. NAVIGATION & CONSOLE CHECKS : Navigation sur la cible...')
    const navChecks = await browser.testNavigation(targetUrl)
    for (const c of navChecks) {
      console.log(`   - [${c.status.toUpperCase()}] ${c.title} (${c.key}): ${c.message} [${c.duration}ms]`)
    }

    // 4. CTA CHECK
    console.log('\n4. CTA DETECTION CHECK : Détection des éléments d\'action...')
    const ctaChecks = await browser.testCTA(targetUrl)
    for (const c of ctaChecks) {
      console.log(`   - [${c.status.toUpperCase()}] ${c.title}: ${c.message}`)
    }

    // 5. RESPONSIVE / OVERFLOW CHECK
    console.log('\n5. RESPONSIVE CHECKS : Vérification des viewports...')
    const respChecks = await browser.testResponsive(targetUrl)
    for (const c of respChecks) {
      console.log(`   - [${c.status.toUpperCase()}] ${c.title}: ${c.message}`)
    }

    // 6. SCREENSHOT EVIDENCE
    console.log('\n6. EVIDENCE ENGINE : Capture de preuve visuelle...')
    const screenshotBuf = await browser.takeScreenshot(targetUrl, { name: 'desktop', width: 1440, height: 900 })
    console.log(`   - Preuve screenshot capturée : ${screenshotBuf.length} octets`)

    // 7. CORRELATION EVIDENCE -> INCIDENTS
    const allChecks = [...navChecks, ...ctaChecks, ...respChecks].map(c => ({
      ...c,
      id: crypto.randomUUID(),
      scanId: 'real-site-scan',
      pageId: 'page-example-com'
    }))

    const incidents = evidenceEngine.groupChecksIntoIncidents(allChecks)
    console.log(`\n7. SYNTHÈSE DES INCIDENTS CORRÉLÉS : ${incidents.length} incident(s) détecté(s)`)

    const passedCount = allChecks.filter(c => c.status === 'passed').length
    const warningCount = allChecks.filter(c => c.status === 'warning').length
    const failedCount = allChecks.filter(c => c.status === 'failed').length

    console.log('\n======================================================================')
    console.log('BILAN DU TEST SUR SITE RÉEL :')
    console.log(`Total checks exécutés : ${allChecks.length}`)
    console.log(`- Passed  : ${passedCount}`)
    console.log(`- Warning : ${warningCount}`)
    console.log(`- Failed  : ${failedCount}`)
    console.log('======================================================================\n')

  } finally {
    await browser.cleanup()
    await crawler.cleanup()
  }
}

runRealPublicSiteAudit().catch(err => {
  console.error('Real site audit error:', err)
  process.exit(1)
})
