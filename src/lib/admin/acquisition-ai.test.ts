import { afterEach, describe, expect, it, vi } from 'vitest'

const generateContent = vi.hoisted(() => vi.fn())

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(function GoogleGenAI() {
    return { models: { generateContent } }
  }),
  Type: { OBJECT: 'OBJECT', ARRAY: 'ARRAY', STRING: 'STRING', INTEGER: 'INTEGER' },
}))

import {
  cleanDomain,
  dedupeCompanies,
  discoverCompaniesWithAi,
  extractCompaniesJson,
  isParkedHtml,
} from '@/lib/admin/acquisition-ai'

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('cleanDomain', () => {
  it('nettoie les URLs complètes, www et ponctuation finale', () => {
    expect(cleanDomain('https://www.Studio-UX.fr/contact?ref=1).')).toBe('studio-ux.fr')
    expect(cleanDomain('http://pennylane.com:443/fr')).toBe('pennylane.com')
  })

  it('bloque les réseaux sociaux, annuaires et plateformes d’avis', () => {
    for (const blocked of [
      'linkedin.com',
      'fr.trustpilot.com',
      'www.g2.com',
      'capterra.fr',
      'malt.fr',
      'sortlist.fr',
      'pappers.fr',
      'apps.apple.com',
    ]) {
      expect(cleanDomain(blocked)).toBeNull()
    }
  })
})

describe('isParkedHtml', () => {
  it('détecte les pages de domaines en vente ou parqués', () => {
    expect(isParkedHtml('<html><body><h1>This domain is for sale</h1></body></html>')).toBe(true)
    expect(isParkedHtml('<div>Ce nom de domaine est en vente sur SedoParking</div>')).toBe(true)
    expect(isParkedHtml('<html><body><h1>Agence digitale Sowink à Lyon</h1></body></html>')).toBe(false)
  })
})

describe('extractCompaniesJson', () => {
  it('extrait le JSON même entouré de texte et de citations Google Search', () => {
    const groundedText = `Voici les agences francophones actives trouvées sur le web [1][2] :

{
  "companies": [
    {
      "name": "Studio Produit",
      "domain": "studio-produit.fr",
      "city": "Lyon",
      "country": "France",
      "relevance_reason": "Livre des apps mobiles clients avec suivi UX.",
    }
  ]
}

Sources vérifiées via Google.`

    const parsed = extractCompaniesJson(groundedText)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].name).toBe('Studio Produit')
    expect(parsed[0].domain).toBe('studio-produit.fr')
  })

  it('extrait proprement un bloc markdown ```json', () => {
    const md = '```json\n{"companies":[{"name":"Asphalte","domain":"asphalte.com","city":"Bordeaux","country":"France","relevance_reason":"Avis Trustpilot"}]}\n```'
    const parsed = extractCompaniesJson(md)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].domain).toBe('asphalte.com')
  })
})

describe('dedupeCompanies', () => {
  it('élimine les doublons internes au lot ainsi que les domaines déjà en base', () => {
    const list = dedupeCompanies(
      [
        { name: 'Agence A', domain: 'https://www.agence-a.fr/', city: 'Paris', country: 'France', relevance_reason: 'UX' },
        { name: 'Agence A bis', domain: 'AGENCE-A.FR', city: 'Paris', country: 'France', relevance_reason: 'UX' },
        { name: 'Déjà Connu', domain: 'deja-connu.fr', city: 'Lyon', country: 'France', relevance_reason: 'SaaS' },
        { name: 'Nouveau SaaS', domain: 'nouveau-saas.io', city: 'Nantes', country: 'France', relevance_reason: 'Avis G2' },
      ],
      ['https://deja-connu.fr'],
    )

    expect(list.map((c) => c.domain)).toEqual(['agence-a.fr', 'nouveau-saas.io'])
  })
})

describe('discoverCompaniesWithAi', () => {
  it('passe les domaines exclus au prompt, bascule d’un .com parqué vers le .fr actif et évite les doubles parenthèses', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key')

    generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        companies: [
          {
            name: 'Sowink',
            domain: 'sowink.com',
            city: 'Bordeaux',
            country: 'France',
            company_size: 'PME',
            relevance_reason: 'Agence digitale accompagnant des PME sur leurs sites.',
          },
        ],
      }),
    })

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('sowink.com')) {
        return new Response('<html><body>This domain is for sale</body></html>', { status: 200 })
      }
      if (url.includes('sowink.fr')) {
        return new Response('<html><body>Bienvenue chez Sowink</body></html>', { status: 200 })
      }
      return new Response('Not found', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const res = await discoverCompaniesWithAi({
      target: 'Agences UX/UI',
      location: 'Bordeaux',
      limit: 10,
      excludeDomains: ['littlebigcode.fr', 'ancien-client.fr'],
    })

    expect(generateContent).toHaveBeenCalledTimes(1)
    const callArg = generateContent.mock.calls[0][0]
    expect(callArg.model).toBe('gemini-3.8-flash')
    expect(JSON.stringify(callArg.contents)).toContain('littlebigcode.fr')
    expect(res.provider).toBe('Gemini · Recherche Web')
    expect(res.companies).toHaveLength(1)
    expect(res.companies[0].domain).toBe('sowink.fr')
  })
})
