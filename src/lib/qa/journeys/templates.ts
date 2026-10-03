import type { JourneyDefinition } from '@/lib/qa/types'

export type JourneyVertical = 'saas' | 'ecommerce' | 'booking' | 'marketing' | 'media' | 'marketplace' | 'other'

export interface JourneyTemplate extends JourneyDefinition {
  id: string
  vertical: JourneyVertical
  priority: 'P0' | 'P1' | 'P2'
  goal: string
}

const loginTemplate: JourneyTemplate = {
  id: 'saas-login',
  vertical: 'saas',
  priority: 'P0',
  name: 'Connexion',
  goal: 'Vérifier qu’un utilisateur peut se connecter et atteindre son espace.',
  startUrl: '/connexion',
  steps: [
    { name: 'Ouvrir la page de connexion', action: { type: 'navigate', target: '/connexion' } },
    { name: 'Vérifier le formulaire', action: { type: 'wait', target: 'input[type="email"], input[name="email"]' } },
    { name: 'Saisir l’adresse de test', action: { type: 'fill', target: 'input[type="email"], input[name="email"]', value: '{{secret:LOGIN_EMAIL}}' } },
    { name: 'Saisir le mot de passe de test', action: { type: 'fill', target: 'input[type="password"], input[name="password"]', value: '{{secret:LOGIN_PASSWORD}}' } },
    { name: 'Envoyer le formulaire', action: { type: 'submit', target: 'button[type="submit"], input[type="submit"]', waitFor: '**/dashboard**' }, expectedResult: { url: '/dashboard' } },
  ],
}

export const JOURNEY_TEMPLATES: JourneyTemplate[] = [
  loginTemplate,
  {
    id: 'saas-signup', vertical: 'saas', priority: 'P0', name: 'Inscription',
    goal: 'Vérifier qu’un nouveau compte peut être créé avec des données de test.', startUrl: '/inscription',
    steps: [
      { name: 'Ouvrir l’inscription', action: { type: 'navigate', target: '/inscription' } },
      { name: 'Vérifier le formulaire', action: { type: 'wait', target: 'form' } },
      { name: 'Saisir l’adresse de test', action: { type: 'fill', target: 'input[type="email"], input[name="email"]', value: '{{secret:SIGNUP_EMAIL}}' } },
      { name: 'Saisir le mot de passe de test', action: { type: 'fill', target: 'input[type="password"], input[name="password"]', value: '{{secret:SIGNUP_PASSWORD}}' } },
      { name: 'Envoyer l’inscription', action: { type: 'submit', target: 'button[type="submit"], input[type="submit"]' }, expectedResult: { selector: '[data-testid="signup-success"], [role="alert"]' } },
    ],
  },
  {
    id: 'marketing-contact', vertical: 'marketing', priority: 'P0', name: 'Formulaire de contact',
    goal: 'Vérifier qu’un visiteur peut envoyer une demande de contact.', startUrl: '/',
    steps: [
      { name: 'Ouvrir la page d’accueil', action: { type: 'navigate', target: '/' } },
      { name: 'Ouvrir le contact', action: { type: 'click', target: 'a[href*="contact"], a[href*="demo"], button:has-text("Contact")' } },
      { name: 'Vérifier le formulaire', action: { type: 'wait', target: 'form' } },
      { name: 'Saisir l’adresse de test', action: { type: 'fill', target: 'input[type="email"], input[name="email"]', value: '{{secret:CONTACT_EMAIL}}' } },
      { name: 'Envoyer la demande', action: { type: 'submit', target: 'button[type="submit"], input[type="submit"]' }, expectedResult: { selector: '[data-testid="form-success"], [role="status"], .success' } },
    ],
  },
  {
    id: 'ecommerce-search', vertical: 'ecommerce', priority: 'P0', name: 'Recherche produit',
    goal: 'Vérifier qu’une recherche produit renvoie des résultats.', startUrl: '/',
    steps: [
      { name: 'Ouvrir la page d’accueil', action: { type: 'navigate', target: '/' } },
      { name: 'Saisir une recherche', action: { type: 'fill', target: 'input[type="search"], input[name="q"], input[name="search"]', value: 'produit' } },
      { name: 'Envoyer la recherche', action: { type: 'submit', target: 'input[type="search"], input[name="q"], input[name="search"]' } },
      { name: 'Vérifier les résultats', action: { type: 'assert' }, expectedResult: { selector: '[data-testid="search-results"], .product-card, [class*="result"]' } },
    ],
  },
  {
    id: 'booking-availability', vertical: 'booking', priority: 'P0', name: 'Recherche de disponibilité',
    goal: 'Vérifier que la recherche de disponibilité affiche un résultat.', startUrl: '/',
    steps: [
      { name: 'Ouvrir la page de réservation', action: { type: 'navigate', target: '/' } },
      { name: 'Vérifier le formulaire', action: { type: 'wait', target: 'form' } },
      { name: 'Lancer la recherche', action: { type: 'submit', target: 'form button[type="submit"], form input[type="submit"]' } },
      { name: 'Vérifier les disponibilités', action: { type: 'assert' }, expectedResult: { selector: '[data-testid="availability-results"], .availability, .booking-result' } },
    ],
  },
]

export function getJourneyTemplates(vertical?: JourneyVertical): JourneyTemplate[] {
  return vertical ? JOURNEY_TEMPLATES.filter((template) => template.vertical === vertical) : JOURNEY_TEMPLATES
}

export function getJourneyCoverage(journeys: unknown, vertical: JourneyVertical): { configured: number; total: number; missing: JourneyTemplate[] } {
  const configuredNames = new Set(Array.isArray(journeys) ? journeys.map((journey) => typeof journey === 'object' && journey && 'name' in journey ? String(journey.name) : '') : [])
  const critical = getJourneyTemplates(vertical).filter((template) => template.priority === 'P0')
  const missing = critical.filter((template) => !configuredNames.has(template.name))
  return { configured: critical.length - missing.length, total: critical.length, missing }
}
