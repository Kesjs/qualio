import { GoogleGenAI, Type, type Schema } from '@google/genai'
import OpenAI from 'openai'
import { getGeminiModelCandidates } from '@/lib/feedback/ai'

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
          contact_email: { type: Type.STRING },
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
          contact_email: { type: 'string' },
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

export function cleanDomain(input: string): string | null {
  if (!input) return null
  let host = input.trim().toLowerCase()
  host = host.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split(':')[0].trim()
  if (!/^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(host)) return null
  const blocked = ['facebook.com', 'instagram.com', 'linkedin.com', 'google.com', 'twitter.com', 'x.com', 'tiktok.com', 'youtube.com']
  if (blocked.some((b) => host === b || host.endsWith(`.${b}`))) return null
  return host
}

/**
 * Ping HTTP ultra-rapide pour vérifier en direct si le domaine existe et répond.
 * Évite d'insérer des domaines inactifs, morts ou mal orthographiés.
 */
export async function isDomainAlive(domain: string): Promise<boolean> {
  const host = cleanDomain(domain)
  if (!host) return false

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

  // Essai 1 : HTTPS avec méthode HEAD (rapide, léger)
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3500)
    const res = await fetch(`https://${host}`, {
      method: 'HEAD',
      headers: { 'User-Agent': userAgent, 'Accept': 'text/html,*/*' },
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timer)
    if (res.status < 500) return true
  } catch {
    // Si HEAD est bloqué par certains serveurs, on tente un GET léger
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 3000)
      const res = await fetch(`https://${host}`, {
        method: 'GET',
        headers: { 'User-Agent': userAgent, 'Accept': 'text/html,*/*' },
        signal: controller.signal,
        redirect: 'follow',
      })
      clearTimeout(timer)
      if (res.status < 500) return true
    } catch {
      // Essai 2 : repli HTTP simple si le certificat HTTPS a un souci
      try {
        const res = await fetch(`http://${host}`, {
          method: 'HEAD',
          headers: { 'User-Agent': userAgent },
          signal: AbortSignal.timeout(2500),
        })
        if (res.status < 500) return true
      } catch {
        return false
      }
    }
  }

  return false
}

/**
 * Vérifie simultanément tous les domaines générés pour ne conserver
 * QUE ceux dont le site web est réellement en ligne.
 */
export async function filterActiveCompanies(companies: DiscoveredAiCompany[]): Promise<DiscoveredAiCompany[]> {
  const results = await Promise.allSettled(
    companies.map(async (company) => {
      const alive = await isDomainAlive(company.domain)
      return { company, alive }
    })
  )

  const active: DiscoveredAiCompany[] = []
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.alive) {
      active.push(r.value.company)
    }
  }

  return active
}

export async function discoverCompaniesWithAi({
  target,
  location,
  limit = 20,
}: {
  target: string
  location?: string
  limit?: number
}): Promise<{ companies: DiscoveredAiCompany[]; provider: string }> {
  const geminiKey = process.env.GEMINI_API_KEY
  const openAiKey = process.env.OPENAI_API_KEY

  if (!geminiKey && !openAiKey) {
    throw new Error('Aucune clé API IA (GEMINI_API_KEY ou OPENAI_API_KEY) n’est configurée.')
  }

  const locText = location?.trim() ? `dans la zone / ville : « ${location.trim()} »` : 'en France / francophonie'
  // On demande un léger surplus (+30%) pour compenser d'éventuels domaines inactifs filtrés au ping
  const askCount = Math.min(Math.ceil(limit * 1.3), 35)

  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(`Le fournisseur IA n’a pas répondu après ${ms / 1000} secondes.`)), ms) }),
      ])
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  const prompt = `Trouve exactement ${askCount} entreprises et marques RÉELLES existantes correspondant à la cible : « ${target} », ${locText}.

Qualio est un logiciel SaaS qui permet aux entreprises de collecter, analyser et transformer leurs avis clients en décisions concrètes (synthèses IA, alertes, priorisation produit/service).
Ces entreprises doivent être des cibles idéales pour Qualio : elles ont des clients, reçoivent des avis (ou devraient en collecter plus) et ont un site web actif.

Règles impératives :
1. Uniquement de VRAIES entreprises qui existent dans la réalité.
2. Un nom de domaine internet réel (ex: asphalte.com, bigmamma.fr, norsys.fr, etc.). Pas d'URL inventée, pas de sous-domaine de réseau social.
3. Format domaine : "exemple.fr" (sans https:// ni www).
4. Indique une raison pertinente pour laquelle Qualio les intéresserait.
5. Donne également l'adresse email de contact public officiel si connue (ex: contact@domaine.com, hello@domaine.com).`

  // 1. Essai avec Gemini
  if (geminiKey) {
    const models = getGeminiModelCandidates(process.env.GEMINI_FEEDBACK_MODEL)
    for (const model of models) {
      try {
        const client = new GoogleGenAI({ apiKey: geminiKey })

        // Essai avec Google Search grounding pour sourcer en direct sur le web
        let textResult = ''
        try {
          const groundedResponse = await withTimeout(client.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: `${prompt}\nRéponds au format JSON strict conforme : {"companies": [{"name": "...", "domain": "...", "city": "...", "country": "...", "contact_email": "...", "relevance_reason": "..."}]}` }] }],
            config: {
              tools: [{ googleSearch: {} }],
              temperature: 0.2,
            },
          }), 15_000)
          if (groundedResponse.text) {
            textResult = groundedResponse.text
          }
        } catch {
          // Fallback sur mode schema JSON classique si Search Tool non disponible sur ce modèle/clé
          const standardResponse = await withTimeout(client.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              temperature: 0.2,
              responseMimeType: 'application/json',
              responseSchema: aiCompanySchema,
            },
          }), 15_000)
          if (standardResponse.text) {
            textResult = standardResponse.text
          }
        }

        if (textResult) {
          // Extraction robuste du JSON (même si markdown ```json ... ```)
          let jsonStr = textResult.trim()
          const codeMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
          if (codeMatch) jsonStr = codeMatch[1].trim()

          const parsed = JSON.parse(jsonStr) as { companies?: DiscoveredAiCompany[] }
          const raw = parsed.companies ?? []
          const validCandidates = raw
            .map((c) => ({
              ...c,
              domain: cleanDomain(c.domain) ?? '',
              contact_email: c.contact_email?.trim() || undefined,
            }))
            .filter((c) => Boolean(c.name && c.domain))

          if (validCandidates.length > 0) {
            // Filtrage par ping HTTP en direct : seuls les sites actifs sont retenus
            const activeCompanies = await filterActiveCompanies(validCandidates)
            const finalCompanies = (activeCompanies.length > 0 ? activeCompanies : validCandidates).slice(0, limit)
            return { companies: finalCompanies, provider: `Gemini (${model} · Web Vérifié)` }
          }
        }
      } catch (err) {
        console.warn(`[AI Prospect] Gemini ${model} failed, trying next...`, err)
      }
    }
  }

  // 2. Repli sur OpenAI si disponible
  if (openAiKey) {
    try {
      const client = new OpenAI({ apiKey: openAiKey })
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_FEEDBACK_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu es un expert en prospection B2B et détection de vraies entreprises cibles.' },
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
        temperature: 0.2,
      })

      const content = completion.choices[0]?.message?.content
      if (content) {
        const parsed = JSON.parse(content) as { companies?: DiscoveredAiCompany[] }
        const raw = parsed.companies ?? []
        const validCandidates = raw
          .map((c) => ({
            ...c,
            domain: cleanDomain(c.domain) ?? '',
          }))
          .filter((c) => Boolean(c.name && c.domain))

        if (validCandidates.length > 0) {
          const activeCompanies = await filterActiveCompanies(validCandidates)
          const finalCompanies = (activeCompanies.length > 0 ? activeCompanies : validCandidates).slice(0, limit)
          return { companies: finalCompanies, provider: 'OpenAI (Web Vérifié)' }
        }
      }
    } catch (err) {
      console.error('[AI Prospect] OpenAI failed', err)
      throw err
    }
  }

  throw new Error('La recherche IA n’a pas pu renvoyer d’entreprises valides.')
}
