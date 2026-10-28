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
  const signal = usefulEvidence(evidence ?? [])
  const company = companyName?.trim() || 'votre entreprise'
  const observation = signal ? `En regardant ${company}, j’ai vu un signal public autour de ${signal.label.toLowerCase()}.` : `Je me demandais comment ${company} transforme aujourd’hui ses avis clients en décisions.`
  return {
    subject: SUBJECTS[stableIndex(company)],
    body: [
      greeting,
      observation,
      'Qualio transforme les avis clients en 3 actions prioritaires, avec leurs preuves.',
      `Voici un exemple concret : ${EXAMPLE_URL}`,
      'Si vous voulez, je peux vous envoyer gratuitement trois constats sur vos avis publics. Un simple « oui » suffit.',
      signature,
    ].filter(Boolean).join('\n\n'),
  }
}
