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
  '/cgv',
  '/conditions-generales',
  '/support',
  '/feedback',
  '/reviews',
  '/jobs',
]


const SIGNALS = [
  { type: 'feedback', label: 'Collecte de feedback détectée', words: ['feedback', 'give us feedback', 'donnez votre avis', 'votre avis', 'customer feedback'] },
  { type: 'reviews', label: 'Avis ou témoignages détectés', words: ['reviews', 'avis clients', 'témoignages', 'testimonials', 'customer stories', 'trustpilot', 'avis vérifiés'] },
]

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

const PLACEHOLDER_EMAIL_LOCALS = new Set(['test', 'foo', 'bar', 'example', 'demo', 'hello', 'sample', 'user', 'placeholder', 'votre', 'adresse', 'email'])

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

export async function scanCompany(admin: any, company: { id: string; domain: string }) {
  const found: Array<{ signal_type: string; label: string; source_url: string; evidence: string; confidence: number }> = []
  const emails = new Map<string, string>()
  let discoveredLeaderName: string | null = null

  // Scanner les pages les plus probantes : la page d'accueil peut contenir
  // des adresses historiques, de support ou de tracking qui ne sont pas le bon point d'entrée.
  for (const path of PATHS.slice(0, 8)) {
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
      const html = await response.text()
      const text = textFromHtml(html)
      const lower = text.toLowerCase()

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

      // 2. Détection du dirigeant / publication dans mentions légales
      if (!discoveredLeaderName && (path.includes('legal') || path.includes('mentions') || path.includes('propos') || path.includes('about'))) {
        discoveredLeaderName = extractLeaderName(html)
      }

      // 3. Détection des liens mailto: (les plus fiables et intentionnels)
      for (const match of html.matchAll(/href=["']mailto:([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})[?"']/gi)) {
        const email = match[1].toLowerCase()
        if (isUsablePublicEmail(email)) {
          emails.set(email, url)
        }
      }

      // 4. Détection des adresses email brutes dans le HTML
      for (const match of html.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
        const email = match[0].toLowerCase()
        if (isUsablePublicEmail(email)) {
          emails.set(email, url)
        }
      }

      // 5. Détection des emails obfusqués (ex: contact [at] domain.fr)
      for (const match of html.matchAll(/([A-Z0-9._%+-]{2,30})\s*(?:\[at\]|\(at\)|\s+at\s+)\s*([A-Z0-9.-]{2,30})\s*(?:\[dot\]|\(dot\)|\s+dot\s+|\.)\s*([A-Z]{2,10})/gi)) {
        const candidate = `${match[1]}@${match[2]}.${match[3]}`.toLowerCase()
        if (isUsablePublicEmail(candidate)) {
          emails.set(candidate, url)
        }
      }
    } catch {
      /* Page inaccessible ou timeout : on passe à la suivante sans bloquer */
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

  const score = Math.min(100, uniqueSignals.length * 16 + (emails.size ? 20 : 0))
  const notes = [
    `${uniqueSignals.length} signal(s)`,
    `${emails.size} email(s) public(s) détecté(s)`,
    discoveredLeaderName ? `Contact : ${discoveredLeaderName}` : null,
  ].filter(Boolean).join(' · ')

  await admin
    .from('acquisition_companies')
    .update({ relevance_score: score, status: 'review', source_notes: notes })
    .eq('id', company.id)

  return { signals: uniqueSignals.length, emails: emails.size, score, leaderName: discoveredLeaderName }
}
