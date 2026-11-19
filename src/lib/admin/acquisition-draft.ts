import { quoteExcerpt } from '@/lib/admin/acquisition-report'

export const GENERIC_EMAIL = /^(billing|support|contact|hello|info|sales|bonjour|accueil|reception|reservation|admin)@/i

export type DraftEvidence = { label: string; evidence: string | null; source_url: string }
export type DraftReportTheme = { name: string; mentions: number; negativeShare: number | null }
export type DraftReport = {
  url: string
  reviewCount: number
  sourceLabel: string
  subjectName: string
  themes: DraftReportTheme[]
  topQuote?: string | null
  periodStart?: string | null
  periodEnd?: string | null
}
type DraftInput = { fullName?: string | null; companyName?: string | null; companyNotes?: string | null; followUpOf?: { subject: string } | null; evidence?: DraftEvidence[]; report?: DraftReport | null }

export const EXAMPLE_URL = 'https://tryqualio.pro/exemple'

const SUBJECTS = ['Une question sur vos retours clients', 'Une idée à partir de vos avis clients']
const AGENCY_SUBJECT = 'Un rapport de retours utilisateurs pour vos clients'

/** Agence détectée par le nom ou la note de découverte (ex. raison de pertinence renvoyée par l'IA). */
export function isAgency(companyName?: string | null, companyNotes?: string | null) {
  return /\b(agence|agency|studio)\b/i.test(`${companyName ?? ''} ${companyNotes ?? ''}`)
}

function stableIndex(value: string) {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0) % SUBJECTS.length
}

function usefulEvidence(evidence: DraftEvidence[]) {
  return evidence.find((item) => /avis|review|témoignage|feedback|collecte/i.test(`${item.label} ${item.evidence ?? ''}`))
}

function formatThemeForSubject(name: string) {
  const lower = name.trim().toLowerCase()
  if (lower.length > 28 && lower.includes(' et ')) {
    return lower.split(/\s+et\s+/)[0].trim()
  }
  return lower
}

function formatThemeForLine(name: string) {
  const trimmed = name.trim()
  if (trimmed.length > 28 && /\s+et\s+/i.test(trimmed)) {
    return trimmed.split(/\s+et\s+/i)[0].trim()
  }
  return trimmed
}

/** Premier message ou relance courte. Le contenu reste relu et modifiable avant l'envoi.
 *  La mention « adresse publiée sur votre site » et le « stop » sont ajoutés par le pied de page de l'email (renderAcquisitionEmail). */
export function buildDraft({ fullName, companyName, companyNotes, followUpOf, evidence, report }: DraftInput) {
  const firstName = fullName?.trim().split(/\s+/)[0] || null
  const greeting = `Bonjour${firstName ? ` ${firstName}` : ''},`
  const signature = 'Kennedy\nQualio · tryqualio.pro'
  if (followUpOf && report) {
    return {
      subject: /^re\s*:/i.test(followUpOf.subject) ? followUpOf.subject : `Re: ${followUpOf.subject}`,
      body: `${greeting}\n\nJe remonte simplement le rapport sur vos avis ${report.sourceLabel}, au cas où il serait passé à la trappe : ${report.url}\n\nIl reste en ligne, sans inscription. Si ce n’est pas le bon moment, un mot suffit et je ne vous écris plus.\n\n${signature}`,
    }
  }
  if (followUpOf) {
    return {
      subject: /^re\s*:/i.test(followUpOf.subject) ? followUpOf.subject : `Re: ${followUpOf.subject}`,
      body: `${greeting}\n\nJe ne veux pas insister. Voici à quoi ressemble le résultat, sur des avis d’exemple : ${EXAMPLE_URL}\n\nSi ce n’est pas le bon moment, un mot suffit et je ne vous écris plus.\n\n${signature}`,
    }
  }
  const company = companyName?.trim() || 'votre entreprise'
  // Valeur d'abord : un rapport réel sur leurs propres avis remplace tout pitch générique.
  if (report) {
    const themes = report.themes.slice(0, 3)
    const topTheme = themes[0]
    const subject = topTheme
      ? `${report.subjectName} : ${topTheme.mentions} avis sur ${report.reviewCount} parlent de ${formatThemeForSubject(topTheme.name)}`
      : `${report.subjectName} : analyse de ${report.reviewCount} avis ${report.sourceLabel}`
    const introSuffix =
      themes.length === 3
        ? ' Trois sujets reviennent :'
        : themes.length === 2
          ? ' Deux sujets reviennent :'
          : themes.length === 1
            ? ' Un sujet revient :'
            : ''
    const buildBody = (quoteMax: number) => {
      const quote = quoteMax > 0 && report.topQuote ? quoteExcerpt(report.topQuote, quoteMax) : null
      const themeLines = themes.map((theme, index) => {
        const share = theme.negativeShare != null ? `, dont ${theme.negativeShare} % critiques` : ''
        const quotePart = index === 0 && quote ? ` « ${quote} »` : ''
        return `${index + 1}. ${formatThemeForLine(theme.name)} : ${theme.mentions} avis${share}${quotePart}`
      })
      return [
        greeting,
        `J’ai analysé les ${report.reviewCount} avis ${report.sourceLabel} de ${report.subjectName} que j’ai pu récupérer.${introSuffix}`,
        ...(themeLines.length ? [themeLines.join('\n')] : []),
        `Le rapport complet, avec les avis cités pour chaque point : ${report.url}`,
        'Je l’ai fait avec Qualio, l’outil que je construis pour transformer des avis en décisions. Le rapport est déjà chargé dans un espace gratuit à votre nom si vous voulez y ajouter d’autres avis.',
        signature,
      ].join('\n\n')
    }
    let body = buildBody(60)
    if (body.trim().split(/\s+/).length > 110) body = buildBody(40)
    if (body.trim().split(/\s+/).length > 110) body = buildBody(0)
    return {
      subject,
      body,
    }
  }
  if (isAgency(companyName, companyNotes)) {
    return {
      subject: AGENCY_SUBJECT,
      body: [
        greeting,
        'Pour justifier une évolution auprès d’un client, il faut des preuves. Or les retours utilisateurs sont éparpillés entre avis, e-mails et formulaires.',
        `Qualio les transforme en un rapport partageable par lien : trois priorités, chacune appuyée par les avis d’origine. Exemple : ${EXAMPLE_URL}`,
        `Je peux préparer gratuitement un premier rapport pour l’un des clients de ${company}, à partir de ses avis publics. Ça vous intéresserait ?`,
        signature,
      ].join('\n\n'),
    }
  }
  return {
    subject: SUBJECTS[stableIndex(company)],
    body: [
      greeting,
      `Savoir quoi corriger en premier à partir de ses avis clients prend du temps. Qualio en tire trois priorités, chacune appuyée par les avis d’origine. Exemple : ${EXAMPLE_URL}`,
      `Je peux faire gratuitement l’analyse des avis publics de ${company}. Ça vous intéresse ?`,
      signature,
    ].join('\n\n'),
  }
}
