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

const BASE_JOURNEY_TEMPLATES: JourneyTemplate[] = [
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
  {
    id: 'media-search', vertical: 'media', priority: 'P0', name: 'Recherche d’article',
    goal: 'Vérifier qu’un lecteur peut rechercher et ouvrir un contenu.', startUrl: '/',
    steps: [
      { name: 'Ouvrir le site', action: { type: 'navigate', target: '/' } },
      { name: 'Saisir une recherche', action: { type: 'fill', target: 'input[type="search"], input[name="q"], input[name="search"]', value: 'actualité' } },
      { name: 'Lancer la recherche', action: { type: 'submit', target: 'input[type="search"], input[name="q"], input[name="search"]' } },
      { name: 'Vérifier les articles', action: { type: 'assert' }, expectedResult: { selector: 'article, [data-testid="search-results"], [class*="article"]' } },
    ],
  },
  {
    id: 'marketplace-search', vertical: 'marketplace', priority: 'P0', name: 'Recherche et filtre',
    goal: 'Vérifier qu’un acheteur peut trouver une offre pertinente.', startUrl: '/',
    steps: [
      { name: 'Ouvrir la marketplace', action: { type: 'navigate', target: '/' } },
      { name: 'Rechercher une offre', action: { type: 'fill', target: 'input[type="search"], input[name="q"], input[name="search"]', value: 'service' } },
      { name: 'Valider la recherche', action: { type: 'submit', target: 'input[type="search"], input[name="q"], input[name="search"]' } },
      { name: 'Vérifier les résultats', action: { type: 'assert' }, expectedResult: { selector: '[data-testid="search-results"], [data-testid="listing"], article, .listing, .offer' } },
    ],
  },
  {
    id: 'other-primary-cta', vertical: 'other', priority: 'P0', name: 'CTA principal',
    goal: 'Vérifier que l’action principale du site mène à une destination fonctionnelle.', startUrl: '/',
    steps: [
      { name: 'Ouvrir la page d’accueil', action: { type: 'navigate', target: '/' } },
      { name: 'Vérifier le CTA principal', action: { type: 'wait', target: 'main a[href], main button, [data-testid="primary-cta"]' } },
      { name: 'Activer le CTA principal', action: { type: 'click', target: '[data-testid="primary-cta"], main a[href], main button' } },
      { name: 'Vérifier la destination', action: { type: 'assert' }, expectedResult: { url: '/' } },
    ],
  },
]

const ADDITIONAL_JOURNEY_TEMPLATES: JourneyTemplate[] = [
  {
    id: 'saas-create-core', vertical: 'saas', priority: 'P0', name: 'Créer l’élément clé',
    goal: 'Vérifier qu’un utilisateur connecté peut créer puis retrouver l’élément principal.', startUrl: '/dashboard',
    steps: [
      { name: 'Ouvrir l’espace connecté', action: { type: 'navigate', target: '/dashboard' } },
      { name: 'Ouvrir la création', action: { type: 'click', target: '[data-testid="create"], a[href*="new"], button:has-text("Créer")' } },
      { name: 'Renseigner le titre', action: { type: 'fill', target: 'input[name="name"], input[name="title"], textarea[name="title"]', value: 'Qualio test' } },
      { name: 'Créer l’élément', action: { type: 'submit', target: 'button[type="submit"], input[type="submit"]' }, expectedResult: { selector: '[data-testid="created-item"], [role="status"], .success' } },
    ],
  },
  {
    id: 'saas-forgot-password', vertical: 'saas', priority: 'P1', name: 'Mot de passe oublié',
    goal: 'Vérifier que la demande de réinitialisation donne une confirmation claire.', startUrl: '/connexion',
    steps: [
      { name: 'Ouvrir la connexion', action: { type: 'navigate', target: '/connexion' } },
      { name: 'Ouvrir la réinitialisation', action: { type: 'click', target: 'a[href*="forgot"], a[href*="reset"], button:has-text("oublié")' } },
      { name: 'Saisir l’adresse', action: { type: 'fill', target: 'input[type="email"], input[name="email"]', value: '{{secret:RESET_EMAIL}}' } },
      { name: 'Envoyer la demande', action: { type: 'submit', target: 'button[type="submit"], input[type="submit"]' }, expectedResult: { selector: '[role="status"], [role="alert"], [data-testid="reset-success"]' } },
    ],
  },
  {
    id: 'saas-upgrade', vertical: 'saas', priority: 'P1', name: 'Upgrade abonnement',
    goal: 'Vérifier que la sélection d’un plan atteint le paiement sandbox.', startUrl: '/pricing',
    steps: [
      { name: 'Ouvrir les plans', action: { type: 'navigate', target: '/pricing' } },
      { name: 'Choisir un plan', action: { type: 'click', target: '[data-testid="plan-pro"], a[href*="checkout"], button:has-text("Pro")' } },
      { name: 'Vérifier le paiement sandbox', action: { type: 'assert' }, expectedResult: { url: '/checkout' } },
    ],
  },
  {
    id: 'saas-invite', vertical: 'saas', priority: 'P2', name: 'Inviter un collaborateur',
    goal: 'Vérifier qu’une invitation peut être envoyée depuis l’espace connecté.', startUrl: '/dashboard',
    steps: [
      { name: 'Ouvrir les membres', action: { type: 'click', target: 'a[href*="team"], a[href*="members"], button:has-text("membre")' } },
      { name: 'Saisir l’adresse invitée', action: { type: 'fill', target: 'input[type="email"], input[name="email"]', value: '{{secret:INVITE_EMAIL}}' } },
      { name: 'Envoyer l’invitation', action: { type: 'submit', target: 'button[type="submit"], input[type="submit"]' }, expectedResult: { selector: '[role="status"], [data-testid="invite-success"]' } },
    ],
  },
  {
    id: 'ecommerce-product', vertical: 'ecommerce', priority: 'P0', name: 'Fiche produit',
    goal: 'Vérifier qu’une fiche produit expose image, prix et disponibilité.', startUrl: '/',
    steps: [
      { name: 'Ouvrir une fiche produit', action: { type: 'click', target: 'a[href*="product"], a[href*="produit"], [data-testid="product-card"] a' } },
      { name: 'Vérifier l’image', action: { type: 'assert' }, expectedResult: { selector: 'main img, [data-testid="product-image"]' } },
      { name: 'Vérifier le prix', action: { type: 'assert' }, expectedResult: { selector: '[data-testid="price"], .price, [class*="price"]' } },
      { name: 'Vérifier la disponibilité', action: { type: 'assert' }, expectedResult: { selector: '[data-testid="stock"], [class*="stock"], button:has-text("panier")' } },
    ],
  },
  {
    id: 'ecommerce-cart', vertical: 'ecommerce', priority: 'P0', name: 'Ajout au panier',
    goal: 'Vérifier que le panier se met à jour après l’ajout d’un produit.', startUrl: '/',
    steps: [
      { name: 'Ouvrir un produit', action: { type: 'click', target: 'a[href*="product"], a[href*="produit"], [data-testid="product-card"] a' } },
      { name: 'Ajouter au panier', action: { type: 'click', target: '[data-testid="add-to-cart"], button:has-text("panier")' } },
      { name: 'Vérifier le compteur', action: { type: 'assert' }, expectedResult: { selector: '[data-testid="cart-count"], [aria-label*="panier"], .cart-count' } },
    ],
  },
  {
    id: 'ecommerce-payment', vertical: 'ecommerce', priority: 'P0', name: 'Paiement test',
    goal: 'Vérifier qu’un paiement sandbox atteint une confirmation de commande.', startUrl: '/panier',
    steps: [
      { name: 'Ouvrir le panier', action: { type: 'navigate', target: '/panier' } },
      { name: 'Continuer vers le paiement', action: { type: 'click', target: 'a[href*="checkout"], button:has-text("commander"), button:has-text("paiement")' } },
      { name: 'Saisir l’email sandbox', action: { type: 'fill', target: 'input[type="email"], input[name="email"]', value: '{{secret:CHECKOUT_EMAIL}}' } },
      { name: 'Vérifier la confirmation', action: { type: 'assert' }, expectedResult: { selector: '[data-testid="order-confirmation"], [data-testid="order-number"], [role="status"]' } },
    ],
  },
  {
    id: 'ecommerce-promo', vertical: 'ecommerce', priority: 'P1', name: 'Code promo',
    goal: 'Vérifier qu’un code promo affiche un résultat explicite.', startUrl: '/panier',
    steps: [
      { name: 'Ouvrir le panier', action: { type: 'navigate', target: '/panier' } },
      { name: 'Saisir le code', action: { type: 'fill', target: 'input[name="coupon"], input[name="promo"], input[placeholder*="promo"]', value: 'TEST10' } },
      { name: 'Appliquer le code', action: { type: 'click', target: 'button:has-text("appliquer"), button:has-text("promo")' } },
      { name: 'Vérifier le résultat', action: { type: 'assert' }, expectedResult: { selector: '[role="status"], [role="alert"], [data-testid="discount"]' } },
    ],
  },
  {
    id: 'ecommerce-tracking', vertical: 'ecommerce', priority: 'P1', name: 'Suivi de commande',
    goal: 'Vérifier qu’une commande de test affiche son statut.', startUrl: '/suivi-commande',
    steps: [
      { name: 'Ouvrir le suivi', action: { type: 'navigate', target: '/suivi-commande' } },
      { name: 'Saisir la référence', action: { type: 'fill', target: 'input[name="order"], input[name="reference"]', value: '{{secret:ORDER_REFERENCE}}' } },
      { name: 'Rechercher la commande', action: { type: 'submit', target: 'button[type="submit"], input[type="submit"]' } },
      { name: 'Vérifier le statut', action: { type: 'assert' }, expectedResult: { selector: '[data-testid="order-status"], .order-status, [role="status"]' } },
    ],
  },
  {
    id: 'booking-complete', vertical: 'booking', priority: 'P0', name: 'Réservation complète',
    goal: 'Vérifier qu’une disponibilité peut être transformée en réservation de test.', startUrl: '/',
    steps: [
      { name: 'Rechercher une disponibilité', action: { type: 'submit', target: 'form button[type="submit"], form input[type="submit"]' } },
      { name: 'Choisir un créneau', action: { type: 'click', target: '[data-testid="availability-result"], .availability button, .booking-result button' } },
      { name: 'Saisir l’email', action: { type: 'fill', target: 'input[type="email"], input[name="email"]', value: '{{secret:BOOKING_EMAIL}}' } },
      { name: 'Vérifier la confirmation', action: { type: 'assert' }, expectedResult: { selector: '[data-testid="booking-confirmation"], [role="status"], .booking-confirmation' } },
    ],
  },
  {
    id: 'booking-cancel', vertical: 'booking', priority: 'P1', name: 'Annulation ou modification',
    goal: 'Vérifier qu’une réservation de test peut être retrouvée et modifiée.', startUrl: '/mes-reservations',
    steps: [
      { name: 'Ouvrir les réservations', action: { type: 'navigate', target: '/mes-reservations' } },
      { name: 'Saisir la référence', action: { type: 'fill', target: 'input[name="reference"], input[name="booking"]', value: '{{secret:BOOKING_REFERENCE}}' } },
      { name: 'Rechercher', action: { type: 'submit', target: 'button[type="submit"], input[type="submit"]' } },
      { name: 'Vérifier le statut', action: { type: 'assert' }, expectedResult: { selector: '[data-testid="booking-status"], .booking-status, [role="status"]' } },
    ],
  },
  {
    id: 'marketing-primary-cta', vertical: 'marketing', priority: 'P0', name: 'CTA principal',
    goal: 'Vérifier que l’action principale de la page d’accueil mène à la bonne destination.', startUrl: '/',
    steps: [
      { name: 'Ouvrir l’accueil', action: { type: 'navigate', target: '/' } },
      { name: 'Cliquer le CTA principal', action: { type: 'click', target: '[data-testid="primary-cta"], main a[href], main button' } },
      { name: 'Vérifier la destination', action: { type: 'assert' }, expectedResult: { url: '/contact' } },
    ],
  },
  {
    id: 'marketing-calendar', vertical: 'marketing', priority: 'P1', name: 'Prise de rendez-vous',
    goal: 'Vérifier que le module de prise de rendez-vous permet d’atteindre les créneaux.', startUrl: '/',
    steps: [
      { name: 'Ouvrir le rendez-vous', action: { type: 'click', target: 'a[href*="calendly"], a[href*="booking"], button:has-text("rendez-vous")' } },
      { name: 'Vérifier les créneaux', action: { type: 'assert' }, expectedResult: { selector: 'iframe, [data-testid="calendar"], [class*="calendar"]' } },
    ],
  },
  {
    id: 'marketing-legal', vertical: 'marketing', priority: 'P2', name: 'Pages légales',
    goal: 'Vérifier que les pages légales principales sont accessibles.', startUrl: '/',
    steps: [
      { name: 'Ouvrir les mentions', action: { type: 'click', target: 'a[href*="mentions"], a[href*="legal"], a[href*="privacy"]' } },
      { name: 'Vérifier le contenu', action: { type: 'assert' }, expectedResult: { selector: 'main, article, [role="main"]' } },
    ],
  },
  {
    id: 'media-reading', vertical: 'media', priority: 'P0', name: 'Lecture complète',
    goal: 'Vérifier qu’un article ou un média s’ouvre sans lecteur cassé ni erreur 404.', startUrl: '/',
    steps: [
      { name: 'Ouvrir un article', action: { type: 'click', target: 'article a, a[href*="article"], a[href*="post"]' } },
      { name: 'Vérifier le contenu', action: { type: 'assert' }, expectedResult: { selector: 'article, [data-testid="article-content"], main' } },
      { name: 'Vérifier le lecteur', action: { type: 'assert' }, expectedResult: { selector: 'video, audio, article, main' } },
    ],
  },
  {
    id: 'media-newsletter', vertical: 'media', priority: 'P1', name: 'Inscription newsletter',
    goal: 'Vérifier qu’un lecteur peut s’inscrire à la newsletter et reçoit une confirmation.', startUrl: '/',
    steps: [
      { name: 'Saisir l’email', action: { type: 'fill', target: 'input[type="email"], input[name="email"]', value: '{{secret:NEWSLETTER_EMAIL}}' } },
      { name: 'S’inscrire', action: { type: 'submit', target: 'button[type="submit"], input[type="submit"]' } },
      { name: 'Vérifier la confirmation', action: { type: 'assert' }, expectedResult: { selector: '[role="status"], [data-testid="newsletter-success"], .success' } },
    ],
  },
  {
    id: 'media-pagination', vertical: 'media', priority: 'P1', name: 'Pagination ou scroll infini',
    goal: 'Vérifier que l’accès au contenu suivant fonctionne.', startUrl: '/',
    steps: [
      { name: 'Charger le contenu suivant', action: { type: 'click', target: 'a[rel="next"], button:has-text("suivant"), button:has-text("charger")' } },
      { name: 'Vérifier le nouveau contenu', action: { type: 'assert' }, expectedResult: { selector: 'article, [data-testid="article-list"], [class*="article"]' } },
    ],
  },
  {
    id: 'marketplace-product', vertical: 'marketplace', priority: 'P0', name: 'Fiche produit ou vendeur',
    goal: 'Vérifier qu’une offre ou un vendeur affiche ses informations essentielles.', startUrl: '/',
    steps: [
      { name: 'Ouvrir une offre', action: { type: 'click', target: 'a[href*="product"], a[href*="listing"], [data-testid="listing"] a' } },
      { name: 'Vérifier les informations', action: { type: 'assert' }, expectedResult: { selector: 'main, article, [data-testid="listing-detail"]' } },
    ],
  },
  {
    id: 'marketplace-contact', vertical: 'marketplace', priority: 'P0', name: 'Mise en relation',
    goal: 'Vérifier qu’un acheteur peut contacter un vendeur ou confirmer une demande.', startUrl: '/',
    steps: [
      { name: 'Ouvrir une offre', action: { type: 'click', target: 'a[href*="listing"], [data-testid="listing"] a' } },
      { name: 'Contacter le vendeur', action: { type: 'click', target: '[data-testid="contact-seller"], button:has-text("contacter"), a[href*="contact"]' } },
      { name: 'Vérifier la confirmation', action: { type: 'assert' }, expectedResult: { selector: '[role="status"], [data-testid="contact-success"], form' } },
    ],
  },
  {
    id: 'marketplace-payment', vertical: 'marketplace', priority: 'P0', name: 'Paiement marketplace',
    goal: 'Vérifier qu’un paiement sandbox atteint une confirmation.', startUrl: '/panier',
    steps: [
      { name: 'Ouvrir le paiement', action: { type: 'navigate', target: '/panier' } },
      { name: 'Continuer', action: { type: 'click', target: 'a[href*="checkout"], button:has-text("payer"), button:has-text("commander")' } },
      { name: 'Vérifier la confirmation', action: { type: 'assert' }, expectedResult: { selector: '[data-testid="order-confirmation"], [role="status"]' } },
    ],
  },
]

export const JOURNEY_TEMPLATES: JourneyTemplate[] = [...BASE_JOURNEY_TEMPLATES, ...ADDITIONAL_JOURNEY_TEMPLATES]

export function getJourneyTemplates(vertical?: JourneyVertical): JourneyTemplate[] {
  return vertical ? JOURNEY_TEMPLATES.filter((template) => template.vertical === vertical) : JOURNEY_TEMPLATES
}

export function getJourneyCoverage(journeys: unknown, vertical: JourneyVertical): { configured: number; total: number; missing: JourneyTemplate[] } {
  const configuredNames = new Set(Array.isArray(journeys) ? journeys.map((journey) => typeof journey === 'object' && journey && 'name' in journey ? String(journey.name) : '') : [])
  const critical = getJourneyTemplates(vertical).filter((template) => template.priority === 'P0')
  const missing = critical.filter((template) => !configuredNames.has(template.name))
  return { configured: critical.length - missing.length, total: critical.length, missing }
}
