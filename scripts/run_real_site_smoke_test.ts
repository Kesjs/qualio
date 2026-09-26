import { config } from 'dotenv'
config({ path: '.env.local' })

import { BrowserEngine } from '../src/lib/qa/browser'
import { EvidenceEngine } from '../src/lib/qa/evidence'
import { DiffEngine } from '../src/lib/qa/diff'
import { AIEngine } from '../src/lib/qa/ai/engine'
import { QAConfigManager } from '../src/lib/qa/config'
import { CheckResult } from '../src/lib/qa/types'

async function runRealSiteSmokeTest() {
  console.log('==================================================')
  console.log('PHASE 6 & 7 & 8 — REAL EXTERNAL SITE & AI SMOKE TEST')
  console.log('==================================================\n')

  const qaConfig = new QAConfigManager()
  const browser = new BrowserEngine(qaConfig)
  const evidenceEngine = new EvidenceEngine()
  const diffEngine = new DiffEngine()

  console.log('[Phase 6.1] Initializing BrowserEngine...')
  await browser.initialize()

  const scanId = crypto.randomUUID()
  const allChecks: CheckResult[] = []

  try {
    // 1. Visit real external site (read-only): https://httpbin.org/status/404
    // This is a stable, public, non-destructive test endpoint returning an HTTP 404.
    const testUrl = 'https://httpbin.org/status/404'
    console.log(`[Phase 6.2] Browser navigating to real external site: ${testUrl}`)

    const navChecks = await browser.testNavigation(testUrl)
    navChecks.forEach(c => {
      allChecks.push({
        ...c,
        id: crypto.randomUUID(),
        scanId,
        pageId: null,
      })
    })

    console.log(`[Phase 6.3] Playwright checks gathered: ${allChecks.length}`)
    for (const c of allChecks) {
      console.log(`  - [${c.status.toUpperCase()}] ${c.category}/${c.key}: ${c.message}`)
    }

    // 2. Evidence Engine
    console.log('\n[Phase 6.4] Running Evidence Engine...')
    const incidents = evidenceEngine.groupChecksIntoIncidents(allChecks)
    console.log(`Evidence Engine grouped checks into ${incidents.length} incident(s).`)

    if (incidents.length === 0) {
      console.log('No incidents found to diagnose.')
      return
    }

    const incident = incidents[0]
    console.log(`Incident ID: ${incident.id}`)
    console.log(`Incident Category: ${incident.category}`)
    console.log(`Incident Title: ${incident.title}`)
    console.log(`Incident Severity: ${incident.severity}`)
    console.log(`Incident Checks Count: ${incident.checks.length}`)

    // 3. Diff Engine
    console.log('\n[Phase 6.5] Running Diff Engine...')
    const diff = diffEngine.diff([], incidents)
    console.log(`Diff result: ${diff.newIncidents.length} new, ${diff.persistent.length} persistent, ${diff.resolved.length} resolved`)

    // 4. Real AI Provider Smoke Test (Phase 7 & 8)
    console.log('\n[Phase 7] Real AI Provider Smoke Test (MAX 1 CALL)...')
    const providerName = process.env.QA_AI_PROVIDER || 'gemini'
    const apiKey = providerName === 'gemini' ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY

    if (!apiKey || apiKey.trim() === '') {
      console.log('\n==================================================')
      console.log('REAL AI TEST SKIPPED — missing provider credentials.')
      console.log(`Provider: ${providerName}`)
      console.log(`Missing Env Var: ${providerName === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY'}`)
      console.log('==================================================\n')
      return
    }

    const aiEngine = new AIEngine()
    const t0 = Date.now()
    const diagnostic = await aiEngine.diagnoseIncident(incident)
    const durationMs = Date.now() - t0

    console.log('\n==================================================')
    console.log('REAL AI SMOKE TEST RESULTS')
    console.log('==================================================')

    if (!diagnostic) {
      console.log('Result: FAILED / REJECTED by AI Engine validation')
      return
    }

    const meta = diagnostic._meta || {}
    const inputEvidenceIds = new Set(incident.checks.map(c => c.id))
    const returnedEvidenceIds = diagnostic.evidence?.map(e => e.id) || []
    const acceptedEvidenceIds = returnedEvidenceIds.filter(id => inputEvidenceIds.has(id))
    const validationSuccess = returnedEvidenceIds.every(id => inputEvidenceIds.has(id))

    const inTokens = meta.tokens_input ?? 'unknown'
    const outTokens = meta.tokens_output ?? 'unknown'
    const totalTokens = (typeof inTokens === 'number' && typeof outTokens === 'number')
      ? inTokens + outTokens
      : 'unknown'
    const costDisplay = typeof meta.cost_usd === 'number'
      ? `$${meta.cost_usd.toFixed(6)}`
      : 'unknown'

    console.log(`Provider: ${providerName}`)
    console.log(`Model: ${meta.model || process.env.GEMINI_QA_MODEL || 'default'}`)
    console.log(`Duration: ${durationMs}ms`)
    console.log(`Input tokens: ${inTokens}`)
    console.log(`Output tokens: ${outTokens}`)
    console.log(`Total tokens: ${totalTokens}`)
    console.log(`Cost: ${costDisplay}`)
    console.log(`Validation success: ${validationSuccess}`)
    console.log(`Evidence IDs provided: [${Array.from(inputEvidenceIds).join(', ')}]`)
    console.log(`Evidence IDs returned: [${returnedEvidenceIds.join(', ')}]`)
    console.log(`Evidence IDs accepted: [${acceptedEvidenceIds.join(', ')}]`)
    console.log(`Diagnostic title: ${diagnostic.title}`)
    console.log(`Diagnostic summary: ${diagnostic.summary}`)
    console.log(`Probable cause: ${diagnostic.probable_cause}`)
    console.log(`Recommendation: ${diagnostic.recommendation}`)
    console.log(`Severity: ${diagnostic.severity}`)
    console.log(`Confidence: ${diagnostic.confidence}`)
    console.log('==================================================\n')

    if (!validationSuccess) {
      console.error('[Phase 8 FAIL] Provider hallucinated evidence IDs not in input facts!')
      process.exit(1)
    } else {
      console.log('[Phase 8 PASS] Zero-Hallucination verified: all returned evidence IDs exist in input facts.')
    }

  } finally {
    await browser.cleanup()
  }
}

runRealSiteSmokeTest().catch(err => {
  console.error('Smoke test error:', err)
  process.exit(1)
})
