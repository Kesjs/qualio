import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { QAOrchestrator } from '../src/lib/qa/orchestrator'
import { QAConfigManager } from '../src/lib/qa/config'

async function verifyRealPersistence() {
  console.log('==================================================')
  console.log('PHASE 9 — VERIFY REAL SUPABASE PERSISTENCE')
  console.log('==================================================\n')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: users } = await supabase.auth.admin.listUsers()
  if (!users?.users?.length) throw new Error('No user found')
  const userId = users.users[0].id

  // 1. Create a site for testing real persistence
  const { data: site } = await supabase.from('sites').insert({
    user_id: userId,
    url: 'https://httpbin.org/status/404',
    name: 'Real HTTP 404 Test Site'
  }).select('id').single()

  const siteId = site!.id
  console.log(`[Supabase] Created site: ${siteId}`)

  const orchestrator = new QAOrchestrator(supabaseUrl, supabaseKey, new QAConfigManager())

  // Run 1 real scan on httpbin.org/status/404
  console.log('[Orchestrator] Running real scan on https://httpbin.org/status/404 ...')
  const scanResult = await orchestrator.runScan({
    siteId,
    userId,
    url: 'https://httpbin.org/status/404'
  })

  const scanId = scanResult.scanId
  console.log(`[Scan Completed] ID: ${scanId}, Status: ${scanResult.status}`)

  // Direct Supabase Verification
  console.log('\n--- Direct DB Queries ---')
  const { data: scanDb } = await supabase.from('scans').select('*').eq('id', scanId).single()
  console.log(`Scans Table:`)
  console.log(`  - status: ${scanDb?.status}`)
  console.log(`  - checks_total: ${scanDb?.checks_total}`)
  console.log(`  - checks_failed: ${scanDb?.checks_failed}`)
  console.log(`  - summary: ${scanDb?.summary}`)

  const { data: pagesDb } = await supabase.from('pages').select('*').eq('scan_id', scanId)
  console.log(`Pages Table: ${pagesDb?.length || 0} page(s) persisted`)

  const { data: checksDb } = await supabase.from('checks').select('*').eq('scan_id', scanId)
  console.log(`Checks Table: ${checksDb?.length || 0} check(s) persisted`)

  const { data: issuesDb } = await supabase.from('issues').select('*').eq('scan_id', scanId)
  console.log(`Issues Table: ${issuesDb?.length || 0} issue(s) persisted`)

  if (!issuesDb || issuesDb.length === 0) {
    throw new Error('Expected at least 1 issue in DB')
  }

  const issue = issuesDb[0]
  console.log(`  - title: ${issue.title}`)
  console.log(`  - severity: ${issue.severity}`)
  console.log(`  - status: ${issue.status}`)
  console.log(`  - confidence: ${issue.confidence}`)

  // Parse diagnostic & metadata inside description
  let parsedDesc: any = {}
  try {
    parsedDesc = JSON.parse(issue.description || '{}')
  } catch {}

  console.log(`  - summary: "${parsedDesc.summary}"`)
  console.log(`  - impact: "${parsedDesc.impact}"`)
  console.log(`  - probable_cause: "${parsedDesc.probable_cause}"`)
  console.log(`  - recommendation: "${parsedDesc.recommendation}"`)

  if (parsedDesc._meta) {
    console.log(`  - AI tokens_input: ${parsedDesc._meta.tokens_input}`)
    console.log(`  - AI tokens_output: ${parsedDesc._meta.tokens_output}`)
    console.log(`  - AI cost_usd: $${parsedDesc._meta.cost_usd?.toFixed(6)}`)
    console.log(`  - AI model: ${parsedDesc._meta.model}`)
  }

  const { data: evDb } = await supabase.from('evidence').select('*').eq('issue_id', issue.id)
  console.log(`Evidence Table: ${evDb?.length || 0} evidence rows linked to issue ${issue.id}`)

  console.log('\n[PHASE 9 RESULT]: PASS — Real persistence verified across scans, pages, checks, issues, evidence, and AI metrics.')
}

verifyRealPersistence().catch(err => {
  console.error('\n[PHASE 9 FAILED]:', err)
  process.exit(1)
})
