/**
 * SCRIPT DE TEST POUR LES JOURNEY STEPS
 *
 * Usage :
 * import { testJourneyExecution } from '@/lib/qa/journeys/test-journey-execution'
 * await testJourneyExecution('https://example.com', 'scan_test_123')
 */

import { BrowserEngine } from '@/lib/qa/browser'
import { QAConfigManager } from '@/lib/qa/config'
import { persistJourneyResults, fetchJourneySteps } from '@/lib/qa/journeys/persistence'
import { JOURNEY_BROKEN_TEST, JOURNEY_LOGIN } from '@/lib/qa/journeys/definitions'
import type { JourneyDefinition } from '@/lib/qa/types'

async function runJourney(scanId: string, journey: JourneyDefinition) {
  const engine = new BrowserEngine(new QAConfigManager())
  await engine.initialize()
  try {
    return await engine.executeJourney(scanId, journey)
  } finally {
    await engine.cleanup()
  }
}

function bufferSizeFromPayload(payload: Record<string, unknown> | undefined): number | null {
  const raw = payload?.screenshotBuffer
  if (typeof raw !== 'string') return null
  return Buffer.from(raw, 'base64').length
}

/**
 * Test complet d'un journey avec logs détaillés
 */
export async function testJourneyExecution(
  targetUrl: string,
  scanId: string = `test_scan_${Date.now()}`,
  journeyToTest: JourneyDefinition = JOURNEY_BROKEN_TEST
): Promise<void> {
  const journey: JourneyDefinition = {
    ...journeyToTest,
    startUrl: journeyToTest.startUrl ?? targetUrl,
  }

  console.log('\n' + '='.repeat(80))
  console.log('🧪 JOURNEY EXECUTION TEST')
  console.log('='.repeat(80))
  console.log(`Target URL: ${targetUrl}`)
  console.log(`Scan ID: ${scanId}`)
  console.log(`Journey: ${journey.name}`)
  console.log(`Steps: ${journey.steps.length}`)
  console.log('='.repeat(80) + '\n')

  const startTime = Date.now()
  const result = await runJourney(scanId, journey)
  const executionTime = Date.now() - startTime

  console.log(`\n✓ Journey execution completed in ${executionTime}ms\n`)
  console.log('─'.repeat(80))
  console.log('📊 EXECUTION RESULTS')
  console.log('─'.repeat(80))
  console.log(`Journey Name: ${result.journeyName}`)
  console.log(`Total Steps: ${result.steps.length}`)
  console.log(`✓ Passed: ${result.stepsPassed}`)
  console.log(`✗ Failed: ${result.stepsFailed}`)
  console.log(`○ Not Reached: ${result.stepsNotReached}`)
  console.log(`Duration: ${result.durationMs}ms`)
  console.log('─'.repeat(80) + '\n')

  console.log('📋 STEP-BY-STEP BREAKDOWN')
  console.log('─'.repeat(80))
  result.steps.forEach((step, index) => {
    const statusIcon = {
      pass: '✓',
      fail: '✗',
      not_reached: '○',
      skip: '⊘',
    }[step.status]

    console.log(`\n${index + 1}. ${step.stepName}`)
    console.log(`   Status: ${statusIcon} ${step.status.toUpperCase()}`)
    console.log(`   Action: ${step.actionType} ${step.actionTarget || ''}`)

    if (step.durationMs !== undefined) {
      console.log(`   Duration: ${step.durationMs}ms`)
    }

    if (step.errorMessage) {
      console.log(`   Error: ${step.errorMessage}`)
    }

    if (step.screenshotId) {
      console.log(`   Screenshot: ${step.screenshotId} ✓`)
    }

    const bufferSize = bufferSizeFromPayload(step.resultPayload)
    if (bufferSize !== null) {
      console.log(`   Screenshot Buffer: ${(bufferSize / 1024).toFixed(2)} KB`)
    }
  })
  console.log('\n' + '─'.repeat(80) + '\n')

  console.log('💾 Persisting results to Supabase...')
  await persistJourneyResults(result)
  console.log('✓ Results persisted successfully\n')

  console.log('🔍 Verifying data in database...')
  const savedSteps = await fetchJourneySteps(scanId)
  const journeySteps = savedSteps.filter(s => s.journeyName === journeyToTest.name)

  if (journeySteps.length === result.steps.length) {
    console.log(`✓ All ${journeySteps.length} steps found in database`)
  } else {
    console.warn(`⚠ Mismatch: ${result.steps.length} steps executed but ${journeySteps.length} found in DB`)
  }

  const stepsWithScreenshots = journeySteps.filter(s => s.screenshotId)
  console.log(`✓ ${stepsWithScreenshots.length} steps have screenshots saved`)

  if (stepsWithScreenshots.length > 0) {
    console.log('\n📸 Screenshots captured:')
    stepsWithScreenshots.forEach(step => {
      console.log(`   - ${step.stepName}: ${step.screenshotId}`)
    })
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ TEST COMPLETED SUCCESSFULLY')
  console.log('='.repeat(80) + '\n')
}

export async function quickTestLogin(url: string): Promise<void> {
  return testJourneyExecution(url, `test_login_${Date.now()}`, JOURNEY_LOGIN)
}

export async function quickTestBroken(url: string): Promise<void> {
  return testJourneyExecution(url, `test_broken_${Date.now()}`, JOURNEY_BROKEN_TEST)
}

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

    const startTime = Date.now()
    const result = await runJourney(scanId, { ...journey, startUrl: journey.startUrl ?? url })
    const duration = Date.now() - startTime
    times.push(duration)

    console.log(`  Duration: ${duration}ms (${result.stepsPassed} pass, ${result.stepsFailed} fail)`)
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

export function createTestJourney(
  name: string,
  targetUrl: string,
  selectorToClick: string
): JourneyDefinition {
  return {
    name,
    startUrl: targetUrl,
    steps: [
      {
        name: 'Navigate to page',
        action: {
          type: 'navigate',
          target: targetUrl,
        },
      },
      {
        name: `Click on ${selectorToClick}`,
        action: {
          type: 'click',
          target: selectorToClick,
        },
      },
      {
        name: 'Wait for result',
        action: {
          type: 'wait',
          target: 'body',
          details: { timeout: 2000 },
        },
      },
    ],
  }
}

export const tests = {
  full: testJourneyExecution,
  login: quickTestLogin,
  broken: quickTestBroken,
  benchmark: benchmarkJourneyExecution,
  custom: createTestJourney,
}
