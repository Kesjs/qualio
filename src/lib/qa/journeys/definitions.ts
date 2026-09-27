import type { JourneyDefinition } from '@/lib/qa/types'

/**
 * Journey de test : Login simple
 * Ce journey devrait réussir si la page de login existe et répond correctement
 */
export const JOURNEY_LOGIN: JourneyDefinition = {
  name: 'User Login Flow',
  steps: [
    {
      name: 'Navigate to Login Page',
      action: {
        type: 'navigate',
        target: '/login',
        details: {
          waitUntil: 'networkidle'
        }
      }
    },
    {
      name: 'Check Login Form Exists',
      action: {
        type: 'wait',
        target: 'form[action*="login"], input[name="email"], input[type="email"]',
        details: {
          timeout: 5000
        }
      }
    },
    {
      name: 'Fill Email Field',
      action: {
        type: 'fill',
        target: 'input[name="email"], input[type="email"]',
        details: {
          value: 'test@qualio.app'
        }
      }
    },
    {
      name: 'Fill Password Field',
      action: {
        type: 'fill',
        target: 'input[name="password"], input[type="password"]',
        details: {
          value: 'TestPassword123!'
        }
      }
    },
    {
      name: 'Click Submit Button',
      action: {
        type: 'click',
        target: 'button[type="submit"], input[type="submit"]'
      }
    },
    {
      name: 'Wait for Response',
      action: {
        type: 'wait',
        target: 'body',
        details: {
          timeout: 3000
        }
      }
    }
  ]
}

/**
 * Journey de test : Checkout complet
 * Ce journey contient des étapes qui pourraient échouer (intentionnellement pour tester les screenshots)
 */
export const JOURNEY_CHECKOUT: JourneyDefinition = {
  name: 'Complete Checkout Flow',
  steps: [
    {
      name: 'Navigate to Products',
      action: {
        type: 'navigate',
        target: '/products'
      }
    },
    {
      name: 'Click First Product',
      action: {
        type: 'click',
        target: '.product-card:first-child a, [data-testid="product-link"]:first-child'
      }
    },
    {
      name: 'Add to Cart',
      action: {
        type: 'click',
        target: 'button:has-text("Add to Cart"), [data-testid="add-to-cart"]'
      }
    },
    {
      name: 'Navigate to Cart',
      action: {
        type: 'navigate',
        target: '/cart'
      }
    },
    {
      name: 'Proceed to Checkout',
      action: {
        type: 'click',
        target: 'button:has-text("Checkout"), a[href*="checkout"]'
      }
    },
    {
      name: 'Fill Shipping Address',
      action: {
        type: 'fill',
        target: 'input[name="address"]',
        details: {
          value: '123 Test Street'
        }
      }
    },
    {
      name: 'Fill City',
      action: {
        type: 'fill',
        target: 'input[name="city"]',
        details: {
          value: 'Paris'
        }
      }
    },
    {
      name: 'Fill Postal Code',
      action: {
        type: 'fill',
        target: 'input[name="postal_code"], input[name="zip"]',
        details: {
          value: '75001'
        }
      }
    },
    {
      name: 'Submit Order',
      action: {
        type: 'click',
        target: 'button[type="submit"]:has-text("Place Order")'
      }
    },
    {
      name: 'Verify Order Confirmation',
      action: {
        type: 'assert',
        target: '.order-confirmation, [data-testid="order-success"]',
        details: {
          expected: 'visible'
        }
      }
    }
  ]
}

/**
 * Journey de test : Signup simple
 */
export const JOURNEY_SIGNUP: JourneyDefinition = {
  name: 'New User Signup',
  steps: [
    {
      name: 'Navigate to Signup',
      action: {
        type: 'navigate',
        target: '/signup'
      }
    },
    {
      name: 'Fill Name',
      action: {
        type: 'fill',
        target: 'input[name="name"], input[name="full_name"]',
        details: {
          value: 'Test User'
        }
      }
    },
    {
      name: 'Fill Email',
      action: {
        type: 'fill',
        target: 'input[name="email"]',
        details: {
          value: 'newuser@qualio.app'
        }
      }
    },
    {
      name: 'Fill Password',
      action: {
        type: 'fill',
        target: 'input[name="password"]',
        details: {
          value: 'SecurePassword123!'
        }
      }
    },
    {
      name: 'Fill Confirm Password',
      action: {
        type: 'fill',
        target: 'input[name="confirm_password"], input[name="password_confirmation"]',
        details: {
          value: 'SecurePassword123!'
        }
      }
    },
    {
      name: 'Accept Terms',
      action: {
        type: 'click',
        target: 'input[type="checkbox"][name="terms"], input[name="accept_terms"]'
      }
    },
    {
      name: 'Submit Signup Form',
      action: {
        type: 'click',
        target: 'button[type="submit"]'
      }
    }
  ]
}

/**
 * Journey intentionnellement cassé pour tester la capture de screenshot sur FAIL
 */
export const JOURNEY_BROKEN_TEST: JourneyDefinition = {
  name: 'Intentionally Broken Flow (Test)',
  steps: [
    {
      name: 'Navigate to Home',
      action: {
        type: 'navigate',
        target: '/'
      }
    },
    {
      name: 'This Step Will Pass',
      action: {
        type: 'wait',
        target: 'body',
        details: {
          timeout: 1000
        }
      }
    },
    {
      name: 'This Step Will FAIL - Selector Does Not Exist',
      action: {
        type: 'click',
        target: '#this-selector-absolutely-does-not-exist-12345'
      }
    },
    {
      name: 'This Step Will Be NOT_REACHED',
      action: {
        type: 'navigate',
        target: '/about'
      }
    },
    {
      name: 'This Step Also NOT_REACHED',
      action: {
        type: 'wait',
        target: 'body'
      }
    }
  ]
}

/**
 * Liste complète des journeys disponibles
 */
export const ALL_JOURNEYS: JourneyDefinition[] = [
  JOURNEY_LOGIN,
  JOURNEY_CHECKOUT,
  JOURNEY_SIGNUP,
  JOURNEY_BROKEN_TEST
]

/**
 * Récupérer un journey par nom
 */
export function getJourneyByName(name: string): JourneyDefinition | undefined {
  return ALL_JOURNEYS.find(j => j.name === name)
}

/**
 * Récupérer tous les noms de journeys
 */
export function getJourneyNames(): string[] {
  return ALL_JOURNEYS.map(j => j.name)
}
