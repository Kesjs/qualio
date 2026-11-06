import { GoogleGenAI, Type, type Schema } from '@google/genai'
import { createOpenAiCompletion, getGeminiModelCandidates } from '@/lib/feedback/ai'

export type DiscoveredAiCompany = {
  name: string
  domain: string
  city: string
  country: string
  contact_email?: string
  relevance_reason: string
  company_size?: 'TPE' | 'PME' | 'ETI'
}

const aiCompanySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    companies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          domain: { type: Type.STRING },
          city: { type: Type.STRING },
          country: { type: Type.STRING },
          relevance_reason: { type: Type.STRING },
          company_size: { type: Type.STRING, enum: ['TPE', 'PME', 'ETI'] },
        },
        required: ['name', 'domain', 'city', 'country', 'relevance_reason'],
      },
    },
  },
  required: ['companies'],
}

const openAiCompanySchema = {
  type: 'object',
  properties: {
    companies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          domain: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
          relevance_reason: { type: 'string' },
          company_size: { type: 'string', enum: ['TPE', 'PME', 'ETI'] },
        },
        required: ['name', 'domain', 'city', 'country', 'relevance_reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['companies'],
  additionalProperties: false,
} as const

const BLOCKED_DOMAINS = [
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'google.com',
  'google.fr',
  'apple.com',
  'microsoft.com',
  'amazon.com',
  'amazon.fr',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'youtube.com',
  'trustpilot.com',
  'g2.com',
  'capterra.com',
  'capterra.fr',
  'producthunt.com',
  'medium.com',
  'substack.com',
  'github.com',
  'gitlab.com',
  'notion.so',
  'figma.com',
  'wikipedia.org',
  'societe.com',
  'pappers.fr',
  'verif.com',
  'infogreffe.fr',
  'malt.fr',
  'sortlist.fr',
  'sortlist.com',
  'clutch.co',
  'shopify.com',
  'wordpress.org',
  'wordpress.com',
  'wix.com',
  'webflow.io',
  'linktr.ee',
  'typeform.com',
  'calendly.com',
]

export function cleanDomain(input: string | null | undefined): string | null {
  if (!input) return null
  let host = String(input).trim().toLowerCase()
  host = host
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .split(':')[0]
    .replace(/[),.;]+$/, '')
    .trim()
  if (!/^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(host)) return null
  if (BLOCKED_DOMAINS.some((b) => host === b || host.endsWith(`.${b}`))) return null
  return host
}

const PARKED_URL_INDICATORS = [
  'hugedomains.com',
  'dan.com',
  'sedo.com',
  'sedoparking.com',
  'afternic.com',
  'godaddy.com',
  'domainmarket.com',
  'namecheap.com',
  'bodis.com',
  'parkingcrew.net',
  'above.com',
  'sav.com',
]

const PARKED_HTML_REGEX =
  /this domain (?:name )?is for sale|buy this domain|ce (?:nom de )?domaine est en vente|domaine à vendre|sedoparking|parkingcrew|hugedomains\.com|afternic\.com|forsalelander|domain parking/i

export function isParkedHtml(snippet: string): boolean {
  if (!snippet) return false
  return PARKED_HTML_REGEX.test(snippet)
}

async function readHtmlSnippet(res: Response, maxBytes = 16_384): Promise<string> {
  if (!res.body) return ''
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let total = 0
  let out = ''
  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read()
      if (done || !value) break
      total += value.byteLength
      out += decoder.decode(value, { stream: true })
    }
  } catch {
    /* stream interrupted */
  } finally {
    try {
      await reader.cancel()
    } catch {
      /* ignore cancel error */
    }
  }
  return out
}

async function checkUrlAlive(url: string, timeoutMs: number): Promise<boolean> {
  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': userAgent, Accept: 'text/html,application/xhtml+xml,*/*' },
    signal: AbortSignal.timeout(timeoutMs),
    redirect: 'follow',
    cache: 'no-store',
  })

  if (res.status >= 400 && ![401, 403, 405, 429].includes(res.status)) return false
  const finalUrl = (res.url || url).toLowerCase()
  if (PARKED_URL_INDICATORS.some((parked) => finalUrl.includes(parked))) return false

  if (res.status >= 200 && res.status < 300) {
    const snippet = await readHtmlSnippet(res)
    if (isParkedHtml(snippet)) return false
  } else {
    try {
      await res.body?.cancel()
    } catch {
      /* ignore */
    }
  }

  return true
}

/**
 * Vérifie en direct si le domaine existe, répond, et n'est PAS une page de parking / vente de domaine.
 */
export async function isDomainAlive(domain: string): Promise<boolean> {
  const host = cleanDomain(domain)
  if (!host) return false

  try {
    return await checkUrlAlive(`https://${host}`, 3800)
  } catch {
    try {
      return await checkUrlAlive(`http://${host}`, 2200)
    } catch {
      return false
    }
  }
}

/**
 * Déduplique les candidats par domaine normalisé et écarte ceux déjà en base.
 */
export function dedupeCompanies(
  companies: DiscoveredAiCompany[],
  excludeDomains?: Iterable<string>,
): DiscoveredAiCompany[] {
  const excluded = new Set<string>()
  for (const dom of excludeDomains ?? []) {
    const cleaned = cleanDomain(dom)
    if (cleaned) excluded.add(cleaned)
  }

  const seen = new Set<string>()
  const unique: DiscoveredAiCompany[] = []

  for (const raw of companies) {
    const domain = cleanDomain(raw.domain)
    const name = String(raw.name ?? '').trim()
    if (!name || !domain) continue
    if (excluded.has(domain) || seen.has(domain)) continue
    seen.add(domain)
    unique.push({
      name,
      domain,
      city: String(raw.city ?? '').trim() || 'France',
      country: String(raw.country ?? '').trim() || 'France',
      relevance_reason: String(raw.relevance_reason ?? '').trim() || 'Équipe produit ou digitale susceptible de centraliser ses avis clients.',
      company_size: raw.company_size === 'TPE' || raw.company_size === 'PME' || raw.company_size === 'ETI' ? raw.company_size : undefined,
    })
  }

  return unique
}

/**
 * Extrait de façon robuste la liste d'entreprises depuis une réponse LLM,
 * même lorsque Google Search entoure le JSON de texte explicatif, citations ou blocs Markdown.
 */
export function extractCompaniesJson(rawText: string): DiscoveredAiCompany[] {
  if (!rawText || !rawText.trim()) return []
  const trimmed = rawText.trim()

  const candidates: string[] = []

  // 1. Blocs markdown ```json ... ```
  for (const match of trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/gi)) {
    if (match[1]?.trim()) candidates.push(match[1].trim())
  }

  // 2. Texte complet direct
  candidates.push(trimmed)

  // 3. Extraction équilibrée du premier objet {...} ou tableau [...] contenant "domain"
  const extractBalanced = (text: string, openChar: '{' | '[', closeChar: '}' | ']') => {
    for (let start = text.indexOf(openChar); start !== -1; start = text.indexOf(openChar, start + 1)) {
      let depth = 0
      let inString = false
      let escaped = false
      for (let i = start; i < text.length; i += 1) {
        const ch = text[i]
        if (escaped) {
          escaped = false
          continue
        }
        if (ch === '\\' && inString) {
          escaped = true
          continue
        }
        if (ch === '"') {
          inString = !inString
          continue
        }
        if (inString) continue
        if (ch === openChar) depth += 1
        else if (ch === closeChar) {
          depth -= 1
          if (depth === 0) {
            const slice = text.slice(start, i + 1)
            if (slice.includes('"domain"')) candidates.push(slice)
            break
          }
        }
      }
    }
  }

  extractBalanced(trimmed, '{', '}')
  extractBalanced(trimmed, '[', ']')

  for (const candidate of candidates) {
    const sanitized = candidate.replace(/,\s*([}\]])/g, '$1')
    try {
      const parsed = JSON.parse(sanitized) as unknown
      if (Array.isArray(parsed)) {
        if (parsed.length > 0) return parsed as DiscoveredAiCompany[]
      } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { companies?: unknown }).companies)) {
        const list = (parsed as { companies: DiscoveredAiCompany[] }).companies
        if (list.length > 0) return list
      }
    } catch {
      /* try next candidate */
    }
  }

  return []
}

/**
 * Vérifie simultanément tous les domaines générés pour ne conserver
 * QUE ceux dont le site web est réellement actif et non parqué.
 * Si un .com est inactif ou parqué, teste automatiquement la variante .fr.
 */
export async function filterActiveCompanies(
  companies: DiscoveredAiCompany[],
  excludeDomains?: Iterable<string>,
): Promise<DiscoveredAiCompany[]> {
  const results = await Promise.allSettled(
    companies.map(async (company) => {
      let currentDomain = company.domain
      let alive = await isDomainAlive(currentDomain)
      if (!alive && currentDomain.endsWith('.com')) {
        const frDomain = currentDomain.replace(/\.com$/, '.fr')
        if (await isDomainAlive(frDomain)) {
          currentDomain = frDomain
          alive = true
        }
      }
      return { company: { ...company, domain: currentDomain }, alive }
    }),
  )

  const activeRaw: DiscoveredAiCompany[] = []
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.alive) {
      activeRaw.push(r.value.company)
    }
  }

  return dedupeCompanies(activeRaw, excludeDomains)
}

function getProspectDiscoveryModels(): string[] {
  const configured = process.env.GEMINI_PROSPECT_MODEL?.trim()
  const base = getGeminiModelCandidates(configured || 'gemini-3.8-flash')
  // Prioriser les modèles capables de raisonner et d'utiliser Google Search avant les modèles lite
  const ordered = [
    ...(configured ? [configured] : []),
    'gemini-3.8-flash',
    'gemini-4-argon',
    ...base,
  ].filter((m) => !/^gemini-(?:1\.|2\.|3\.6)/i.test(m))
  return Array.from(new Set(ordered))
}

export async function discoverCompaniesWithAi({
  target,
  location,
  limit = 20,
  excludeDomains = [],
}: {
  target: string
  location?: string
  limit?: number
  excludeDomains?: string[]
}): Promise<{ companies: DiscoveredAiCompany[]; provider: string }> {
  const geminiKey = process.env.GEMINI_API_KEY
  const openAiKey = process.env.OPENAI_API_KEY

  if (!geminiKey && !openAiKey) {
    throw new Error('Aucune clé API IA (GEMINI_API_KEY ou OPENAI_API_KEY) n’est configurée.')
  }

  const locText = location?.trim() ? `dans la zone / ville : « ${location.trim()} »` : 'en France ou francophonie (Belgique, Suisse, Québec)'
  const askCount = Math.min(Math.ceil(limit * 1.25), 30)
  const excludedList = excludeDomains
    .map((d) => cleanDomain(d))
    .filter((d): d is string => Boolean(d))
    .slice(0, 160)

  const exclusionBlock = excludedList.length
    ? `\nINTERDICTION STRICTE de proposer l’un de ces domaines déjà connus (trouve des entreprises DIFFÉRENTES et moins évidentes) :\n${excludedList.join(', ')}\n`
    : ''

  const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Délai dépassé (${Math.round(ms / 1000)}s)`)), ms)
        }),
      ])
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  const prompt = `Trouve ${askCount} entreprises ou marques RÉELLES et ACTIVES correspondant exactement à : « ${target} », ${locText}.

Contexte : Qualio transforme les avis clients publics (Trustpilot, Avis Vérifiés, G2, Capterra, App Store, Google Play) et retours utilisateurs en priorités produit concrètes.
Chaque entreprise proposée DOIT :
- Avoir un vrai site officiel actif (idéalement avec mentions légales ou page contact publique) ;
- Recevoir de vrais retours clients écrits (avis publics sur Trustpilot / G2 / Capterra / App Store / Google Play / Avis Vérifiés, ou livrer des produits digitaux/e-commerce pour ses clients) ;
- Être une TPE, PME ou scale-up indépendante (5 à 150 personnes).

À EXCLURE ABSOLUMENT :
- Les ESN, SSII, cabinets de conseil IT/data en régie, banques, assurances géantes, grands groupes du CAC40 ;
- Les annuaires, comparateurs, médias, places de marché ;
- Les domaines parqués ou expirés.${exclusionBlock}
Règles de format :
1. Uniquement des entreprises réelles vérifiables sur le web.
2. Domaine nu exact de l'entreprise (ex. "pennylane.com", "asphalte.com", "studio-ux.fr"), sans https:// ni www.
3. Dans relevance_reason, précise en 1 phrase concrète quelle source d'avis ou quel usage produit rend Qualio pertinent pour eux.`

  const deadline = Date.now() + 44_000
  let hadCandidatesAllDead = false

  // 1. Essai prioritaire avec Gemini + Google Search en direct
  if (geminiKey) {
    const client = new GoogleGenAI({ apiKey: geminiKey })
    const models = getProspectDiscoveryModels()

    for (const model of models) {
      const remaining = deadline - Date.now()
      if (remaining < 7_000) break

      let rawCandidates: DiscoveredAiCompany[] = []
      let usedWebSearch = false

      // 1a. Tentative avec Google Search grounding (budget confortable de 26s max)
      if (!model.includes('flash-lite') && remaining >= 14_000) {
        try {
          const groundedTimeout = Math.min(26_000, remaining - 4_000)
          const groundedResponse = await withTimeout(
            client.models.generateContent({
              model,
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `${prompt}\n\nUtilise Google Search pour vérifier les vrais noms de domaine officiels actifs, puis réponds UNIQUEMENT avec un objet JSON valide de la forme : {"companies": [{"name": "...", "domain": "...", "city": "...", "country": "...", "company_size": "PME", "relevance_reason": "..."}]}`,
                    },
                  ],
                },
              ],
              config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.45,
              },
            }),
            groundedTimeout,
          )
          rawCandidates = extractCompaniesJson(groundedResponse.text ?? '')
          if (rawCandidates.length > 0) usedWebSearch = true
        } catch (err) {
          console.warn(`[AI Prospect] Grounded search on ${model} skipped:`, err instanceof Error ? err.message : err)
        }
      }

      // 1b. Repli schéma JSON structuré si Google Search n'a rien renvoyé
      if (rawCandidates.length === 0) {
        const leftForStandard = deadline - Date.now()
        if (leftForStandard < 6_000) break
        try {
          const standardResponse = await withTimeout(
            client.models.generateContent({
              model,
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              config: {
                temperature: 0.45,
                responseMimeType: 'application/json',
                responseSchema: aiCompanySchema,
              },
            }),
            Math.min(16_000, leftForStandard),
          )
          rawCandidates = extractCompaniesJson(standardResponse.text ?? '')
        } catch (err) {
          console.warn(`[AI Prospect] Standard generation on ${model} failed:`, err instanceof Error ? err.message : err)
          continue
        }
      }

      const validCandidates = dedupeCompanies(rawCandidates, excludedList)
      if (validCandidates.length > 0) {
        const activeCompanies = await filterActiveCompanies(validCandidates, excludedList)
        if (activeCompanies.length > 0) {
          const modeLabel = usedWebSearch ? 'Recherche Web' : 'domaines vérifiés'
          return {
            companies: activeCompanies.slice(0, limit),
            provider: `Gemini · ${modeLabel}`,
          }
        }
        hadCandidatesAllDead = true
        // Inutile de boucler sur un modèle plus faible si ce modèle a répondu mais que la niche n'a aucun site actif
        break
      }
    }
  }

  // 2. Repli sur OpenAI si disponible
  if (openAiKey && Date.now() < deadline + 4_000) {
    try {
      const completion = await withTimeout(
        createOpenAiCompletion({
          model: process.env.OPENAI_FEEDBACK_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Tu es un expert en prospection B2B francophone. Ne propose que des entreprises réelles dont tu es certain du nom de domaine exact.',
            },
            { role: 'user', content: prompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'prospect_companies',
              schema: openAiCompanySchema,
              strict: true,
            },
          },
          temperature: 0.45,
        }),
        18_000,
      )

      const content = completion.choices[0]?.message?.content ?? ''
      const validCandidates = dedupeCompanies(extractCompaniesJson(content), excludedList)
      if (validCandidates.length > 0) {
        const activeCompanies = await filterActiveCompanies(validCandidates, excludedList)
        if (activeCompanies.length > 0) {
          return {
            companies: activeCompanies.slice(0, limit),
            provider: 'OpenAI · domaines vérifiés',
          }
        }
        hadCandidatesAllDead = true
      }
    } catch (err) {
      console.error('[AI Prospect] OpenAI fallback failed:', err)
    }
  }

  if (hadCandidatesAllDead) {
    throw new Error('Aucun des domaines trouvés ne répond en direct. Essaie de préciser le secteur ou une autre ville.')
  }

  throw new Error('La recherche IA n’a pas pu renvoyer de nouvelles entreprises valides. Réessaie dans quelques secondes.')
}
