export type Language = 'en' | 'fr';

export const translations = {
  en: {
    hero: {
      badge: "Your website QA workspace",
      titleStart: "Ship updates without",
      titleHighlight: "holding your breath.",
      description: "An AI agent tests your entire site in 60 seconds flat. Fix what matters, we handle the paranoia.",
      ctaPrimary: "Run your first scan",
      ctaSecondary: "Watch demo",
      stats: {
        checks: { value: "42+", label: "checks / scan" },
        speed: { value: "<60s", label: "first result" },
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
      buttonIdle: "Run free scan →",
      buttonLoading: "Scanning…",
      buttonDone: "Scan complete — view results",
      caption: "42 checks · AI diagnosis · ~60 seconds",
      checks: ["Links", "Buttons", "Forms", "Console", "Network", "Responsive"],
      stats: [
        { value: "<60s", label: "first result" },
        { value: "42+", label: "checks run" },
        { value: "0", label: "code changes" },
      ],
    },
    logoStrip: {
      stats: [
        "42+ live browser checks",
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
      titleHighlight: "diagnosis in 60 seconds.",
      steps: [
        {
          label: "Submit URL",
          title: "Add a site. Pick depth.",
          body: "Enter your URL, select environment (Production / Staging), and choose scan depth: Quick (key pages only), Standard, or Full."
        },
        {
          label: "Playwright runs",
          title: "Real browser. Full interaction.",
          body: "Playwright opens your site, clicks every CTA, submits every form, follows every link. Network and console captured throughout."
        },
        {
          label: "AI reads evidence",
          title: "40 errors → 5 diagnostics.",
          body: "AI receives screenshots, network logs, and DOM snapshots — and returns impact, cause, and confidence. Never invents causes."
        },
        {
          label: "Fix. Re-scan. Diff.",
          title: "Deploy. Re-scan. Verify.",
          body: "After your fix, click Re-scan. Qualio diffs the new results against the previous scan — resolved vs new regressions, instantly visible."
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
          body: "Playwright visits every page, clicks every CTA, submits every form. No synthetic pings — actual interaction with full network and console capture.",
          metricLabel: "checks per scan"
        },
        {
          label: "Intelligence",
          title: "AI diagnosis.\nNot logs.",
          body: "Impact, cause, confidence — per issue. AI receives raw browser evidence and explains the business consequence, not the stack trace.",
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
    pricing: {
      badge: "Pricing",
      titleStart: "Simple. No per-seat",
      titleHighlight: "surprises.",
      toggleMonthly: "Monthly",
      toggleAnnual: "Annual",
      mostPopularBadge: "Most popular",
      footerNote: "No credit card required for Starter · Cancel anytime",
      plans: [
        {
          label: "Starter",
          desc: "Run your first scan. No card required.",
          cta: "Start for free"
        },
        {
          label: "Pro",
          desc: "For teams shipping weekly.",
          cta: "Start 14-day trial"
        },
        {
          label: "Team",
          desc: "For larger orgs with multiple sites.",
          cta: "Start 14-day trial"
        }
      ],
      planFeatures: {
        sites: "Sites",
        scansPerMonth: "Scans / month",
        pagesPerScan: "Pages / scan",
        aiDiagnosis: "AI diagnosis",
        evidence: "Evidence",
        history: "History",
        integrations: "Integrations",
        prioritySupport: "Priority support"
      },
      planValues: {
        unlimited: "Unlimited",
        aiBasic: "Basic",
        aiFull: "Full — impact + cause + fix",
        aiFullPlus: "Full + regression tracking",
        evidenceBasic: "Screenshot only",
        evidenceFull: "Screenshot + Network + Console",
        evidenceVideo: "Full suite + video replay",
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
          a: "Qualio opens your pages in a headless Chromium browser, clicks every button that looks like a CTA, submits forms with test data, follows links, and records everything — network requests, console output, DOM state, screenshots. No synthetic HTTP pings."
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
          a: "On Pro and Team, unlimited scans. On Starter, 5 scans per month. You can trigger a scan manually at any time or set up a scheduled cadence (daily, weekly). CI/CD webhooks are on the Team roadmap."
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
      }
    }
  },
  fr: {
    hero: {
      badge: "Votre espace de QA pour le web",
      titleStart: "Déployez enfin sans",
      titleHighlight: "retenir votre souffle.",
      description: "Un agent teste l'intégralité de votre site en 60 secondes chrono. Corrigez ce qui compte, on gère la paranoïa.",
      ctaPrimary: "Lancer un premier scan",
      ctaSecondary: "Voir la démo",
      stats: {
        checks: { value: "42+", label: "tests / scan" },
        speed: { value: "<60s", label: "chrono" },
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
      description: "De vrais clics sur chaque page, un diagnostic clair en cas d'erreur, zéro ligne de code à installer. C'est tout.",
      inputLabel: "URL du site web",
      inputPlaceholder: "https://votre-site.com",
      buttonIdle: "Lancer le scan gratuit →",
      buttonLoading: "Scan en cours…",
      buttonDone: "Scan terminé — voir les résultats",
      caption: "42 vérifications · Diagnostic IA · ~60 secondes",
      checks: ["Liens", "Boutons", "Formulaires", "Console", "Réseau", "Responsive"],
      stats: [
        { value: "<60s", label: "premier résultat" },
        { value: "42+", label: "points vérifiés" },
        { value: "0", label: "ligne de code" },
      ],
    },
    logoStrip: {
      stats: [
        "42+ tests réels en navigateur",
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
      titleHighlight: "chirurgical en 60 secondes.",
      steps: [
        {
          label: "1. Entrez l'URL",
          title: "Ajoutez un site. Choisissez la profondeur.",
          body: "Renseignez votre URL, choisissez l'environnement (Production ou Staging) et la profondeur du scan : Rapide (pages clés), Standard ou Complet."
        },
        {
          label: "2. Playwright s'exécute",
          title: "Vrai navigateur. Vraies interactions.",
          body: "Playwright ouvre votre site, clique sur chaque bouton, remplit chaque formulaire et suit chaque lien. Les requêtes réseau et les logs console sont capturés."
        },
        {
          label: "3. L'IA analyse les preuves",
          title: "40 erreurs brutes → 5 diagnostics.",
          body: "L'IA analyse captures d'écran, logs réseau et DOM pour extraire l'impact utilisateur, la cause probable et son niveau de confiance. Zéro hallucination."
        },
        {
          label: "4. Re-scannez. Validez.",
          title: "Déployez. Re-scannez. Validez.",
          body: "Après votre correctif, cliquez sur Re-scanner. Qualio compare le nouveau scan avec le précédent : visualisez immédiatement ce qui est résolu et les éventuelles régressions."
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
          body: "Playwright visite chaque page, clique sur chaque bouton et teste chaque formulaire. Pas de simples pings HTTP : de vraies interactions avec capture complète du réseau et de la console.",
          metricLabel: "points vérifiés / scan"
        },
        {
          label: "Intelligence",
          title: "Diagnostic par IA.\nPas des logs bruts.",
          body: "Impact, cause, niveau de confiance : pour chaque bug. L'IA traite les preuves brutes et vous explique les conséquences réelles pour vos utilisateurs, pas une stack trace incompréhensible.",
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
    pricing: {
      badge: "Tarifs",
      titleStart: "Simple et transparent. Zéro mauvaise",
      titleHighlight: "surprise par utilisateur.",
      toggleMonthly: "Mensuel",
      toggleAnnual: "Annuel (-20%)",
      mostPopularBadge: "Le plus populaire",
      footerNote: "Aucune carte bancaire requise pour le plan Starter · Résiliation en 1 clic",
      plans: [
        {
          label: "Starter",
          desc: "Lancez votre premier scan. Aucune carte requise.",
          cta: "Commencer gratuitement"
        },
        {
          label: "Pro",
          desc: "Pour les équipes qui déploient chaque semaine.",
          cta: "Essai gratuit de 14 jours"
        },
        {
          label: "Team",
          desc: "Pour les équipes gérant plusieurs sites et apps.",
          cta: "Essai gratuit de 14 jours"
        }
      ],
      planFeatures: {
        sites: "Sites suivis",
        scansPerMonth: "Scans / mois",
        pagesPerScan: "Pages / scan",
        aiDiagnosis: "Diagnostic IA",
        evidence: "Preuves collectées",
        history: "Historique des scans",
        integrations: "Intégrations",
        prioritySupport: "Support prioritaire"
      },
      planValues: {
        unlimited: "Illimité",
        aiBasic: "Basique",
        aiFull: "Complet — impact + cause + correctif",
        aiFullPlus: "Complet + suivi des régressions",
        evidenceBasic: "Captures d'écran uniquement",
        evidenceFull: "Captures d'écran + Réseau + Console",
        evidenceVideo: "Suite complète + replay vidéo",
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
          a: "Qualio ouvre vos pages dans un navigateur Chromium réel, clique sur tous les boutons CTA, soumet les formulaires avec des données de test, suit les liens et enregistre tout : requêtes réseau, logs console, état du DOM et captures d'écran. Zéro simulation par pings superficiels."
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
          a: "Les forfaits Pro et Team incluent des scans illimités. Le forfait Starter en propose 5 par mois. Vous pouvez déclencher un scan manuellement quand vous le souhaitez ou planifier une fréquence automatique (quotidienne, hebdomadaire). L'intégration webhooks CI/CD arrive prochainement sur le plan Team."
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
      }
    }
  }
} as const;

export type Translations = typeof translations.en;
