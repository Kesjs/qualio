export const GENERIC_EMAIL = /^(billing|support|contact|hello|info|sales|bonjour|accueil|reception|reservation|admin)@/i

export type DraftEvidence = { label: string; evidence: string | null; source_url: string }
type DraftInput = { fullName?: string | null; companyName?: string | null; followUpOf?: { subject: string } | null; evidence?: DraftEvidence[] }

export const EXAMPLE_URL = 'https://tryqualio.pro/exemple'

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
  return {
    subject: 'Une question sur vos retours clients',
    body: [
      greeting,
      'Je construis Qualio, un outil qui transforme les avis clients en 3 actions prioritaires.',
      `Voici à quoi ressemble le résultat : ${EXAMPLE_URL}`,
      'Nous cherchons quelques entreprises pour tester gratuitement l’analyse sur leurs propres avis. Si cela vous intéresse, répondez simplement « oui ».',
      signature,
    ].filter(Boolean).join('\n\n'),
  }
}
