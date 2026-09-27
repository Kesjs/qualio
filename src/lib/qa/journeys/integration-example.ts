/**
 * EXEMPLE D'INTÉGRATION DES JOURNEY STEPS DANS LE SCAN ORCHESTRATOR
 * 
 * Ce fichier montre comment exécuter des journeys pendant un scan QA
 * et persister les résultats dans Supabase.
 * 
 * À intégrer dans votre logique de scan existante (ex: runQaScan, scanOrchestrator, etc.)
 */

import { chromium, type Page } from 'playwright'
import { executeJourney } from '@/lib/qa/browser/BrowserEngine'
import { persistJourneyResults } from '@/lib/qa/journeys/persistence'
import { ALL_JOURNEYS, JOURNEY_BROKEN_TEST, getJourneyByName } from '@/lib/qa/journeys/definitions'
import type { JourneyDefinition } from '@/lib/qa/types'

/**
 * EXEMPLE 1 : Exécuter un seul journey pendant le scan
 */
export async function exampleSingleJourney(scanId: string, baseUrl: string) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  })
  const page = await context.newPage()

  try {
    // 1. Naviguer vers la page de base
    await page.goto(baseUrl)

    // 2. Choisir un journey à exécuter
    const journey = getJourneyByName('User Login Flow')
    
    if (!journey) {
      throw new Error('Journey not found')
    }

    // 3. Exécuter le journey
    console.log(`[Journey] Starting: ${journey.name}`)
    const result = await executeJourney(scanId, journey, page)

    // 4. Persister les résultats dans Supabase
    await persistJourneyResults(scanId, result)

    // 5. Logger les résultats
    console.log(`[Journey] Completed: ${journey.name}`)
    console.log(`  ✓ Passed: ${result.passCount}`)
    console.log(`  ✗ Failed: ${result.failCount}`)
    console.log(`  ○ Not Reached: ${result.notReachedCount}`)
    console.log(`  ⊘ Skipped: ${result.skipCount}`)
    console.log(`  Duration: ${result.totalDuration}ms`)

    return result
  } catch (error) {
    console.error('[Journey] Error:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
}

/**
 * EXEMPLE 2 : Exécuter plusieurs journeys séquentiellement
 */
export async function exampleMultipleJourneys(scanId: string, baseUrl: string) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  })
  const page = await context.newPage()

  const results: Array<{ name: string; passed: boolean; duration: number }> = []

  try {
    await page.goto(baseUrl)

    // Exécuter tous les journeys (sauf le broken test)
    const journeysToRun = ALL_JOURNEYS.filter(j => j.name !== 'Intentionally Broken Flow (Test)')

    for (const journey of journeysToRun) {
      console.log(`\n[Journey ${results.length + 1}/${journeysToRun.length}] Starting: ${journey.name}`)
      
      const result = await executeJourney(scanId, journey, page)
      await persistJourneyResults(scanId, result)

      results.push({
        name: journey.name,
        passed: result.failCount === 0,
        duration: result.totalDuration
      })

      console.log(`  Result: ${result.failCount === 0 ? '✓ PASSED' : '✗ FAILED'}`)
      console.log(`  Duration: ${result.totalDuration}ms`)

      // Attendre un peu entre chaque journey pour éviter les rate limits
      await page.waitForTimeout(2000)
    }

    // Résumé global
    console.log('\n[Journey Suite] Summary:')
    console.log(`  Total: ${results.length}`)
    console.log(`  Passed: ${results.filter(r => r.passed).length}`)
    console.log(`  Failed: ${results.filter(r => !r.passed).length}`)
    console.log(`  Total Duration: ${results.reduce((sum, r) => sum + r.duration, 0)}ms`)

    return results
  } finally {
    await context.close()
    await browser.close()
  }
}

/**
 * EXEMPLE 3 : Exécuter le journey de test cassé (pour tester les screenshots FAIL)
 */
export async function exampleBrokenJourney(scanId: string, baseUrl: string) {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  })
  const page = await context.newPage()

  try {
    await page.goto(baseUrl)

    console.log('[Journey] Executing BROKEN test journey (will fail intentionally)')
    const result = await executeJourney(scanId, JOURNEY_BROKEN_TEST, page)
    await persistJourneyResults(scanId, result)

    console.log(`[Journey] Broken test completed as expected`)
    console.log(`  Steps that passed: ${result.passCount}`)
    console.log(`  Steps that failed: ${result.failCount}`)
    console.log(`  Steps not reached: ${result.notReachedCount}`)

    // Vérifier que le screenshot a bien été capturé sur l'étape failed
    const failedStep = result.steps.find(s => s.status === 'fail')
    if (failedStep?.screenshot_id) {
      console.log(`  ✓ Screenshot captured for failed step: ${failedStep.screenshot_id}`)
    } else {
      console.warn(`  ⚠ No screenshot captured for failed step!`)
    }

    return result
  } finally {
    await context.close()
    await browser.close()
  }
}

/**
 * EXEMPLE 4 : Intégration dans le scan orchestrator avec gestion d'erreur
 */
export async function integrateJourneysInScan(
  scanId: string, 
  baseUrl: string, 
  page: Page,  // Réutiliser la page du scan existant
  journeyNames: string[] = ['User Login Flow']  // Configurable
) {
  const journeyResults: Array<{
    name: string
    success: boolean
    error?: string
  }> = []

  for (const journeyName of journeyNames) {
    const journey = getJourneyByName(journeyName)
    
    if (!journey) {
      console.warn(`[Journey] Not found: ${journeyName}`)
      journeyResults.push({
        name: journeyName,
        success: false,
        error: 'Journey definition not found'
      })
      continue
    }

    try {
      console.log(`[Journey] Executing: ${journey.name}`)
      const result = await executeJourney(scanId, journey, page)
      await persistJourneyResults(scanId, result)

      journeyResults.push({
        name: journey.name,
        success: result.failCount === 0
      })

      console.log(`[Journey] ✓ Completed: ${journey.name}`)
    } catch (error) {
      console.error(`[Journey] ✗ Error executing ${journey.name}:`, error)
      journeyResults.push({
        name: journey.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Pause entre les journeys
    await page.waitForTimeout(1000)
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
  // Mapper les journeys selon le type de site
  const journeysByType: Record<string, string[]> = {
    ecommerce: ['User Login Flow', 'Complete Checkout Flow'],
    saas: ['User Login Flow', 'New User Signup'],
    blog: ['User Login Flow'],
    landing: ['New User Signup']
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
  hasCheckoutDetected: boolean
) {
  const journeysToExecute: JourneyDefinition[] = []

  // Exécuter le journey login seulement si un formulaire de login a été détecté
  if (hasLoginDetected) {
    const loginJourney = getJourneyByName('User Login Flow')
    if (loginJourney) journeysToExecute.push(loginJourney)
  }

  // Exécuter le journey checkout seulement si un système de paiement a été détecté
  if (hasCheckoutDetected) {
    const checkoutJourney = getJourneyByName('Complete Checkout Flow')
    if (checkoutJourney) journeysToExecute.push(checkoutJourney)
  }

  for (const journey of journeysToExecute) {
    try {
      const result = await executeJourney(scanId, journey, page)
      await persistJourneyResults(scanId, result)
      console.log(`[Journey] ✓ ${journey.name} completed`)
    } catch (error) {
      console.error(`[Journey] ✗ ${journey.name} failed:`, error)
    }
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
    const journeySteps = steps.filter(s => s.journey_name === journeyName)

    const passCount = journeySteps.filter(s => s.status === 'pass').length
    const failCount = journeySteps.filter(s => s.status === 'fail').length
    const notReachedCount = journeySteps.filter(s => s.status === 'not_reached').length

    console.log(`\n  Journey: ${journeyName}`)
    console.log(`    Total Steps: ${journeySteps.length}`)
    console.log(`    ✓ Pass: ${passCount}`)
    console.log(`    ✗ Fail: ${failCount}`)
    console.log(`    ○ Not Reached: ${notReachedCount}`)

    // Afficher les détails des étapes failed
    const failedSteps = journeySteps.filter(s => s.status === 'fail')
    if (failedSteps.length > 0) {
      console.log(`    Failed Steps:`)
      failedSteps.forEach(step => {
        console.log(`      - ${step.step_name}`)
        console.log(`        Error: ${step.error_message}`)
        console.log(`        Screenshot: ${step.screenshot_id ? '✓ Captured' : '✗ None'}`)
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
    // Créer le browser seulement si on n'a pas de page existante
    if (shouldCreateBrowser) {
      browser = await chromium.launch({ headless: true })
      context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
      })
      page = await context.newPage()
      await page.goto(siteUrl)
    }

    if (!page) {
      throw new Error('No page available for journey execution')
    }

    // Décider quels journeys exécuter
    let results
    if (options.journeyNames && options.journeyNames.length > 0) {
      // Mode : journeys spécifiques
      results = await integrateJourneysInScan(scanId, siteUrl, page, options.journeyNames)
    } else if (options.siteType) {
      // Mode : journeys selon le type de site
      results = await executeJourneysForSiteType(scanId, options.siteType, siteUrl, page)
    } else {
      // Mode par défaut : login flow uniquement
      results = await integrateJourneysInScan(scanId, siteUrl, page, ['User Login Flow'])
    }

    return results
  } finally {
    // Ne fermer le browser que si on l'a créé nous-mêmes
    if (shouldCreateBrowser && context && browser) {
      await context.close()
      await browser.close()
    }
  }
}
