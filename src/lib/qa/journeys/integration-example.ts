/**
 * EXEMPLE D'INTÉGRATION DES JOURNEY STEPS DANS LE SCAN ORCHESTRATOR
 *
 * Fichier de démonstration — non appelé par QAOrchestrator.
 * Montre comment exécuter des journeys et persister les résultats.
 */

import { chromium, type Page } from 'playwright-core'
import { BrowserEngine } from '@/lib/qa/browser'
import { QAConfigManager } from '@/lib/qa/config'
import { persistJourneyResults } from '@/lib/qa/journeys/persistence'
import { ALL_JOURNEYS, JOURNEY_BROKEN_TEST, getJourneyByName } from '@/lib/qa/journeys/definitions'
import type { JourneyDefinition, JourneyResult } from '@/lib/qa/types'

async function runJourney(scanId: string, journey: JourneyDefinition): Promise<JourneyResult> {
  const browserEngine = new BrowserEngine(new QAConfigManager())
  await browserEngine.initialize()
  try {
    return await browserEngine.executeJourney(scanId, journey)
  } finally {
    await browserEngine.cleanup()
  }
}

function withStartUrl(journey: JourneyDefinition, baseUrl: string): JourneyDefinition {
  return { ...journey, startUrl: journey.startUrl ?? baseUrl }
}

/**
 * EXEMPLE 1 : Exécuter un seul journey pendant le scan
 */
export async function exampleSingleJourney(scanId: string, baseUrl: string) {
  const journey = getJourneyByName('User Login Flow')
  if (!journey) {
    throw new Error('Journey not found')
  }

  console.log(`[Journey] Starting: ${journey.name}`)
  const result = await runJourney(scanId, withStartUrl(journey, baseUrl))
  await persistJourneyResults(result)

  console.log(`[Journey] Completed: ${journey.name}`)
  console.log(`  ✓ Passed: ${result.stepsPassed}`)
  console.log(`  ✗ Failed: ${result.stepsFailed}`)
  console.log(`  ○ Not Reached: ${result.stepsNotReached}`)
  console.log(`  Duration: ${result.durationMs}ms`)

  return result
}

/**
 * EXEMPLE 2 : Exécuter plusieurs journeys séquentiellement
 */
export async function exampleMultipleJourneys(scanId: string, baseUrl: string) {
  const journeysToRun = ALL_JOURNEYS.filter(j => j.name !== 'Intentionally Broken Flow (Test)')
  const results: Array<{ name: string; passed: boolean; duration: number }> = []
  const browserEngine = new BrowserEngine(new QAConfigManager())
  await browserEngine.initialize()

  try {
    for (const journey of journeysToRun) {
      console.log(`\n[Journey ${results.length + 1}/${journeysToRun.length}] Starting: ${journey.name}`)
      const result = await browserEngine.executeJourney(scanId, withStartUrl(journey, baseUrl))
      await persistJourneyResults(result)

      results.push({
        name: journey.name,
        passed: result.stepsFailed === 0,
        duration: result.durationMs,
      })

      console.log(`  Result: ${result.stepsFailed === 0 ? '✓ PASSED' : '✗ FAILED'}`)
      console.log(`  Duration: ${result.durationMs}ms`)
    }
  } finally {
    await browserEngine.cleanup()
  }

  console.log('\n[Journey Suite] Summary:')
  console.log(`  Total: ${results.length}`)
  console.log(`  Passed: ${results.filter(r => r.passed).length}`)
  console.log(`  Failed: ${results.filter(r => !r.passed).length}`)
  console.log(`  Total Duration: ${results.reduce((sum, r) => sum + r.duration, 0)}ms`)

  return results
}

/**
 * EXEMPLE 3 : Exécuter le journey de test cassé (pour tester les screenshots FAIL)
 */
export async function exampleBrokenJourney(scanId: string, baseUrl: string) {
  console.log('[Journey] Executing BROKEN test journey (will fail intentionally)')
  const result = await runJourney(scanId, withStartUrl(JOURNEY_BROKEN_TEST, baseUrl))
  await persistJourneyResults(result)

  console.log(`[Journey] Broken test completed as expected`)
  console.log(`  Steps that passed: ${result.stepsPassed}`)
  console.log(`  Steps that failed: ${result.stepsFailed}`)
  console.log(`  Steps not reached: ${result.stepsNotReached}`)

  const failedStep = result.steps.find(s => s.status === 'fail')
  if (failedStep?.screenshotId) {
    console.log(`  ✓ Screenshot captured for failed step: ${failedStep.screenshotId}`)
  } else {
    console.warn(`  ⚠ No screenshot captured for failed step!`)
  }

  return result
}

/**
 * EXEMPLE 4 : Intégration dans le scan orchestrator avec gestion d'erreur
 */
export async function integrateJourneysInScan(
  scanId: string,
  baseUrl: string,
  page: Page,
  journeyNames: string[] = ['User Login Flow']
) {
  const journeyResults: Array<{
    name: string
    success: boolean
    error?: string
  }> = []

  const browserEngine = new BrowserEngine(new QAConfigManager())
  await browserEngine.initialize()

  try {
    for (const journeyName of journeyNames) {
      const journey = getJourneyByName(journeyName)

      if (!journey) {
        console.warn(`[Journey] Not found: ${journeyName}`)
        journeyResults.push({
          name: journeyName,
          success: false,
          error: 'Journey definition not found',
        })
        continue
      }

      try {
        console.log(`[Journey] Executing: ${journey.name}`)
        const result = await browserEngine.executeJourney(scanId, withStartUrl(journey, baseUrl))
        await persistJourneyResults(result)

        journeyResults.push({
          name: journey.name,
          success: result.stepsFailed === 0,
        })

        console.log(`[Journey] ✓ Completed: ${journey.name}`)
      } catch (error) {
        console.error(`[Journey] ✗ Error executing ${journey.name}:`, error)
        journeyResults.push({
          name: journey.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }

      await page.waitForTimeout(1000)
    }
  } finally {
    await browserEngine.cleanup()
  }

  return journeyResults
}

/**
 * EXEMPLE 5 : Configuration dynamique des journeys selon le type de site
 */
export async function executeJourneysForSiteType(
  scanId: string,
  siteType: 'ecommerce' | 'saas' | 'blog' | 'landing',
  baseUrl: string,
  page: Page
) {
  const journeysByType: Record<string, string[]> = {
    ecommerce: ['User Login Flow', 'Complete Checkout Flow'],
    saas: ['User Login Flow', 'New User Signup'],
    blog: ['User Login Flow'],
    landing: ['New User Signup'],
  }

  const journeysToRun = journeysByType[siteType] || []

  console.log(`[Journey] Site type: ${siteType}`)
  console.log(`[Journey] Journeys to execute: ${journeysToRun.join(', ')}`)

  return integrateJourneysInScan(scanId, baseUrl, page, journeysToRun)
}

/**
 * EXEMPLE 6 : Journey conditionnel selon les résultats d'un scan
 */
export async function conditionalJourneys(
  scanId: string,
  page: Page,
  hasLoginDetected: boolean,
  hasCheckoutDetected: boolean,
  baseUrl: string
) {
  const journeysToExecute: JourneyDefinition[] = []

  if (hasLoginDetected) {
    const loginJourney = getJourneyByName('User Login Flow')
    if (loginJourney) journeysToExecute.push(loginJourney)
  }

  if (hasCheckoutDetected) {
    const checkoutJourney = getJourneyByName('Complete Checkout Flow')
    if (checkoutJourney) journeysToExecute.push(checkoutJourney)
  }

  const browserEngine = new BrowserEngine(new QAConfigManager())
  await browserEngine.initialize()

  try {
    for (const journey of journeysToExecute) {
      try {
        const result = await browserEngine.executeJourney(scanId, withStartUrl(journey, baseUrl))
        await persistJourneyResults(result)
        console.log(`[Journey] ✓ ${journey.name} completed`)
      } catch (error) {
        console.error(`[Journey] ✗ ${journey.name} failed:`, error)
      }
    }
  } finally {
    await browserEngine.cleanup()
  }
}

/**
 * EXEMPLE 7 : Récupérer et afficher les résultats après le scan
 */
export async function displayJourneyResults(scanId: string) {
  const { fetchJourneySteps, fetchJourneyNames } = await import('@/lib/qa/journeys/persistence')

  const journeyNames = await fetchJourneyNames(scanId)

  console.log(`\n[Journey Results] Scan: ${scanId}`)
  console.log(`[Journey Results] Journeys executed: ${journeyNames.length}`)

  for (const journeyName of journeyNames) {
    const steps = await fetchJourneySteps(scanId)
    const journeySteps = steps.filter(s => s.journeyName === journeyName)

    const passCount = journeySteps.filter(s => s.status === 'pass').length
    const failCount = journeySteps.filter(s => s.status === 'fail').length
    const notReachedCount = journeySteps.filter(s => s.status === 'not_reached').length

    console.log(`\n  Journey: ${journeyName}`)
    console.log(`    Total Steps: ${journeySteps.length}`)
    console.log(`    ✓ Pass: ${passCount}`)
    console.log(`    ✗ Fail: ${failCount}`)
    console.log(`    ○ Not Reached: ${notReachedCount}`)

    const failedSteps = journeySteps.filter(s => s.status === 'fail')
    if (failedSteps.length > 0) {
      console.log(`    Failed Steps:`)
      failedSteps.forEach(step => {
        console.log(`      - ${step.stepName}`)
        console.log(`        Error: ${step.errorMessage}`)
        console.log(`        Screenshot: ${step.screenshotId ? '✓ Captured' : '✗ None'}`)
      })
    }
  }
}

/**
 * POINT D'ENTRÉE PRINCIPAL : À intégrer dans votre scan orchestrator
 */
export async function runJourneysInQaScan(
  scanId: string,
  siteUrl: string,
  options: {
    journeyNames?: string[]
    siteType?: 'ecommerce' | 'saas' | 'blog' | 'landing'
    reuseExistingPage?: Page
  } = {}
) {
  const shouldCreateBrowser = !options.reuseExistingPage

  let browser
  let context
  let page = options.reuseExistingPage

  try {
    if (shouldCreateBrowser) {
      browser = await chromium.launch({ headless: true })
      context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
      })
      page = await context.newPage()
      await page.goto(siteUrl)
    }

    if (!page) {
      throw new Error('No page available for journey execution')
    }
    const activePage = page

    let results
    if (options.journeyNames && options.journeyNames.length > 0) {
      results = await integrateJourneysInScan(scanId, siteUrl, activePage, options.journeyNames)
    } else if (options.siteType) {
      results = await executeJourneysForSiteType(scanId, options.siteType, siteUrl, activePage)
    } else {
      results = await integrateJourneysInScan(scanId, siteUrl, activePage, ['User Login Flow'])
    }

    return results
  } finally {
    if (shouldCreateBrowser && context && browser) {
      await context.close()
      await browser.close()
    }
  }
}
