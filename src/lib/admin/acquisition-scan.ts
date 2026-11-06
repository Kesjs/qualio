/** Analyse publique d'un site : signaux produit + emails visibles. Partagé par /scan et /prepare. */

import { validatePublicEmail } from '@/lib/admin/email-validation'

const PATHS = [
  '',
  '/contact',
  '/contactez-nous',
  '/nous-contacter',
  '/mentions-legales',
  '/legal',
  '/a-propos',
  '/about',
  '/qui-sommes-nous',
  '/politique-de-confidentialite',
  '/privacy',
  '/cgv',
  '/conditions-generales',
  '/support',
  '/feedback',
  '/reviews',
  '/jobs',
]


const SIGNALS = [
  { type: 'feedback', label: 'Collecte de feedback détectée', words: ['feedback', 'give us feedback', 'donnez votre avis', 'votre avis', 'customer feedback'] },
  { type: 'reviews', label: 'Avis ou témoignages détectés', words: ['reviews', 'avis clients', 'témoignages', 'testimonials', 'customer stories', 'avis vérifiés'] },
  { type: 'product_team', label: 'Équipe produit / support structuré', words: ['changelog', 'roadmap', 'release notes', 'intercom', 'crisp.chat', 'zendesk', 'canny.io'] },
]

export type DiscoveredReviewSource = {
  type: 'app_store' | 'google_play' | 'trustpilot' | 'g2' | 'capterra'
  label: string
  url: string
}

const REVIEW_URL_PATTERNS: Array<{ type: DiscoveredReviewSource['type']; label: string; regex: RegExp }> = [
  { type: 'app_store', label: 'App Store', regex: /https?:\/\/apps\.apple\.com\/[a-z]{2}\/app\/[^\s"'<>]*id\d{6,12}|https?:\/\/apps\.apple\.com\/app\/[^\s"'<>]*id\d{6,12}/gi },
  { type: 'google_play', label: 'Google Play', regex: /https?:\/\/play\.google\.com\/store\/apps\/details\?id=[A-Za-z0-9._]+/gi },
  { type: 'trustpilot', label: 'Trustpilot', regex: /https?:\/\/(?:[a-z]{2}\.)?trustpilot\.com\/review\/[A-Za-z0-9.-]+/gi },
  { type: 'g2', label: 'G2', regex: /https?:\/\/(?:www\.)?g2\.com\/products\/[A-Za-z0-9-]+/gi },
  { type: 'capterra', label: 'Capterra', regex: /https?:\/\/(?:www\.)?capterra\.(?:fr|com)\/(?:software|p)\/[A-Za-z0-9/_-]+/gi },
]

/** Détecte sur le site du prospect ses vraies pages publiques d'avis (App Store, Trustpilot, G2, Capterra, Google Play). */
export function extractReviewSources(rawHtml: string): DiscoveredReviewSource[] {
  const html = decodeEscapes(rawHtml)
  const byType = new Map<DiscoveredReviewSource['type'], DiscoveredReviewSource>()
  for (const item of REVIEW_URL_PATTERNS) {
    const match = html.match(item.regex)?.[0]
    if (match && !byType.has(item.type)) {
      byType.set(item.type, { type: item.type, label: item.label, url: match.replace(/[),.]+$/, '') })
    }
  }
  return [...byType.values()]
}

function safeUrl(domain: string, path: string) {
  const host = domain.replace(/^https?:\/\//, '').split('/')[0].trim().toLowerCase()
  if (!host || host === 'localhost' || host.startsWith('127.') || host.startsWith('192.168.') || host.startsWith('10.')) return null
  return `https://${host}${path}`
}

function textFromHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 150_000)
}

const PLACEHOLDER_EMAIL_HOSTS = new Set([
  'yourdomain.com',
  'email.com',
  'example.com',
  'test.com',
  'domain.com',
  'sentry.io',
  'wixpress.com',
  'cloudflare.com',
  'schema.org',
  'wordpress.org',
  'w3.org',
  'gravatar.com',
  'shopify.com',
  'google.com',
  'github.com',
])

// Note : « hello » n'est volontairement pas dans cette liste, beaucoup d'agences l'utilisent comme vraie adresse de contact.
const PLACEHOLDER_EMAIL_LOCALS = new Set(['test', 'foo', 'bar', 'example', 'demo', 'sample', 'user', 'placeholder', 'votre', 'adresse', 'email'])

// Boîtes dédiées à autre chose qu'à la prospection : données personnelles, recrutement, presse, juridique.
const ROLE_MAILBOX = /^(rgpd|dpo|gdpr|privacy|donnees|données|job|jobs|recrutement|recruitment|rh|hr|careers?|carrieres|carrières|candidatures?|presse|press|abuse|postmaster|juridique|legal)(?:[._-].*)?$/i

const INVALID_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.gif',
  '.css',
  '.js',
  '.woff',
  '.woff2',
  '.ttf',
  '.mp4',
  '.pdf',
  '.zip',
]

export function isUsablePublicEmail(value: string) {
  const email = value.trim().toLowerCase()
  if (INVALID_EXTENSIONS.some((ext) => email.endsWith(ext))) return false

  const [local, host] = email.split('@')
  if (!local || !host || PLACEHOLDER_EMAIL_HOSTS.has(host) || PLACEHOLDER_EMAIL_LOCALS.has(local)) return false
  if (host.includes('sentry') || host.includes('wixpress') || host.includes('cloudflare') || host.includes('schema.org') || host.includes('w3.org') || host.includes('wordpress.org')) return false
  if (/^[0-9a-f]{20,}$/i.test(local)) return false // Sentry DSN hash ou token
  if (/^u00[0-9a-f]{2}/i.test(local)) return false // reste d'un échappement unicode mal décodé (ex. u003econtact@…)
  if (ROLE_MAILBOX.test(local)) return false
  if (local.includes('example') || local.includes('yourdomain') || local.includes('placeholder')) return false
  if (/^(noreply|no-reply|do-not-reply|donotreply|mailer-daemon)$/.test(local)) return false
  return true
}

/**
 * Tente d'extraire le nom d'un dirigeant ou responsable dans les mentions légales / à propos
 * Ex: « Directeur de la publication : Jean Dupont » ou « Gérant : Sophie Martin »
 */
function extractLeaderName(html: string): string | null {
  const patterns = [
    /(?:directeur(?:trice)? de la publication|responsable de la publication|gérant(?:e)?|fondateur(?:trice)?|président(?:e)?|dirigeant(?:e)?)\s*[:–-]\s*([A-ZÀ-ÖØ-öø-ÿ][a-zà-öø-ÿ]+(?:\s+[A-ZÀ-ÖØ-öø-ÿ][a-zà-öø-ÿ]+){1,3})/i,
    /(?:fondé(?:e)? par|créé(?:e)? par)\s+([A-ZÀ-ÖØ-öø-ÿ][a-zà-öø-ÿ]+(?:\s+[A-ZÀ-ÖØ-öø-ÿ][a-zà-öø-ÿ]+){1,3})/i,
  ]

  for (const regex of patterns) {
    const match = html.match(regex)
    if (match?.[1]) {
      const candidate = match[1].trim()
      // Éviter les captures de phrases longues ou fausses
      if (candidate.length >= 4 && candidate.length <= 40 && !/^(société|entreprise|sarl|sas|france|paris|contact)/i.test(candidate)) {
        return candidate
      }
    }
  }
  return null
}

function safeCodePoint(code: number) {
  return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
}

/** Décode les échappements qui cachent ou déforment les adresses dans le HTML (unicode, hexadécimal, entités, %40). */
export function decodeEscapes(input: string) {
  return input
    .replace(/\\u([0-9a-f]{4})/gi, (_, hex: string) => safeCodePoint(parseInt(hex, 16)))
    .replace(/\\x([0-9a-f]{2})/gi, (_, hex: string) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => safeCodePoint(Number(dec)))
    .replace(/&commat;/gi, '@')
    .replace(/&period;/gi, '.')
    .replace(/&amp;/gi, '&')
    .replace(/%40/g, '@')
}

/** Toutes les adresses publiques utilisables d'une page : liens mailto, adresses brutes, adresses obfusquées. */
export function extractEmails(rawHtml: string): string[] {
  const html = decodeEscapes(rawHtml)
  const found = new Set<string>()
  const add = (value: string) => {
    const email = value.toLowerCase().replace(/^[._%+-]+/, '')
    if (isUsablePublicEmail(email)) found.add(email)
  }

  // mailto: : les plus fiables, car intentionnels
  for (const match of html.matchAll(/href=["']mailto:([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})[?"']/gi)) add(match[1])
  // Adresses brutes dans le HTML
  for (const match of html.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) add(match[0])
  // Adresses obfusquées (ex: contact [at] domain [dot] fr)
  for (const match of html.matchAll(/([A-Z0-9._%+-]{2,30})\s*(?:\[at\]|\(at\)|\s+at\s+)\s*([A-Z0-9.-]{2,30})\s*(?:\[dot\]|\(dot\)|\s+dot\s+|\.)\s*([A-Z]{2,10})/gi)) add(`${match[1]}@${match[2]}.${match[3]}`)
  return [...found]
}

const SECOND_LEVEL = new Set(['co', 'com', 'org', 'net', 'gov', 'ac'])
const BRAND_SUFFIX = /[-_]?(?:groupe|group|france|agency|agence|digital|studio|consulting)$/

function bareHost(value: string) {
  return value.replace(/^https?:\/\//, '').split('/')[0].trim().toLowerCase().replace(/^www\./, '')
}

function registrable(host: string) {
  const labels = host.split('.')
  if (labels.length <= 2) return host
  const tld = labels[labels.length - 1]
  const second = labels[labels.length - 2]
  return labels.slice(tld.length === 2 && SECOND_LEVEL.has(second) ? -3 : -2).join('.')
}

function brand(host: string) {
  const label = registrable(host).split('.')[0]
  return label.replace(BRAND_SUFFIX, '') || label
}

/** L'adresse appartient-elle bien à l'entreprise ? Même domaine, sous-domaine, autre extension ou variante « -group » du même nom. */
export function extractInternalContactPaths(html: string): string[] {
  const matches = html.matchAll(/href=["']([^"'>\s]+)["']/gi)
  const paths = new Set<string>()
  for (const match of matches) {
    const raw = match[1]
    if (/contact|mentions|legal|propos|about|equipe|team|agence|privacy|confidentialite/i.test(raw)) {
      try {
        const pathname = raw.startsWith('http') ? new URL(raw).pathname : raw.split('?')[0].split('#')[0]
        if (pathname && pathname.length >= 2 && pathname.length <= 80 && pathname.startsWith('/')) {
          paths.add(pathname)
        }
      } catch {}
    }
  }
  return [...paths].slice(0, 6)
}

export function sameCompanyDomain(email: string, companyDomain: string) {
  const emailHost = bareHost(email.split('@')[1] ?? '')
  const host = bareHost(companyDomain)
  if (!emailHost || !host) return false
  return registrable(emailHost) === registrable(host) || brand(emailHost) === brand(host)
}

export async function scanCompany(admin: any, company: { id: string; domain: string; source_notes?: string | null }) {
  const found: Array<{ signal_type: string; label: string; source_url: string; evidence: string; confidence: number }> = []
  const reviewSources = new Map<string, DiscoveredReviewSource>()
  const emails = new Map<string, string>()
  const foreignEmails = new Set<string>()
  let discoveredLeaderName: string | null = null
  let finalRedirectHost: string | null = null

  const pathsToScan = [...PATHS.slice(0, 11)]
  const scannedPaths = new Set<string>()

  // Scanner les pages les plus probantes et les liens internes découverts
  for (let i = 0; i < pathsToScan.length && scannedPaths.size < 15; i += 1) {
    const path = pathsToScan[i]
    if (scannedPaths.has(path)) continue
    scannedPaths.add(path)

    const url = safeUrl(company.domain, path)
    if (!url) continue

    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 QualioResearchBot/1.0',
          'accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(6500),
        cache: 'no-store',
      })

      if (!response.ok) continue
      try {
        const redirected = new URL(response.url).hostname.replace(/^www\./, '').toLowerCase()
        if (redirected && redirected !== bareHost(company.domain)) {
          finalRedirectHost = redirected
        }
      } catch {
        /* ignore parsing error */
      }
      const html = await response.text()
      const text = textFromHtml(html)
      const lower = text.toLowerCase()

      // Si c'est la page d'accueil ou de contact, découvrir les liens internes réels vers les mentions/contact
      if (path === '' || path === '/contact') {
        for (const discoveredPath of extractInternalContactPaths(html)) {
          if (!scannedPaths.has(discoveredPath) && !pathsToScan.includes(discoveredPath)) {
            pathsToScan.push(discoveredPath)
          }
        }
      }

      // 1. Signaux de feedback & avis
      for (const signal of SIGNALS) {
        const word = signal.words.find((candidate) => lower.includes(candidate.toLowerCase()))
        if (word) {
          found.push({
            signal_type: signal.type,
            label: signal.label,
            source_url: url,
            evidence: `Terme détecté : “${word}”`,
            confidence: 72,
          })
        }
      }

      // 1b. Liens directs vers des plateformes d'avis publics (App Store, Trustpilot, G2, Capterra, Play)
      for (const source of extractReviewSources(html)) {
        if (!reviewSources.has(source.type)) {
          reviewSources.set(source.type, source)
          found.push({
            signal_type: source.type,
            label: `Avis publics sur ${source.label}`,
            source_url: source.url,
            evidence: source.url,
            confidence: 95,
          })
        }
      }

      // 2. Détection du dirigeant / publication dans mentions légales
      if (!discoveredLeaderName && (path.includes('legal') || path.includes('mentions') || path.includes('propos') || path.includes('about'))) {
        discoveredLeaderName = extractLeaderName(html)
      }

      // 3. Emails visibles sur la page, domaine de l'entreprise ou domaine de redirection
      for (const email of extractEmails(html)) {
        if (sameCompanyDomain(email, company.domain) || (finalRedirectHost && sameCompanyDomain(email, finalRedirectHost))) {
          emails.set(email, url)
        } else {
          foreignEmails.add(email)
        }
      }
    } catch {
      /* Page inaccessible ou timeout : on passe à la suivante sans bloquer */
    }
  }

  // Fallback intelligent si aucun email trouvé dans le HTML :
  // Si le domaine (ou domaine redirigé) a un serveur mail actif (MX vérifié),
  // on déduit automatiquement l'adresse standard (contact@ / hello@) au lieu de laisser le prospect bloqué.
  if (emails.size === 0) {
    const candidateDomains = [finalRedirectHost, company.domain].filter((d): d is string => Boolean(d))
    for (const dom of candidateDomains) {
      const cleanDom = dom.replace(/^www\./, '').toLowerCase()
      for (const prefix of ['contact', 'hello']) {
        const candidateEmail = `${prefix}@${cleanDom}`
        try {
          const validation = await validatePublicEmail(candidateEmail)
          if (validation.status === 'verified') {
            emails.set(candidateEmail, `https://${cleanDom}`)
            break
          }
        } catch {
          /* ignore DNS error */
        }
      }
      if (emails.size > 0) break
    }
  }

  // Enregistrement des signaux uniques
  const uniqueSignals = Array.from(new Map(found.map((signal) => [`${signal.signal_type}:${signal.source_url}`, signal])).values())
  for (const signal of uniqueSignals) {
    const { data: existingSignals } = await admin
      .from('acquisition_signals')
      .select('id')
      .eq('company_id', company.id)
      .eq('signal_type', signal.signal_type)
      .eq('source_url', signal.source_url)
      .limit(1)

    if (!existingSignals?.length) {
      await admin.from('acquisition_signals').insert({ ...signal, company_id: company.id })
    }
  }

  // Les contacts publics créés par un crawl sont réconciliés avec le dernier scan.
  // On ne touche pas aux contacts importés/validés manuellement.
  const scannedEmails = Array.from(emails.keys())
  const { data: previousPublicContacts } = await admin
    .from('acquisition_contacts')
    .select('id, email')
    .eq('company_id', company.id)
    .eq('email_status', 'public')
  for (const previous of previousPublicContacts ?? []) {
    if (!emails.has(String(previous.email).toLowerCase())) {
      await admin.from('acquisition_contacts').delete().eq('id', previous.id)
    }
  }

  // Enregistrement des contacts emails trouvés, avec preuve de la page source.
  for (const [email, sourceUrl] of emails) {
    const validation = await validatePublicEmail(email)
    if (validation.status === 'invalid') continue
    const { data: existing } = await admin
      .from('acquisition_contacts')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!existing) {
      await admin.from('acquisition_contacts').insert({
        company_id: company.id,
        email,
        full_name: discoveredLeaderName ?? null,
        email_status: validation.status,
        email_source_url: sourceUrl,
        confidence: validation.status === 'verified' ? (discoveredLeaderName ? 90 : 80) : 55,
      })
    } else {
      await admin.from('acquisition_contacts').update({ email_source_url: sourceUrl, email_status: validation.status }).eq('id', existing.id).eq('company_id', company.id)
    }
  }

  const hasPersonalEmail = scannedEmails.some((e) => !/^(billing|support|contact|hello|info|sales|bonjour|accueil|reception|reservation|admin)@/i.test(e))
  const score = Math.min(
    100,
    (reviewSources.size > 0 ? 45 : 0) +
      (emails.size > 0 ? 25 : 0) +
      (hasPersonalEmail || discoveredLeaderName ? 15 : 0) +
      Math.min(15, uniqueSignals.filter((s) => !reviewSources.has(s.signal_type)).length * 8),
  )
  let priorAiNote = company.source_notes
  if (priorAiNote === undefined) {
    const { data: currentRow } = await admin.from('acquisition_companies').select('source_notes').eq('id', company.id).maybeSingle()
    priorAiNote = currentRow?.source_notes ?? null
  }
  const preservedPrefix = priorAiNote && /^IA Qualio/i.test(priorAiNote) ? priorAiNote.split(' · Scan :')[0] : null
  const scanSummary = [
    reviewSources.size ? `Sources d’avis : ${[...reviewSources.values()].map((s) => s.label).join(', ')}` : null,
    `${emails.size} email(s) public(s)`,
    discoveredLeaderName ? `Dirigeant : ${discoveredLeaderName}` : null,
    foreignEmails.size ? `${foreignEmails.size} hors-domaine ignoré(s)` : null,
  ].filter(Boolean).join(' · ')
  const notes = preservedPrefix ? `${preservedPrefix} · Scan : ${scanSummary}` : scanSummary

  await admin
    .from('acquisition_companies')
    .update({ relevance_score: score, status: 'review', source_notes: notes })
    .eq('id', company.id)

  return { signals: uniqueSignals.length, reviewSources: [...reviewSources.values()], emails: emails.size, ignoredForeign: foreignEmails.size, score, leaderName: discoveredLeaderName }
}
