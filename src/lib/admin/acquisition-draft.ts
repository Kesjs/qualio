export const GENERIC_EMAIL = /^(billing|support|contact|hello|info|sales|bonjour|accueil|reception|reservation|admin)@/i

export type DraftEvidence = { label: string; evidence: string | null; source_url: string }
type DraftInput = { fullName?: string | null; companyName?: string | null; followUpOf?: { subject: string } | null; evidence?: DraftEvidence[] }

export const EXAMPLE_URL = 'https://tryqualio.pro/exemple'

const SUBJECTS = ['Une question sur vos retours clients', 'Une idée à partir de vos avis clients']

function stableIndex(value: string) {
  return [...value].reduce((sum, char) => sum + char.charCodeAt(0), 0) % SUBJECTS.length
}

function usefulEvidence(evidence: DraftEvidence[]) {
  return evidence.find((item) => /avis|review|témoignage|feedback|collecte/i.test(`${item.label} ${item.evidence ?? ''}`))
}

/** Premier message ou relance courte. Le contenu reste relu et modifiable avant l'envoi.
 *  La mention « adresse publiée sur votre site » et le « stop » sont ajoutés par le pied de page de l'email (renderAcquisitionEmail). */
export function buildDraft({ fullName, companyName, followUpOf, evidence }: DraftInput) {
  const greeting = `Bonjour${fullName ? ` ${fullName}` : ''},`
  const signature = 'Kennedy\nQualio · tryqualio.pro'
  if (followUpOf) {
    return {
      subject: /^re\s*:/i.test(followUpOf.subject) ? followUpOf.subject : `Re: ${followUpOf.subject}`,
      body: `${greeting}\n\nJe ne veux pas insister. Voici à quoi ressemble le résultat, sur des avis d’exemple : ${EXAMPLE_URL}\n\nSi ce n’est pas le bon moment, un mot suffit et je ne vous écris plus.\n\n${signature}`,
    }
  }
  const company = companyName?.trim() || 'votre entreprise'
  return {
    subject: SUBJECTS[stableIndex(company)],
    body: [
      greeting,
      'Les retours clients contiennent souvent des pistes d’amélioration précieuses. Entre les commentaires, les attentes récurrentes et les suggestions, il n’est toutefois pas toujours simple de savoir quoi prioriser.',
      'C’est précisément ce que facilite Qualio : transformer les avis clients en trois actions prioritaires, accompagnées des retours qui les justifient.',
      `Vous pouvez découvrir un exemple concret ici : ${EXAMPLE_URL}`,
      `Je vous propose de réaliser gratuitement une première analyse des avis publics de ${company}, afin d’identifier trois pistes d’amélioration concrètes.`,
      'Seriez-vous intéressé par un aperçu personnalisé, sans engagement ?',
      signature,
    ].filter(Boolean).join('\n\n'),
  }
}
