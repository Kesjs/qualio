export type Language = 'en' | 'fr';

export const translations = {
  en: {
    hero: {
      badge: "Your website QA workspace",
      titleStart: "Ship updates without",
      titleHighlight: "holding your breath.",
      description: "Qualio explores key user journeys in a real browser, gathers evidence, and turns each issue into a correction prompt your team can use.",
      ctaPrimary: "Run your first scan",
      stats: {
        checks: { value: "Real", label: "browser journeys" },
        speed: { value: "AI", label: "correction prompt" },
        sdk: { value: "0", label: "code needed" },
      },
      tabs: {
        scan: {
          label: "Live scan",
          desc: "Real clicks. Real user journeys.",
          sub: "Qualio navigates your site, clicks buttons, and tests forms exactly like a human visitor would.",
        },
        diagnosis: {
          label: "AI diagnosis",
          desc: "User impact, root cause, confidence score.",
          sub: "AI filters out log noise to isolate and triage the exact issues blocking user conversions.",
        },
        history: {
          label: "Scan history",
          desc: "Resolved issues vs regressions.",
          sub: "Automated diff after every release. Instantly verify fixes without introducing new bugs.",
        },
      }
    },
    cta: {
      badge: "No card required",
      titleStart: "You build the product.",
      titleHighlight: "We make sure it works.",
      description: "Real browser tests, plain-English bug reports, zero code to install. Clean and simple.",
      inputLabel: "Website URL",
      inputPlaceholder: "https://your-site.com",
      buttonIdle: "Create account and scan →",
      buttonLoading: "Preparing workspace…",
      buttonDone: "Scan complete — view results",
      caption: "Browser scan · Evidence · Correction prompt",
      checks: ["Links", "Buttons", "Forms", "Console", "Network", "Responsive"],
      stats: [
        { value: "Real", label: "browser session" },
        { value: "AI", label: "actionable prompt" },
        { value: "0", label: "code changes" },
      ],
    },
    logoStrip: {
      stats: [
        "Live browser journeys",
        "AI impact diagnosis",
        "Zero code to install"
      ],
      items: [
        "Form Submissions",
        "Dead Clicks & CTAs",
        "Broken Links (404/500)",
        "Console JS Errors",
        "Failed Network Requests",
        "Mobile & Responsive QA",
        "Playwright Chromium Engine",
        "AI Root Cause Diagnosis",
        "Regression Diffs & History",
        "Next.js · Remix · Astro",
        "Shopify · Webflow · Stripe",
        "Zero SDK Required"
      ]
    },
    howItWorks: {
      badge: "How it works",
      titleStart: "From URL to surgical",
      titleHighlight: "diagnosis and a correction prompt.",
      steps: [
        {
          label: "Submit URL",
          title: "Add a site. Pick depth.",
          body: "Enter your URL, select environment (Production / Staging), and choose scan depth: Quick (key pages only), Standard, or Full."
        },
        {
          label: "Playwright runs",
          title: "Real browser. Full interaction.",
          body: "Playwright explores reachable pages and key interactions. Network activity, console output, and screenshots are captured as evidence."
        },
        {
          label: "AI reads evidence",
          title: "Evidence → structured diagnosis.",
          body: "AI uses the collected evidence to describe impact, probable cause, reproduction steps, and uncertainties."
        },
        {
          label: "Copy. Fix. Re-scan.",
          title: "Use the prompt. Then verify.",
          body: "Copy the generated correction prompt into your coding assistant, deploy the change, and re-scan to verify the result. Qualio never accesses your repository."
        }
      ]
    },
    features: {
      badge: "Features",
      titleStart: "Everything you need to ship",
      titleHighlight: "without holding your breath.",
      items: [
        {
          label: "Scanner",
          title: "Real browser. Real interactions.",
          body: "Playwright explores reachable pages and key interactions. No synthetic pings — actual browser activity with network and console capture.",
          metricLabel: "browser-based"
        },
        {
          label: "Intelligence",
          title: "AI diagnosis.\nNot logs.",
          body: "Impact, probable cause, confidence, reproduction steps, and a copy-ready correction prompt for each issue.",
          metricLabel: "signal to noise"
        },
        {
          label: "Evidence",
          title: "Screenshot +\nnetwork + DOM.",
          body: "Every interaction saves a screenshot, network waterfall, and console snapshot. Reproduction steps you can share.",
          metricLabel: "evidence types"
        },
        {
          label: "Scan history",
          title: "Resolved vs regression.",
          body: "Track what's fixed and what's broken across every deploy. Qualio becomes your QA changelog.",
          metricLabel: "full history"
        },
        {
          label: "Setup",
          title: "URL in.\nInsights out.",
          body: "No SDK, no instrumentation, no code changes. Add a URL and Qualio handles the rest.",
          metricLabel: "lines of SDK"
        }
      ]
    },
    proofs: {
      detect: {
        eyebrow: "What Qualio detects",
        title: "The failures users actually feel.",
        description: "Qualio follows real browser journeys and surfaces the moments that block a signup, a form submission, or a conversion.",
        items: ["Dead clicks and broken CTAs", "Forms that fail to submit", "Broken links and 404/500 responses", "JavaScript errors affecting the page", "Failed network requests and responsive issues"]
      },
      receive: {
        eyebrow: "What you receive",
        title: "Evidence you can act on.",
        description: "Every issue comes with the context your team needs to reproduce it, prioritize it, and verify the fix after deployment.",
        items: ["Screenshot of the failing step", "Impact and reproduction steps", "Likely cause with confidence level", "Copy-ready correction prompt", "Resolved vs new regressions after a re-scan"]
      }
    },
    onboarding: {
      eyebrow: "First scan",
      title: "Get your first QA signal.",
      description: "Add a site and Qualio will test it like a real visitor — then take you straight to the workspace.",
      siteName: "Site name",
      siteNamePlaceholder: "Acme Marketing",
      url: "Website URL or domain",
      urlPlaceholder: "acme.com or https://acme.com",
      urlHelp: "A domain is enough. We will format it automatically.",
      environment: "Environment",
      production: "Production",
      staging: "Staging",
      depth: "Scan depth",
      quick: "Quick",
      standard: "Standard",
      full: "Full",
      recommended: "Recommended",
      launch: "Run my first scan",
      checking: "Checking the domain…",
      creating: "Preparing the workspace…",
      errorUrl: "Enter a valid domain or URL, for example acme.com.",
      errorGeneric: "We could not start the scan. Check the URL and try again.",
      browserEmpty: "Your site preview will appear here",
      browserHint: "Enter a domain to prepare the audit.",
      browserBlocked: "This site does not allow an embedded preview.",
      timelineTitle: "Qualio scan",
      timelineReady: "Ready to test",
      timelineConnecting: "Connecting to the site",
      timelineDiscovering: "Discovering pages",
      timelineTesting: "Testing real interactions",
      timelineEvidence: "Collecting evidence",
      timelineDiagnosis: "Preparing the diagnosis",
      timelineComplete: "Scan ready",
      openDashboard: "Open dashboard",
      consent: "I confirm that I am authorized to test this site.",
    },
    pricing: {
      badge: "Early access",
      titleStart: "Try the complete Qualio flow",
      titleHighlight: "while pricing is being finalized.",
      toggleMonthly: "Monthly",
      toggleAnnual: "Annual",
      mostPopularBadge: "Most popular",
      accessLabel: "Free during early access",
      footerNote: "No credit card required · Pricing will be announced before paid plans launch",
      plans: [
        {
          label: "Qualio early access",
          desc: "Create an account, add a site, run a scan, inspect the evidence, and copy the generated correction prompt.",
          cta: "Create my account"
        }
      ],
      planFeatures: {
        sites: "Sites",
        scansPerMonth: "Scans / month",
        pagesPerScan: "Pages / scan",
        aiDiagnosis: "AI diagnosis",
        evidence: "Evidence",
        report: "Client report",
        beforeAfter: "Before / After",
        history: "History",
        integrations: "Integrations",
        prioritySupport: "Priority support",
        reportTooltip: "Export the full scan results as a PDF for a clean record of what was found and fixed.",
        beforeAfterTooltip: "See the screenshot from before the fix and after the fix, side by side, for any resolved issue.",
        evidenceTooltip: "Screenshots, network requests, console output, and DOM state captured around the failing step."
      },
      planValues: {
        site: "Site workspace",
        browserScan: "Real-browser scan",
        aiDiagnosis: "Evidence-based AI diagnosis",
        evidence: "Screenshots, network, and console evidence",
        fixPrompt: "Copy-ready correction prompt",
        scanHistory: "Scan history and re-scan",
        unlimited: "Unlimited",
        aiBasic: "Basic",
        aiFull: "Full — impact + cause + fix",
        aiFullPlus: "Full + regression tracking",
        evidenceBasic: "Screenshot only",
        evidenceFull: "Screenshot + Network + Console",
        evidenceVideo: "Screenshot + Network + Console",
        reportNone: "Dashboard only",
        reportPdf: "PDF export",
        reportShareable: "Dashboard only",
        reportBranded: "Branded + PDF export",
        historyStarter: "7 days",
        historyPro: "90 days + diffs",
        historyTeam: "1 year + diffs",
        supportTeam: "Dedicated channel"
      }
    },
    faq: {
      badge: "FAQ",
      titleStart: "Questions about",
      titleHighlight: "how Qualio works.",
      subtitle: "Not finding what you need?",
      items: [
        {
          q: "Does Qualio require code changes or SDK installation?",
          a: "No. Qualio works entirely from the outside. You give it a URL and it runs a real Playwright browser session against your site. Nothing is installed in your codebase."
        },
        {
          q: "What exactly does 'real browser interaction' mean?",
          a: "Qualio opens reachable pages in a headless Chromium browser, exercises selected interactions, and records useful evidence such as requests, console output, DOM state, and screenshots."
        },
        {
          q: "How is AI diagnosis different from reading console errors myself?",
          a: "Console errors tell you what threw. Qualio's AI tells you what it means for your users, why it probably happened, and how confident it is. It also groups related errors into a single diagnosis so you're fixing root causes, not symptoms."
        },
        {
          q: "Can I use Qualio for staging environments?",
          a: "Yes. You can configure separate scan profiles for Production, Staging, and Preview URLs. Each environment tracks its own history and diffs."
        },
        {
          q: "How often can I run scans?",
          a: "During early access, scans are available without a paid plan. Usage limits and paid pricing will be announced before billing is enabled."
        },
        {
          q: "What happens after I fix an issue?",
          a: "Click 'Re-scan'. Qualio runs against your updated site and diffs the results against the previous scan. Resolved issues are marked ✓ resolved, any new problems appear as regressions. The full history is preserved."
        },
        {
          q: "Is my site's data kept private?",
          a: "Qualio only records what a browser session would normally observe. Evidence (screenshots, logs) is stored encrypted per workspace and never shared across accounts. You can delete a scan workspace at any time."
        }
      ]
    },
    footerDesc: "Your website QA workspace. Real browser interactions, AI-powered diagnosis.",
    auth: {
      password: { title: 'Welcome back', description: 'Sign in to your Qualio workspace.' },
      register: { title: 'Create account', description: 'Start scanning your website for free.' },
      forgot: { title: 'Reset password', description: "We'll send a reset link to your email." },
      otp: { title: 'Quick sign-in', description: 'Get a one-time code sent to your email.' },
      otpVerify: { title: 'Check your inbox', description: 'Enter the 6-digit code we sent you.' },
      verifyEmail: { title: 'Verify your email', description: 'We sent a confirmation link to your email.' },
      errors: {
        fillAll: 'Fill in all fields',
        incorrect: 'Incorrect email or password',
        signinFailed: 'Sign-in failed',
        registerFailed: 'Registration failed',
        tooManyAttempts: 'Too many signup attempts. Please try again later.',
        enterEmail: 'Enter your email',
        resetFailed: 'Failed to send reset link',
        googleFailed: 'Google sign-in failed',
        invalidCode: 'Invalid or expired code. Try again.'
      },
      success: {
        signedIn: 'Signed in',
        accountCreated: 'Account created! Check your email to confirm.',
        resetSent: 'Reset link sent — check your inbox'
      },
      labels: {
        email: 'Email',
        emailPlaceholder: 'you@example.com',
        password: 'Password',
        passwordPlaceholderSignIn: '••••••••',
        passwordPlaceholderSignUp: 'At least 8 characters',
        forgot: 'Forgot password?',
        signIn: 'Sign in',
        createAccount: 'Create account',
        sendReset: 'Send reset link',
        backToSignIn: 'Back to sign in',
        sendCode: 'Send code',
        signInPasswordInstead: 'Sign in with password instead',
        codeSentTo: 'Code sent to',
        resendCode: 'Resend code',
        signInOtp: 'Sign in with email code (OTP)',
        noAccount: 'No account?',
        signUp: 'Sign up',
        alreadyHave: 'Already have an account?',
        termsPre: 'By continuing you agree to our',
        terms: 'Terms',
        and: 'and',
        privacy: 'Privacy Policy',
        continueWithGoogle: 'Continue with Google'
      },
      welcome: {
        title: 'Start with the right QA question',
        description: 'Tell Qualio what you want to protect first. You can change this later.',
        question: 'What do you want to verify first?',
        subtitle: 'Choose the path that best matches your first Qualio scan.',
        prompts: {
          publicSite: 'My public website',
          staging: 'A staging environment',
          regressions: 'My critical regressions',
        },
        selected: 'Choice saved for your first scan.',
        continue: 'Continue to email confirmation',
      }
    }
  },
  fr: {
    hero: {
      badge: "Votre espace de QA pour le web",
      titleStart: "Déployez enfin sans",
      titleHighlight: "retenir votre souffle",
      description: "Qualio explore les parcours clés dans un vrai navigateur, collecte les preuves et transforme chaque problème en prompt de correction exploitable.",
      ctaPrimary: "Lancer un premier scan",
      stats: {
        checks: { value: "Réels", label: "parcours navigateur" },
        speed: { value: "IA", label: "prompt de correction" },
        sdk: { value: "0", label: "code requis" },
      },
      tabs: {
        scan: {
          label: "Scan en direct",
          desc: "De vrais clics. De vrais parcours.",
          sub: "Qualio navigue sur votre site, clique sur vos boutons et teste vos formulaires exactement comme un vrai visiteur.",
        },
        diagnosis: {
          label: "Diagnostic IA",
          desc: "Impact utilisateur, cause du bug, niveau de confiance.",
          sub: "L'IA élimine le bruit des logs pour isoler les erreurs critiques qui bloquent vos utilisateurs.",
        },
        history: {
          label: "Historique",
          desc: "Bugs corrigés vs nouvelles régressions.",
          sub: "Comparaison automatique à chaque déploiement. Vérifiez vos correctifs en un coup d'œil.",
        },
      }
    },
    cta: {
      badge: "Sans carte bancaire",
      titleStart: "Vous construisez.",
      titleHighlight: "On s'assure que rien ne casse.",
      description: "De vraies interactions navigateur, des preuves lisibles et un prompt de correction à copier. Aucun SDK à installer.",
      inputLabel: "URL du site web",
      inputPlaceholder: "https://votre-site.com",
      buttonIdle: "Créer mon compte et lancer le scan →",
      buttonLoading: "Préparation de l’espace…",
      buttonDone: "Scan terminé — voir les résultats",
      caption: "Scan navigateur · Preuves · Prompt de correction",
      checks: ["Liens", "Boutons", "Formulaires", "Console", "Réseau", "Responsive"],
      stats: [
        { value: "Réel", label: "navigateur" },
        { value: "IA", label: "prompt exploitable" },
        { value: "0", label: "ligne de code" },
      ],
    },
    logoStrip: {
      stats: [
        "Parcours réels en navigateur",
        "Diagnostic d'impact par IA",
        "0 ligne de code à installer"
      ],
      items: [
        "Soumission de formulaires",
        "Clics morts & boutons cassés",
        "Liens cassés (404/500)",
        "Erreurs console JavaScript",
        "Requêtes réseau en échec",
        "QA responsive & mobile",
        "Moteur Playwright Chromium",
        "Diagnostic de cause racine par IA",
        "Historique & détection de régressions",
        "Next.js · Remix · Astro",
        "Shopify · Webflow · Stripe",
        "Aucun SDK requis"
      ]
    },
    howItWorks: {
      badge: "Comment ça marche",
      titleStart: "De l'URL au diagnostic",
      titleHighlight: "et au prompt de correction.",
      steps: [
        {
          label: "1. Entrez l'URL",
          title: "Ajoutez un site. Choisissez la profondeur.",
          body: "Renseignez votre URL, choisissez l'environnement (Production ou Staging) et la profondeur du scan : Rapide (pages clés), Standard ou Complet."
        },
        {
          label: "2. Playwright s'exécute",
          title: "Vrai navigateur. Vraies interactions.",
          body: "Playwright explore les pages accessibles et les interactions clés. Le réseau, la console et les captures d’écran servent de preuves."
        },
        {
          label: "3. L'IA analyse les preuves",
          title: "Preuves → diagnostic structuré.",
          body: "L’IA utilise les preuves collectées pour décrire l’impact, la cause probable, les étapes de reproduction et les incertitudes."
        },
        {
          label: "4. Copiez. Corrigez. Re-scannez.",
          title: "Utilisez le prompt, puis validez.",
          body: "Copiez le prompt de correction dans votre assistant de code, déployez puis relancez le scan. Qualio n’accède jamais à votre dépôt."
        }
      ]
    },
    features: {
      badge: "Fonctionnalités",
      titleStart: "Tout ce qu'il vous faut pour déployer",
      titleHighlight: "sans retenir votre souffle.",
      items: [
        {
          label: "Scanner",
          title: "Vrai navigateur.\nVraies interactions.",
          body: "Playwright explore les pages accessibles et les interactions clés. Pas de simples pings HTTP : de vraies actions avec capture du réseau et de la console.",
          metricLabel: "dans un vrai navigateur"
        },
        {
          label: "Intelligence",
          title: "Diagnostic par IA.\nPas des logs bruts.",
          body: "Impact, cause probable, niveau de confiance, reproduction et prompt de correction prêt à copier pour chaque problème.",
          metricLabel: "du bruit au signal utile"
        },
        {
          label: "Preuves réelles",
          title: "Capture d'écran +\nréseau + DOM.",
          body: "Chaque problème enregistre une capture d'écran, la cascade réseau et un instantané de la console. Des étapes de reproduction claires, prêtes à être partagées à l'équipe.",
          metricLabel: "types de preuves collectées"
        },
        {
          label: "Historique des scans",
          title: "Bugs résolus vs\nrégressions.",
          body: "Suivez ce qui a été corrigé et ce qui a sauté à chaque mise en ligne. Qualio devient le journal de bord de votre QA.",
          metricLabel: "historique complet"
        },
        {
          label: "Zéro config",
          title: "Une URL suffit.\nZéro code.",
          body: "Aucun SDK, aucune configuration complexe, aucune modification de votre code source. Ajoutez une URL et Qualio s'occupe de tout.",
          metricLabel: "ligne de code à installer"
        }
      ]
    },
    proofs: {
      detect: {
        eyebrow: "Ce que Qualio détecte",
        title: "Les erreurs que vos utilisateurs ressentent.",
        description: "Qualio suit de vrais parcours navigateur et repère les étapes qui bloquent une inscription, un formulaire ou une conversion.",
        items: ["Clics morts et CTA cassés", "Formulaires qui ne s'envoient pas", "Liens cassés et réponses 404/500", "Erreurs JavaScript qui affectent la page", "Requêtes réseau en échec et problèmes responsive"]
      },
      receive: {
        eyebrow: "Ce que vous recevez",
        title: "Des preuves directement exploitables.",
        description: "Chaque problème contient le contexte nécessaire pour le reproduire, le prioriser et vérifier sa correction après déploiement.",
        items: ["Capture d'écran de l'étape en échec", "Impact et étapes de reproduction", "Cause probable et niveau de confiance", "Prompt de correction prêt à copier", "Bugs résolus et nouvelles régressions après re-scan"]
      }
    },
    onboarding: {
      eyebrow: "Premier scan",
      title: "Obtenez votre premier signal QA.",
      description: "Ajoutez un site et Qualio le testera comme un vrai visiteur, puis vous conduira directement vers votre espace de travail.",
      siteName: "Nom du site",
      siteNamePlaceholder: "Acme Marketing",
      url: "URL ou nom de domaine",
      urlPlaceholder: "acme.com ou https://acme.com",
      urlHelp: "Un nom de domaine suffit. Nous le formaterons automatiquement.",
      environment: "Environnement",
      production: "Production",
      staging: "Staging",
      depth: "Profondeur du scan",
      quick: "Rapide",
      standard: "Standard",
      full: "Complet",
      recommended: "Recommandé",
      launch: "Lancer mon premier scan",
      checking: "Vérification du domaine…",
      creating: "Préparation de l’espace…",
      errorUrl: "Saisissez un nom de domaine ou une URL valide, par exemple acme.com.",
      errorGeneric: "Le scan n’a pas pu démarrer. Vérifiez l’URL puis réessayez.",
      browserEmpty: "L’aperçu de votre site apparaîtra ici",
      browserHint: "Saisissez un domaine pour préparer l’audit.",
      browserBlocked: "Ce site n’autorise pas l’aperçu intégré.",
      timelineTitle: "Scan Qualio",
      timelineReady: "Prêt à tester",
      timelineConnecting: "Connexion au site",
      timelineDiscovering: "Exploration des pages",
      timelineTesting: "Test des interactions réelles",
      timelineEvidence: "Collecte des preuves",
      timelineDiagnosis: "Préparation du diagnostic",
      timelineComplete: "Scan prêt",
      openDashboard: "Ouvrir le dashboard",
      consent: "Je confirme être autorisé à tester ce site.",
    },
    pricing: {
      badge: "Accès anticipé",
      titleStart: "Testez tout le parcours Qualio",
      titleHighlight: "pendant la finalisation des tarifs.",
      toggleMonthly: "Mensuel",
      toggleAnnual: "Annuel",
      mostPopularBadge: "Le plus populaire",
      accessLabel: "Gratuit pendant l’accès anticipé",
      footerNote: "Aucune carte bancaire · Les tarifs seront annoncés avant le lancement des offres payantes",
      plans: [
        {
          label: "Accès anticipé Qualio",
          desc: "Créez un compte, ajoutez un site, lancez un scan, consultez les preuves et copiez le prompt de correction généré.",
          cta: "Créer mon compte"
        }
      ],
      planFeatures: {
        sites: "Sites suivis",
        scansPerMonth: "Scans / mois",
        pagesPerScan: "Pages / scan",
        aiDiagnosis: "Diagnostic IA",
        evidence: "Preuves collectées",
        report: "Rapport client",
        beforeAfter: "Avant / Après",
        history: "Historique des scans",
        integrations: "Intégrations",
        prioritySupport: "Support prioritaire",
        reportTooltip: "Exportez le résultat complet du scan en PDF pour garder une trace claire de ce qui a été trouvé et corrigé.",
        beforeAfterTooltip: "Voyez la capture d'écran avant correction et après correction, côte à côte, pour tout incident résolu.",
        evidenceTooltip: "Captures d'écran, requêtes réseau, console et état du DOM autour de l'étape en échec."
      },
      planValues: {
        site: "Espace de travail par site",
        browserScan: "Scan dans un vrai navigateur",
        aiDiagnosis: "Diagnostic IA fondé sur les preuves",
        evidence: "Captures, réseau et console",
        fixPrompt: "Prompt de correction prêt à copier",
        scanHistory: "Historique et re-scan",
        unlimited: "Illimité",
        aiBasic: "Basique",
        aiFull: "Complet — impact + cause + correctif",
        aiFullPlus: "Complet + suivi des régressions",
        evidenceBasic: "Captures d'écran uniquement",
        evidenceFull: "Captures d'écran + Réseau + Console",
        evidenceVideo: "Capture + Réseau + Console",
        reportNone: "Dashboard uniquement",
        reportPdf: "Export PDF",
        reportShareable: "Dashboard uniquement",
        reportBranded: "Brandé + export PDF",
        historyStarter: "7 jours",
        historyPro: "90 jours + diffs",
        historyTeam: "1 an + diffs",
        supportTeam: "Canal dédié (Slack / Discord)"
      }
    },
    faq: {
      badge: "FAQ",
      titleStart: "Questions fréquentes sur",
      titleHighlight: "Qualio.",
      subtitle: "Vous ne trouvez pas votre réponse ?",
      items: [
        {
          q: "Est-ce que Qualio nécessite d'installer du code ou un SDK ?",
          a: "Non. Qualio fonctionne entièrement de l'extérieur. Vous renseignez une URL et notre moteur lance une vraie session de navigateur Playwright. Rien n'est installé dans votre codebase."
        },
        {
          q: "Que signifie exactement « vraies interactions en navigateur » ?",
          a: "Qualio ouvre les pages accessibles dans Chromium, teste des interactions sélectionnées et conserve les preuves utiles : requêtes, console, état du DOM et captures d'écran."
        },
        {
          q: "En quoi le diagnostic IA est-il différent de lire moi-même les erreurs console ?",
          a: "Les erreurs console vous disent juste ce qui a planté dans le code. L'IA de Qualio vous explique ce que ça implique pour vos utilisateurs, la cause probable du problème et son degré de certitude. Elle regroupe aussi les erreurs liées en un seul diagnostic pour traiter la cause racine, pas 40 symptômes."
        },
        {
          q: "Puis-je utiliser Qualio sur des environnements de staging ou de pré-production ?",
          a: "Oui. Vous pouvez configurer des profils de scan distincts pour vos URL de Production, de Staging et de Preview. Chaque environnement conserve son propre historique et ses comparaisons (diffs)."
        },
        {
          q: "À quelle fréquence puis-je lancer des scans ?",
          a: "Pendant l’accès anticipé, les scans sont disponibles sans offre payante. Les limites d’usage et les tarifs seront annoncés avant l’activation de la facturation."
        },
        {
          q: "Que se passe-t-il après avoir corrigé un bug ?",
          a: "Cliquez simplement sur « Re-scanner ». Qualio teste à nouveau votre site à jour et compare les résultats avec le scan précédent. Les problèmes corrigés sont marqués comme résolus (✓), et les nouveaux bugs apparaissent comme des régressions. L'historique complet est conservé."
        },
        {
          q: "Les données de mon site restent-elles confidentielles et protégées ?",
          a: "Qualio enregistre uniquement ce qu'un visiteur ordinaire peut observer dans son navigateur. Les preuves (captures d'écran, logs) sont chiffrées et cloisonnées par workspace, sans jamais être partagées entre comptes. Vous pouvez supprimer un workspace de scan à tout moment."
        }
      ]
    },
    footerDesc: "Votre espace QA pour le web. Vraies interactions en navigateur, diagnostic propulsé par l'IA.",
    auth: {
      password: { title: 'Bon retour', description: 'Connectez-vous à votre espace Qualio.' },
      register: { title: 'Créer un compte', description: 'Commencez à analyser votre site gratuitement.' },
      forgot: { title: 'Réinitialiser le mot de passe', description: 'Nous vous enverrons un lien par email.' },
      otp: { title: 'Connexion rapide', description: 'Recevez un code temporaire par email.' },
      otpVerify: { title: 'Vérifiez vos emails', description: 'Entrez le code à 6 chiffres reçu.' },
      verifyEmail: { title: 'Confirmez votre compte', description: 'Un lien de confirmation a été envoyé à votre adresse email.' },
      errors: {
        fillAll: 'Remplissez tous les champs',
        incorrect: 'Email ou mot de passe incorrect',
        signinFailed: 'Échec de la connexion',
        registerFailed: 'Échec de l\'inscription',
        tooManyAttempts: 'Trop de tentatives d\'inscription. Réessaie plus tard.',
        enterEmail: 'Entrez votre email',
        resetFailed: 'Échec de l\'envoi du lien',
        googleFailed: 'Échec de la connexion via Google',
        invalidCode: 'Code invalide ou expiré. Réessayez.'
      },
      success: {
        signedIn: 'Connecté avec succès',
        accountCreated: 'Compte créé ! Vérifiez vos emails pour confirmer.',
        resetSent: 'Lien envoyé — vérifiez vos emails'
      },
      labels: {
        email: 'Email',
        emailPlaceholder: 'vous@exemple.com',
        password: 'Mot de passe',
        passwordPlaceholderSignIn: '••••••••',
        passwordPlaceholderSignUp: 'Au moins 8 caractères',
        forgot: 'Mot de passe oublié ?',
        signIn: 'Se connecter',
        createAccount: 'Créer mon compte',
        sendReset: 'Envoyer le lien',
        backToSignIn: 'Retour à la connexion',
        sendCode: 'Envoyer le code',
        signInPasswordInstead: 'Se connecter avec un mot de passe',
        codeSentTo: 'Code envoyé à',
        resendCode: 'Renvoyer le code',
        signInOtp: 'Se connecter avec un code (OTP)',
        noAccount: 'Pas encore de compte ?',
        signUp: 'S\'inscrire',
        alreadyHave: 'Vous avez déjà un compte ?',
        termsPre: 'En continuant, vous acceptez nos',
        terms: 'CGV',
        and: 'et notre',
        privacy: 'Politique de confidentialité',
        continueWithGoogle: 'Continuer avec Google'
      },
      welcome: {
        title: 'Commencez par la bonne question QA',
        description: 'Dites à Qualio ce que vous voulez protéger en premier. Vous pourrez changer ce choix plus tard.',
        question: 'Que voulez-vous vérifier en premier ?',
        subtitle: 'Choisissez le parcours qui correspond le mieux à votre premier scan Qualio.',
        prompts: {
          publicSite: 'Mon site public',
          staging: 'Un environnement staging',
          regressions: 'Mes régressions critiques',
        },
        selected: 'Choix enregistré pour votre premier scan.',
        continue: 'Continuer vers la confirmation email',
      }
    }
  }
} as const;

export type Translations = typeof translations.en;
