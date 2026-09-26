import { config } from 'dotenv'
config({ path: '.env.local' })

process.env.QA_AI_PROVIDER = 'mock'
process.env.MOCK_QA_SCENARIO = 'valid'

import { createClient } from '@supabase/supabase-js'
import { QAOrchestrator } from '../src/lib/qa/orchestrator'
import { QAConfigManager } from '../src/lib/qa/config'

async function runMockE2E() {
  console.log('========================================')
  console.log('PHASE 5 — MOCK E2E LIFECYCLE (NEW -> PERSISTENT -> RESOLVED)')
  console.log('========================================')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // 1. Get user
  const { data: users } = await supabase.auth.admin.listUsers()
  if (!users?.users?.length) {
    throw new Error('No user found in Supabase auth')
  }
  const userId = users.users[0].id

  // 2. Create test site
  const { data: site, error: siteErr } = await supabase
    .from('sites')
    .insert({
      user_id: userId,
      url: 'http://localhost:3000',
      name: 'Mock E2E Lifecycle Site'
    })
    .select('id')
    .single()

  if (siteErr || !site) {
    throw new Error(`Failed to create site: ${siteErr?.message}`)
  }
  const siteId = site.id
  console.log(`[Setup] Site created: ${siteId} for user ${userId}`)

  const orchestrator = new QAOrchestrator(supabaseUrl, supabaseKey, new QAConfigManager())

  // --- SCAN 1: HTTP 500 -> NEW ---
  console.log('\n--- SCAN 1: Triggering HTTP 500 (Expecting NEW) ---')
  const scan1Result = await orchestrator.runScan({
    siteId,
    userId,
    url: 'http://localhost:3000/api/mock-test-site/500'
  })
  const scan1Id = scan1Result.scanId
  console.log(`Scan 1 completed with ID: ${scan1Id}, status: ${scan1Result.status}`)

  // Verify in DB
  const { data: scan1Db } = await supabase.from('scans').select('*').eq('id', scan1Id).single()
  console.log(`[DB Scan 1] status: ${scan1Db.status}, summary: "${scan1Db.summary}"`)
  console.log(`[DB Scan 1] AI calls: ${scan1Db.ai_calls_count}, tokens in: ${scan1Db.ai_tokens_input}, out: ${scan1Db.ai_tokens_output}`)

  const { data: scan1Issues } = await supabase.from('issues').select('*').eq('scan_id', scan1Id)
  if (!scan1Issues || scan1Issues.length === 0) {
    throw new Error('Scan 1 expected at least 1 issue')
  }
  const issue1 = scan1Issues[0]
  console.log(`[DB Scan 1 Issue] title: "${issue1.title}", status: "${issue1.status}" (Expected: new)`)
  if (issue1.status !== 'new') {
    throw new Error(`Expected issue status 'new', got '${issue1.status}'`)
  }

  // Verify evidence in DB
  const { data: ev1 } = await supabase.from('evidence').select('*').eq('scan_id', scan1Id)
  console.log(`[DB Scan 1 Evidence] ${ev1?.length || 0} evidence rows linked`)

  // --- SCAN 2: Same HTTP 500 -> PERSISTENT ---
  console.log('\n--- SCAN 2: Rescan with HTTP 500 (Expecting PERSISTENT) ---')
  const scan2Result = await orchestrator.runScan({
    siteId,
    userId,
    url: 'http://localhost:3000/api/mock-test-site/500',
    previousScanId: scan1Id
  })
  const scan2Id = scan2Result.scanId
  console.log(`Scan 2 completed with ID: ${scan2Id}, status: ${scan2Result.status}`)

  const { data: scan2Issues } = await supabase.from('issues').select('*').eq('scan_id', scan2Id)
  if (!scan2Issues || scan2Issues.length === 0) {
    throw new Error('Scan 2 expected at least 1 issue')
  }
  const issue2 = scan2Issues[0]
  console.log(`[DB Scan 2 Issue] title: "${issue2.title}", status: "${issue2.status}" (Expected: persistent)`)
  if (issue2.status !== 'persistent') {
    throw new Error(`Expected issue status 'persistent', got '${issue2.status}'`)
  }

  // --- SCAN 3: Healthy Site -> RESOLVED ---
  console.log('\n--- SCAN 3: Rescan with Healthy Site (Expecting RESOLVED for Scan 2 issue) ---')
  const scan3Result = await orchestrator.runScan({
    siteId,
    userId,
    url: 'http://localhost:3000/api/mock-test-site/sain',
    previousScanId: scan2Id
  })
  const scan3Id = scan3Result.scanId
  console.log(`Scan 3 completed with ID: ${scan3Id}, status: ${scan3Result.status}`)

  // Check scan 3 issues (should be 0 active issues)
  const { data: scan3Issues } = await supabase.from('issues').select('*').eq('scan_id', scan3Id)
  console.log(`[DB Scan 3 Issues] active count: ${scan3Issues?.length || 0} (Expected: 0)`)

  // Check if issue2 was marked resolved in DB!
  const { data: resolvedIssue2 } = await supabase.from('issues').select('id, status, title').eq('id', issue2.id).single()
  console.log(`[DB Scan 2 Issue After Fix] ID: ${resolvedIssue2?.id}, status: "${resolvedIssue2?.status}" (Expected: resolved)`)
  if (resolvedIssue2?.status !== 'resolved') {
    throw new Error(`Expected previous issue to be marked 'resolved', but got '${resolvedIssue2?.status}'`)
  }

  console.log('\n========================================')
  console.log('PHASE 5 LIFECYCLE RESULT: [PASS]')
  console.log('1. Scan 1 -> Issue status = new [VERIFIED IN DB]')
  console.log('2. Scan 2 -> Issue status = persistent [VERIFIED IN DB]')
  console.log('3. Scan 3 -> Previous issue status = resolved [VERIFIED IN DB]')
  console.log('========================================')
}

runMockE2E().catch(err => {
  console.error('\n[PHASE 5 FAILED]:', err)
  process.exit(1)
})
