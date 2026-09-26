import { config } from 'dotenv'
config({ path: '.env.local' })

import { QAOrchestrator } from '../src/lib/qa/orchestrator'
import { QAConfigManager } from '../src/lib/qa/config'

async function runTests() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const { data: users } = await supabase.auth.admin.listUsers()
  if (!users?.users?.length) {
    console.error("No users found in DB")
    return
  }
  const realUserId = users.users[0].id
  
  const { data: site, error: errS } = await supabase.from('sites').insert({
    user_id: realUserId,
    url: 'http://localhost:3000',
    name: 'Test Site'
  }).select('id').single()
  
  const siteId = site.id
  
  const qaConfig = new QAConfigManager()
  const orchestrator = new QAOrchestrator(supabaseUrl, supabaseKey, qaConfig)

  const scenarios = [
    { url: 'http://localhost:3000/api/mock-test-site/sain', name: 'Test 1 - Sain' },
    { url: 'http://localhost:3000/api/mock-test-site/500', name: 'Test 2 - 500' },
    { url: 'http://localhost:3000/api/mock-test-site/formulaire-casse', name: 'Test 3 - Formulaire casse' },
    { url: 'http://localhost:3000/api/mock-test-site/malveillant', name: 'Test 5 - Malveillant' }
  ]

  for (const s of scenarios) {
    console.log(`\n\n=== RUNNING ${s.name} ===`)
    try {
      const res = await orchestrator.runScan({
        siteId,
        userId: realUserId,
        url: s.url
      })
      
      console.log(`Summary: ${res.summary}`)
      console.log(`AI Cost: $${res.aiCostUsd} (${res.aiCallsCount} calls)`)
      console.log(`Issues Found: ${res.issues.length}`)
      for (const i of res.issues) {
        console.log(`  [${i.severity}] ${i.title}`)
        console.log(`    Status: ${i.status}`)
        let cause = 'N/A'
        try { cause = JSON.parse(i.description).probable_cause } catch (e) { cause = i.description }
        console.log(`    Cause: ${cause}`)
        console.log(`    Tokens: ${i.aiTokensInput || 0} in, ${i.aiTokensOutput || 0} out`)
      }
    } catch (err) {
      console.error(`Failed: ${err}`)
    }
  }
  
  console.log("\nDone!")
  process.exit(0)
}

runTests().catch(console.error)
