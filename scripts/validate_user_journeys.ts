import http from 'http'
import { chromium } from 'playwright'

interface JourneyResult {
  name: string
  stepsTotal: number
  stepsPassed: number
  status: 'PASS' | 'FAIL'
  durationMs: number
  evidence: {
    type: string
    summary: string
    details?: any
  }[]
  error?: string
}

async function startFixtureServer(port: number): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${port}`)

      // --- PARCOURS A ---
      if (url.pathname === '/journey-a-home') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Acme SaaS - Accueil</title></head>
            <body>
              <header>
                <nav><a id="pricing-link" href="/journey-a-pricing">Tarifs & Offres</a></nav>
              </header>
              <main><h1>Qualio Target App</h1><p>Bienvenue sur notre solution SaaS.</p></main>
            </body>
          </html>
        `)
      }

      if (url.pathname === '/journey-a-pricing') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Tarifs - Acme SaaS</title></head>
            <body>
              <h1>Nos Offres</h1>
              <div class="pricing-card">
                <h2>Plan Entreprise</h2>
                <a id="demo-cta" class="cta" href="/journey-a-contact">Demander une démo</a>
              </div>
            </body>
          </html>
        `)
      }

      if (url.pathname === '/journey-a-contact') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Demande de Démo - Acme SaaS</title></head>
            <body>
              <h1>Planifiez votre démo</h1>
              <form id="contact-form" action="/journey-a-submit" method="POST">
                <input id="name" name="name" type="text" placeholder="Votre nom" required />
                <input id="email" name="email" type="email" placeholder="Email professionnel" required />
                <button id="submit-contact" type="submit">Envoyer la demande</button>
              </form>
            </body>
          </html>
        `)
      }

      if (url.pathname === '/journey-a-submit' && req.method === 'POST') {
        res.writeHead(303, { Location: '/journey-a-success' })
        return res.end()
      }

      if (url.pathname === '/journey-a-success') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Confirmation - Acme SaaS</title></head>
            <body>
              <div id="confirmation-banner">
                <h2>Merci pour votre message !</h2>
                <p id="confirmation-msg">Votre demande de démo a bien été prise en compte.</p>
              </div>
            </body>
          </html>
        `)
      }

      // --- PARCOURS B ---
      if (url.pathname === '/journey-b-home') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Portail Client - Accueil</title></head>
            <body>
              <h1>Portail Client</h1>
              <a id="login-link" href="/journey-b-login">Accéder à mon compte</a>
            </body>
          </html>
        `)
      }

      if (url.pathname === '/journey-b-login') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Connexion Sécurisée</title></head>
            <body>
              <form id="login-form" action="/journey-b-submit" method="POST">
                <input id="login-email" name="email" type="email" required />
                <input id="login-pass" name="password" type="password" required />
                <button id="login-btn" type="submit">Se connecter</button>
              </form>
            </body>
          </html>
        `)
      }

      if (url.pathname === '/journey-b-submit' && req.method === 'POST') {
        res.writeHead(303, { Location: '/journey-b-dashboard' })
        return res.end()
      }

      if (url.pathname === '/journey-b-dashboard') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Tableau de bord Client</title></head>
            <body>
              <h1 id="user-greeting">Bienvenue sur votre espace client</h1>
              <p>Session active vérifiée.</p>
            </body>
          </html>
        `)
      }

      // --- PARCOURS C ---
      if (url.pathname === '/journey-c-home') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Site Mobile</title>
              <style>
                #drawer-menu { display: none; }
                #drawer-menu.open { display: block; }
              </style>
            </head>
            <body>
              <header>
                <button id="burger-btn" onclick="document.getElementById('drawer-menu').classList.toggle('open')">☰ Menu</button>
                <div id="drawer-menu">
                  <a id="nav-pricing" href="/journey-c-pricing">Voir les offres</a>
                </div>
              </header>
            </body>
          </html>
        `)
      }

      if (url.pathname === '/journey-c-pricing') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Tarifs Mobile</title></head>
            <body>
              <h1>Tarifs Mobile</h1>
              <button id="cta-mobile-btn">Souscrire au plan Pro</button>
              <div id="cta-status" style="display:none;">Offre Pro ajoutée au panier</div>
              <script>
                document.getElementById('cta-mobile-btn').addEventListener('click', function() {
                  document.getElementById('cta-status').style.display = 'block';
                });
              </script>
            </body>
          </html>
        `)
      }

      // --- PARCOURS D ---
      if (url.pathname === '/journey-d-home') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Tunnel de Commande (Simulation non-destructive)</title></head>
            <body>
              <h1>Récapitulatif de commande</h1>
              <div id="cart-item">Abonnement Mensuel - 49 €</div>
              <button id="confirm-order-btn">Confirmer la commande (Simulation)</button>
              <div id="order-feedback" style="display:none;">Commande confirmée avec succès. Statut: Validé</div>
              <script>
                document.getElementById('confirm-order-btn').addEventListener('click', function() {
                  document.getElementById('order-feedback').style.display = 'block';
                });
              </script>
            </body>
          </html>
        `)
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not Found')
    })

    server.listen(port, () => resolve(server))
  })
}

async function runJourneys() {
  const PORT = 43210
  const server = await startFixtureServer(PORT)
  const baseUrl = `http://localhost:${PORT}`

  console.log('======================================================================')
  console.log('QUALIO USER JOURNEY VALIDATION (PARCOURS PAYANTS A, B, C, D)')
  console.log('======================================================================\n')

  const browser = await chromium.launch({ headless: true })
  const results: JourneyResult[] = []

  try {
    // -------------------------------------------------------------------------
    // PARCOURS A: Homepage → Pricing → CTA → Demo/Contact Form → Submit → Confirmation
    // -------------------------------------------------------------------------
    {
      const t0 = Date.now()
      const evidence: JourneyResult['evidence'] = []
      let stepsPassed = 0
      const context = await browser.newContext()
      const page = await context.newPage()

      console.log('▶ EXÉCUTION DU PARCOURS A : Lead & Demo Conversion Flow')
      try {
        const resHome = await page.goto(`${baseUrl}/journey-a-home`, { waitUntil: 'domcontentloaded' })
        if (resHome?.status() === 200) stepsPassed++
        evidence.push({ type: 'http', summary: 'Homepage HTTP 200', details: { url: page.url(), status: resHome?.status() } })

        await page.click('#pricing-link')
        await page.waitForURL('**/journey-a-pricing')
        stepsPassed++
        evidence.push({ type: 'navigation', summary: 'Navigated to Pricing page', details: { url: page.url() } })

        await page.click('#demo-cta')
        await page.waitForURL('**/journey-a-contact')
        stepsPassed++
        evidence.push({ type: 'cta', summary: 'CTA clicked to open Contact/Demo form', details: { url: page.url() } })

        await page.fill('#name', 'Jean Testeur')
        await page.fill('#email', 'jean.testeur@qualio-test.io')
        stepsPassed++
        evidence.push({ type: 'dom', summary: 'Form inputs filled (non-sensitive test data)' })

        await Promise.all([
          page.waitForURL('**/journey-a-success'),
          page.click('#submit-contact'),
        ])
        stepsPassed++
        evidence.push({ type: 'network', summary: 'Form POST redirected to success confirmation' })

        const confirmMsg = await page.textContent('#confirmation-msg')
        if (confirmMsg?.includes('prise en compte')) stepsPassed++
        evidence.push({ type: 'dom', summary: `Confirmation validated: "${confirmMsg?.trim()}"` })

        const screenshot = await page.screenshot({ type: 'png' })
        evidence.push({ type: 'screenshot', summary: `Proof screenshot captured (${screenshot.length} bytes)` })

        results.push({
          name: 'Parcours A: Homepage → Pricing → CTA → Contact/Demo → Submit → Confirmation',
          stepsTotal: 6,
          stepsPassed,
          status: stepsPassed === 6 ? 'PASS' : 'FAIL',
          durationMs: Date.now() - t0,
          evidence
        })
      } catch (err: any) {
        results.push({
          name: 'Parcours A: Homepage → Pricing → CTA → Contact/Demo → Submit → Confirmation',
          stepsTotal: 6,
          stepsPassed,
          status: 'FAIL',
          durationMs: Date.now() - t0,
          evidence,
          error: err.message
        })
      } finally {
        await context.close()
      }
    }

    // -------------------------------------------------------------------------
    // PARCOURS B: Homepage → Login → Formulaire → Submit → Redirect
    // -------------------------------------------------------------------------
    {
      const t0 = Date.now()
      const evidence: JourneyResult['evidence'] = []
      let stepsPassed = 0
      const context = await browser.newContext()
      const page = await context.newPage()

      console.log('▶ EXÉCUTION DU PARCOURS B : Auth & Redirect Flow')
      try {
        const resHome = await page.goto(`${baseUrl}/journey-b-home`, { waitUntil: 'domcontentloaded' })
        if (resHome?.status() === 200) stepsPassed++
        evidence.push({ type: 'http', summary: 'Home HTTP 200', details: { url: page.url() } })

        await page.click('#login-link')
        await page.waitForURL('**/journey-b-login')
        stepsPassed++
        evidence.push({ type: 'navigation', summary: 'Navigated to Login page', details: { url: page.url() } })

        await page.fill('#login-email', 'client@qualio-test.io')
        await page.fill('#login-pass', 'DummyPassword123!')
        stepsPassed++
        evidence.push({ type: 'dom', summary: 'Filled mock credentials safely' })

        await Promise.all([
          page.waitForURL('**/journey-b-dashboard'),
          page.click('#login-btn'),
        ])
        stepsPassed++
        evidence.push({ type: 'network', summary: 'POST authenticated and redirected to /dashboard' })

        const greeting = await page.textContent('#user-greeting')
        if (greeting?.includes('espace client')) stepsPassed++
        evidence.push({ type: 'dom', summary: `Dashboard state validated: "${greeting?.trim()}"` })

        results.push({
          name: 'Parcours B: Homepage → Login → Formulaire → Submit → Redirect',
          stepsTotal: 5,
          stepsPassed,
          status: stepsPassed === 5 ? 'PASS' : 'FAIL',
          durationMs: Date.now() - t0,
          evidence
        })
      } catch (err: any) {
        results.push({
          name: 'Parcours B: Homepage → Login → Formulaire → Submit → Redirect',
          stepsTotal: 5,
          stepsPassed,
          status: 'FAIL',
          durationMs: Date.now() - t0,
          evidence,
          error: err.message
        })
      } finally {
        await context.close()
      }
    }

    // -------------------------------------------------------------------------
    // PARCOURS C: Homepage → Navigation Mobile → Menu Burger → Pricing → CTA
    // -------------------------------------------------------------------------
    {
      const t0 = Date.now()
      const evidence: JourneyResult['evidence'] = []
      let stepsPassed = 0
      const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        isMobile: true
      })
      const page = await context.newPage()

      console.log('▶ EXÉCUTION DU PARCOURS C : Mobile Responsive Burger Navigation Flow')
      try {
        const resHome = await page.goto(`${baseUrl}/journey-c-home`, { waitUntil: 'domcontentloaded' })
        if (resHome?.status() === 200) stepsPassed++
        evidence.push({ type: 'http', summary: 'Mobile Home HTTP 200', details: { viewport: '375x812' } })

        await page.click('#burger-btn')
        const isMenuVisible = await page.isVisible('#nav-pricing')
        if (isMenuVisible) stepsPassed++
        evidence.push({ type: 'dom', summary: 'Burger menu toggled, navigation links visible' })

        await page.click('#nav-pricing')
        await page.waitForURL('**/journey-c-pricing')
        stepsPassed++
        evidence.push({ type: 'navigation', summary: 'Navigated to mobile pricing' })

        await page.click('#cta-mobile-btn')
        const ctaStatus = await page.textContent('#cta-status')
        if (ctaStatus?.includes('Offre Pro')) stepsPassed++
        evidence.push({ type: 'cta', summary: `CTA click triggered expected action: "${ctaStatus?.trim()}"` })

        results.push({
          name: 'Parcours C: Homepage → Navigation Mobile → Menu Burger → Pricing → CTA',
          stepsTotal: 4,
          stepsPassed,
          status: stepsPassed === 4 ? 'PASS' : 'FAIL',
          durationMs: Date.now() - t0,
          evidence
        })
      } catch (err: any) {
        results.push({
          name: 'Parcours C: Homepage → Navigation Mobile → Menu Burger → Pricing → CTA',
          stepsTotal: 4,
          stepsPassed,
          status: 'FAIL',
          durationMs: Date.now() - t0,
          evidence,
          error: err.message
        })
      } finally {
        await context.close()
      }
    }

    // -------------------------------------------------------------------------
    // PARCOURS D: Homepage → Checkout (simulation non-destructive) → Interaction → Résultat
    // -------------------------------------------------------------------------
    {
      const t0 = Date.now()
      const evidence: JourneyResult['evidence'] = []
      let stepsPassed = 0
      const context = await browser.newContext()
      const page = await context.newPage()

      console.log('▶ EXÉCUTION DU PARCOURS D : Non-Destructive Checkout Simulation Flow')
      try {
        const resHome = await page.goto(`${baseUrl}/journey-d-home`, { waitUntil: 'domcontentloaded' })
        if (resHome?.status() === 200) stepsPassed++
        evidence.push({ type: 'http', summary: 'Checkout demo page HTTP 200' })

        const itemText = await page.textContent('#cart-item')
        if (itemText?.includes('Abonnement')) stepsPassed++
        evidence.push({ type: 'dom', summary: `Cart item identified: "${itemText?.trim()}"` })

        await page.click('#confirm-order-btn')
        stepsPassed++
        evidence.push({ type: 'action', summary: 'Simulated order confirmation triggered (no card charged, safe)' })

        const feedback = await page.textContent('#order-feedback')
        if (feedback?.includes('confirmée avec succès')) stepsPassed++
        evidence.push({ type: 'dom', summary: `Order result validated: "${feedback?.trim()}"` })

        results.push({
          name: 'Parcours D: Homepage → Checkout (simulation) → Interaction → Résultat',
          stepsTotal: 4,
          stepsPassed,
          status: stepsPassed === 4 ? 'PASS' : 'FAIL',
          durationMs: Date.now() - t0,
          evidence
        })
      } catch (err: any) {
        results.push({
          name: 'Parcours D: Homepage → Checkout (simulation) → Interaction → Résultat',
          stepsTotal: 4,
          stepsPassed,
          status: 'FAIL',
          durationMs: Date.now() - t0,
          evidence,
          error: err.message
        })
      } finally {
        await context.close()
      }
    }

    console.log('\n======================================================================')
    console.log('SYNTHÈSE DES PARCOURS UTILISATEURS TESTÉS')
    console.log('======================================================================')
    for (const r of results) {
      console.log(`\n• ${r.name}`)
      console.log(`  Statut: [${r.status}] (${r.stepsPassed}/${r.stepsTotal} étapes réussies en ${r.durationMs}ms)`)
      if (r.error) console.log(`  Erreur: ${r.error}`)
      console.log(`  Preuves produites (${r.evidence.length}) :`)
      r.evidence.forEach(ev => console.log(`    - [${ev.type.toUpperCase()}] ${ev.summary}`))
    }

    const allPassed = results.every(r => r.status === 'PASS')
    if (!allPassed) {
      process.exit(1)
    }
  } finally {
    await browser.close()
    server.close()
  }
}

runJourneys().catch(err => {
  console.error('Fatal journey runner error:', err)
  process.exit(1)
})
