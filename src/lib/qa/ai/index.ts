/**
 * Qualio QA AI Engine — Structured Outputs, JSON Schema & System Prompt
 * Phase 1 Implementation for zero-hallucination test interpretation.
 */

// ─── 1. JSON Schema (Structured Outputs for LLM) ─────────────────────────────
export const QAAIDiagnosticSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Un titre court et explicite du bug, en majuscules (ex: FORMULAIRE DE PAIEMENT INUTILISABLE)',
    },
    severity: {
      type: 'string',
      enum: ['critical', 'major', 'minor'],
      description: 'critical si le parcours utilisateur est bloqué, major si c\'est un problème grave mais contournable, minor pour le reste.',
    },
    summary: {
      type: 'string',
      description: 'Le constat brut : ce qui s\'est passé concrètement, en une phrase.',
    },
    impact: {
      type: 'string',
      description: 'L\'impact métier ou utilisateur direct (ex: Les visiteurs ne peuvent pas acheter).',
    },
    probable_cause: {
      type: 'string',
      description: 'Hypothèse technique sur l\'origine du problème. Doit utiliser le conditionnel.',
    },
    recommendation: {
      type: 'string',
      description: 'Action suggérée pour le développeur afin de corriger ou investiguer le problème.',
    },
    confidence: {
      type: 'number',
      description: 'Score de certitude de l\'IA entre 0.0 et 1.0 (ex: 0.95).',
    },
  },
  required: [
    'title',
    'severity',
    'summary',
    'impact',
    'probable_cause',
    'recommendation',
    'confidence',
  ],
  additionalProperties: false,
} as const

export interface QAAIDiagnostic {
  title: string
  severity: 'critical' | 'major' | 'minor'
  summary: string
  impact: string
  probable_cause: string | null
  recommendation: string
  confidence: number // 0.0 to 1.0
  evidence?: {
    id: string
    type: 'playwright' | 'network' | 'console' | 'screenshot' | 'dom' | 'trace'
    reason: string
  }[]
  _meta?: {
    tokens_input?: number
    tokens_output?: number
    duration_ms?: number
    cost_usd?: number
    model?: string
  }
}

// ─── 2. System Prompt (Garde-fous Zéro-Hallucination) ────────────────────────
export const QUALIO_SYSTEM_PROMPT = `Tu es le moteur "Qualio QA AI Engine", un expert technique en assurance qualité web. Ton rôle est de traduire des rapports d'erreurs bruts issus de tests Playwright en diagnostics clairs, structurés et actionnables pour des développeurs et des Product Managers.

RÈGLES ABSOLUES (TOLÉRANCE ZÉRO) :
1. Aucune invention : Tu ne dois JAMAIS inventer un bug, une URL, ou un nom de variable qui n'est pas explicitement présent dans les "observed_facts". Si l'information n'y est pas, ne la devine pas.
2. Faits vs Hypothèses : Le champ "summary" ne doit contenir QUE des faits observés par Playwright. Le champ "probable_cause" contient ton analyse technique et DOIT être rédigé au conditionnel (ex: "Le serveur semble rejeter la requête, probablement car...").
3. Langage : Sois direct, professionnel et concis. Élimine le jargon inutile. Ne dis pas "Bonjour" ni "Voici le diagnostic". Retourne uniquement le JSON demandé.
4. Gestion de l'incertitude : Si le rapport d'erreur ne te permet pas de comprendre la cause technique exacte avec certitude, indique-le dans "probable_cause" (ex: "Cause exacte indéterminée côté client, une erreur serveur générique est retournée") et baisse ton score de "confidence" sous 0.70.`

// ─── 3. Evidence Payload Generator (Entrée normalisée) ──────────────────────
export interface EvidenceInputPayload {
  test_context: {
    url: string
    environment: string
    test_action: string
  }
  observed_facts: {
    status: string
    http_response?: number | null
    playwright_error?: string | null
    console_logs?: string[]
    network_request?: {
      url: string
      method: string
      status: number
      response?: unknown
    }
  }
}

export function buildEvidencePayload(params: {
  url: string
  environment?: string
  testAction?: string
  status?: string
  httpResponse?: number | null
  error?: string | null
  consoleLogs?: string[]
  networkRequest?: {
    url: string
    method: string
    status: number
    response?: unknown
  }
}): EvidenceInputPayload {
  return {
    test_context: {
      url: params.url,
      environment: params.environment || 'production',
      test_action: params.testAction || 'Exécution de scénario Playwright automatisé',
    },
    observed_facts: {
      status: params.status || 'failed',
      http_response: params.httpResponse ?? null,
      playwright_error: params.error || null,
      console_logs: params.consoleLogs || [],
      network_request: params.networkRequest,
    },
  }
}

// ─── 4. Parser & Formatter pour l'interface UI ──────────────────────────────
export function parseIssueDiagnostic(issue: {
  title: string
  severity: string
  description?: string | null
  suggestion?: string | null
  confidence?: string | number | null
  category?: string
  page?: { url: string } | null
}): QAAIDiagnostic {
  // If description is stored as JSON string from structured output
  if (issue.description) {
    try {
      const parsed = JSON.parse(issue.description)
      if (parsed && typeof parsed === 'object' && parsed.summary && parsed.impact) {
        return {
          title: (parsed.title || issue.title || '').toUpperCase(),
          severity: (parsed.severity || issue.severity || 'major').toLowerCase() as any,
          summary: parsed.summary,
          impact: parsed.impact,
          probable_cause: parsed.probable_cause,
          recommendation: parsed.recommendation || issue.suggestion || 'Vérifier la configuration du composant.',
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.94,
          _meta: parsed._meta
        }
      }
    } catch {
      // Not a JSON string, continue to fallback below
    }
  }

  // Fallback heuristic extraction guaranteeing the 4 business blocks
  const titleUpper = (issue.title || 'ANOMALIE DÉTECTÉE').toUpperCase()
  const rawSev = (issue.severity || 'major').toLowerCase()
  const severity = (['critical', 'major', 'minor'].includes(rawSev) ? rawSev : 'major') as 'critical' | 'major' | 'minor'
  const rawDesc = issue.description || 'Échec d\'assertion Playwright lors de l\'exécution du test.'
  const category = (issue.category || 'navigation').toLowerCase()

  // Format confidence
  let confidence = 0.94
  if (typeof issue.confidence === 'number') {
    confidence = issue.confidence > 1 ? issue.confidence / 100 : issue.confidence
  } else if (typeof issue.confidence === 'string') {
    const num = parseFloat(issue.confidence)
    if (!isNaN(num)) {
      confidence = num > 1 ? num / 100 : num
    } else if (issue.confidence === 'high') {
      confidence = 0.96
    } else if (issue.confidence === 'medium') {
      confidence = 0.82
    } else if (issue.confidence === 'low') {
      confidence = 0.65
    }
  }

  // Deduce the 4 distinct business blocks according to category and severity
  let impact = 'Perturbation de l\'expérience utilisateur et risque d\'abandon de parcours.'
  let probableCause = 'Le composant semble ne pas recevoir les données attendues ou rencontrer un timeout réseau.'
  let recommendation = issue.suggestion || 'Inspecter les appels réseau et les gestionnaires d\'événements du sélecteur.'

  if (category.includes('form') || titleUpper.includes('PAIEMENT') || titleUpper.includes('FORMULAIRE')) {
    impact = 'Blocage direct du tunnel de conversion ou d\'enregistrement. Perte d\'inscriptions ou de chiffre d\'affaires direct.'
    probableCause = 'Le serveur pourrait rejeter la soumission (erreur HTTP 4xx/5xx) ou un champ obligatoire attendu par l\'API serait manquant dans le payload frontend.'
    recommendation = issue.suggestion || 'Vérifier le payload réseau envoyé lors du clic sur le bouton de soumission et inspecter les validations serveur.'
  } else if (category.includes('link') || titleUpper.includes('404') || titleUpper.includes('LIEN')) {
    impact = 'Navigation rompue pour l\'utilisateur arrivant sur une page d\'erreur 404.'
    probableCause = 'L\'URL cible pourrait être mal typée dans le lien ou la route a été déplacée sans redirection 301.'
    recommendation = issue.suggestion || 'Mettre à jour l\'attribut href du lien ou configurer une redirection serveur.'
  } else if (category.includes('console') || titleUpper.includes('CONSOLE') || titleUpper.includes('JAVASCRIPT')) {
    impact = 'Dégradation potentielle des fonctionnalités interactives ou arrêt de scripts tiers (analytics, tracking).'
    probableCause = 'Une variable non définie (TypeError) ou une ressource bloquée par CORS pourrait interrompre le fil d\'exécution.'
    recommendation = issue.suggestion || 'Corriger la référence non sécurisée ou vérifier les règles de sécurité CORS de l\'hôte.'
  } else if (category.includes('responsive') || titleUpper.includes('MOBILE') || titleUpper.includes('OVERFLOW')) {
    impact = 'Débordement horizontal sur petits écrans, rendant la lecture ou le clic difficile pour les utilisateurs sur mobile.'
    probableCause = 'Un conteneur parent aurait une largeur fixe en pixels (`width: ...px`) au lieu d\'un dimensionnement fluide (`w-full` ou `max-w-*`).'
    recommendation = issue.suggestion || 'Remplacer les dimensions fixes par des classes responsive et appliquer `overflow-x-hidden` si nécessaire.'
  }

  return {
    title: titleUpper,
    severity,
    summary: rawDesc,
    impact,
    probable_cause: probableCause,
    recommendation,
    confidence,
  }
}
