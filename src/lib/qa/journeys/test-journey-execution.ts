/**
 * SCRIPT DE TEST POUR LES JOURNEY STEPS
 * 
 * Ce script permet de tester l'exécution des journeys de manière isolée.
 * Utile pour débugger et valider que tout fonctionne correctement.
 * 
 * Usage (depuis la console Node.js ou un endpoint API) :
 * 
 * import { testJourneyExecution } from '@/lib/qa/journeys/test-journey-execution'
 * await testJourneyExecution('https://example.com', 'scan_test_123')
 */

import { chromium } from 'playwright'
import { executeJourney } from '@/lib/qa/browser/BrowserEngine'
import { persistJourneyResults, fetchJourneySteps } from '@/lib/qa/journeys/persistence'
import { JOURNEY_BROKEN_TEST, JOURNEY_LOGIN } from '@/lib/qa/journeys/definitions'
import type { JourneyDefinition } from '@/lib/qa/types'

/**
 * Test complet d'un journey avec logs détaillés
 */
export async function testJourneyExecution(
  targetUrl: string,
  scanId: string = `test_scan_${Date.now()}`,
  journeyToTest: JourneyDefinition = JOURNEY_BROKEN_TEST
): Promise<void> {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 JOURNEY EXECUTION TEST')
  console.log('='.repeat(80))
  console.log(`Target URL: ${targetUrl}`)
  console.log(`Scan ID: ${scanId}`)
  console.log(`Journey: ${journeyToTest.name}`)
  console.log(`Steps: ${journeyToTest.steps.length}`)
  console.log('='.repeat(80) + '\n')

  const browser = await chromium.launch({ 
    headless: false,  // Visible pour debug
    slowMo: 500       // Ralentir pour voir ce qui se passe
  })

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  })

  const page = await context.newPage()

  try {
    // Ajouter des listeners pour debug
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[Browser Console Error] ${msg.text()}`)
      }
    })

    page.on('pageerror', error => {
      console.log(`[Browser Page Error] ${error.message}`)
    })

    // Naviguer vers la page
    console.log(`\n📍 Navigating to: ${targetUrl}`)
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
    console.log(`✓ Page loaded successfully\n`)

    // Exécuter le journey
    console.log(`🚀 Executing journey: ${journeyToTest.name}\n`)
    const startTime = Date.now()
    
    const result = await executeJourney(scanId, journeyToTest, page)
    
    const executionTime = Date.now() - startTime
    console.log(`\n✓ Journey execution completed in ${executionTime}ms\n`)

    // Afficher les résultats détaillés
    console.log('─'.repeat(80))
    console.log('📊 EXECUTION RESULTS')
    console.log('─'.repeat(80))
    console.log(`Journey Name: ${result.journeyName}`)
    console.log(`Total Steps: ${result.steps.length}`)
    console.log(`✓ Passed: ${result.passCount}`)
    console.log(`✗ Failed: ${result.failCount}`)
    console.log(`○ Not Reached: ${result.notReachedCount}`)
    console.log(`⊘ Skipped: ${result.skipCount}`)
    console.log(`Duration: ${result.totalDuration}ms`)
    console.log('─'.repeat(80) + '\n')

    // Détail de chaque étape
    console.log('📋 STEP-BY-STEP BREAKDOWN')
    console.log('─'.repeat(80))
    result.steps.forEach((step, index) => {
      const statusIcon = {
        pass: '✓',
        fail: '✗',
        not_reached: '○',
        skip: '⊘'
      }[step.status]

      console.log(`\n${index + 1}. ${step.step_name}`)
      console.log(`   Status: ${statusIcon} ${step.status.toUpperCase()}`)
      console.log(`   Action: ${step.action_type} ${step.action_target || ''}`)
      
      if (step.duration_ms !== undefined) {
        console.log(`   Duration: ${step.duration_ms}ms`)
      }

      if (step.error_message) {
        console.log(`   Error: ${step.error_message}`)
      }

      if (step.screenshot_id) {
        console.log(`   Screenshot: ${step.screenshot_id} ✓`)
      }

      if (step.result_payload?.screenshotBuffer) {
        const bufferSize = Buffer.from(step.result_payload.screenshotBuffer, 'base64').length
        console.log(`   Screenshot Buffer: ${(bufferSize / 1024).toFixed(2)} KB`)
      }
    })
    console.log('\n' + '─'.repeat(80) + '\n')

    // Persister dans Supabase
    console.log('💾 Persisting results to Supabase...')
    await persistJourneyResults(scanId, result)
    console.log('✓ Results persisted successfully\n')

    // Vérifier que les données ont bien été enregistrées
    console.log('🔍 Verifying data in database...')
    const savedSteps = await fetchJourneySteps(scanId)
    const journeySteps = savedSteps.filter(s => s.journey_name === journeyToTest.name)
    
    if (journeySteps.length === result.steps.length) {
      console.log(`✓ All ${journeySteps.length} steps found in database`)
    } else {
      console.warn(`⚠ Mismatch: ${result.steps.length} steps executed but ${journeySteps.length} found in DB`)
    }

    // Vérifier les screenshots
    const stepsWithScreenshots = journeySteps.filter(s => s.screenshot_id)
    console.log(`✓ ${stepsWithScreenshots.length} steps have screenshots saved`)

    if (stepsWithScreenshots.length > 0) {
      console.log('\n📸 Screenshots captured:')
      stepsWithScreenshots.forEach(step => {
        console.log(`   - ${step.step_name}: ${step.screenshot_id}`)
      })
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ TEST COMPLETED SUCCESSFULLY')
    console.log('='.repeat(80) + '\n')

    console.log('Next steps:')
    console.log(`1. Open Evidence Drawer with scan_id: ${scanId}`)
    console.log(`2. Select "User Journeys" tab`)
    console.log(`3. Click on failed steps to see screenshot and error details`)
    console.log('')

  } catch (error) {
    console.error('\n' + '='.repeat(80))
    console.error('❌ TEST FAILED')
    console.error('='.repeat(80))
    console.error(error)
    throw error
  } finally {
    console.log('\n🧹 Cleaning up...')
    await page.waitForTimeout(2000)  // Pause pour voir le résultat final
    await context.close()
    await browser.close()
    console.log('✓ Browser closed\n')
  }
}

/**
 * Test rapide du journey LOGIN (devrait passer sur la plupart des sites)
 */
export async function quickTestLogin(url: string): Promise<void> {
  return testJourneyExecution(url, `test_login_${Date.now()}`, JOURNEY_LOGIN)
}

/**
 * Test rapide du journey BROKEN (devrait échouer et capturer un screenshot)
 */
export async function quickTestBroken(url: string): Promise<void> {
  return testJourneyExecution(url, `test_broken_${Date.now()}`, JOURNEY_BROKEN_TEST)
}

/**
 * Test de performance : mesurer le temps d'exécution
 */
export async function benchmarkJourneyExecution(
  url: string,
  journey: JourneyDefinition,
  iterations: number = 3
): Promise<number[]> {
  console.log(`\n⏱️  BENCHMARK: ${journey.name} (${iterations} iterations)\n`)
  
  const times: number[] = []

  for (let i = 0; i < iterations; i++) {
    const scanId = `benchmark_${Date.now()}_${i}`
    console.log(`Iteration ${i + 1}/${iterations}...`)

    const browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
    const page = await context.newPage()

    try {
      await page.goto(url, { waitUntil: 'networkidle' })
      
      const startTime = Date.now()
      const result = await executeJourney(scanId, journey, page)
      const endTime = Date.now()

      const duration = endTime - startTime
      times.push(duration)

      console.log(`  Duration: ${duration}ms (${result.passCount} pass, ${result.failCount} fail)`)

      // Ne pas persister pour ne pas polluer la DB
    } finally {
      await context.close()
      await browser.close()
    }

    // Pause entre les itérations
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length
  const min = Math.min(...times)
  const max = Math.max(...times)

  console.log(`\n📊 Results:`)
  console.log(`  Average: ${avg.toFixed(2)}ms`)
  console.log(`  Min: ${min}ms`)
  console.log(`  Max: ${max}ms`)
  console.log(`  Std Dev: ${Math.sqrt(times.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / times.length).toFixed(2)}ms\n`)

  return times
}

/**
 * Helper : Créer un journey custom pour des tests spécifiques
 */
export function createTestJourney(
  name: string,
  targetUrl: string,
  selectorToClick: string
): JourneyDefinition {
  return {
    name,
    steps: [
      {
        name: 'Navigate to page',
        action: {
          type: 'navigate',
          target: targetUrl
        }
      },
      {
        name: `Click on ${selectorToClick}`,
        action: {
          type: 'click',
          target: selectorToClick
        }
      },
      {
        name: 'Wait for result',
        action: {
          type: 'wait',
          target: 'body',
          details: { timeout: 2000 }
        }
      }
    ]
  }
}

// Export des tests par défaut
export const tests = {
  full: testJourneyExecution,
  login: quickTestLogin,
  broken: quickTestBroken,
  benchmark: benchmarkJourneyExecution,
  custom: createTestJourney
}
