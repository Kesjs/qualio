export const GENERIC_EMAIL = /^(billing|support|contact|hello|info|sales|bonjour|accueil|reception|reservation|admin)@/i

export type DraftEvidence = { label: string; evidence: string | null; source_url: string }
type DraftInput = { fullName?: string | null; companyName?: string | null; followUpOf?: { subject: string } | null; evidence?: DraftEvidence[] }

export const EXAMPLE_URL = 'https://tryqualio.pro/exemple'

/** Phrase d'accroche uniquement si le site montre vraiment des avis ou une collecte de feedback. Sinon : rien, on ne simule pas la personnalisation. */
function observedLine(companyName: string | null | undefined, evidence: DraftEvidence[] = []) {
  const name = companyName ?? 'votre équipe'
  if (evidence.some((item) => /avis|témoignage/i.test(item.label))) return `J’ai vu que ${name} affiche des avis clients sur son site.`
  if (evidence.some((item) => /feedback/i.test(item.label))) return `J’ai vu que ${name} invite ses clients à donner leur avis.`
  return null
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
  const observed = observedLine(companyName, evidence)
  return {
    subject: companyName ? `Vos avis clients chez ${companyName}` : 'Vos avis clients',
    body: [
      greeting,
      observed,
      'Je m’appelle Kennedy, je construis Qualio : l’outil lit vos avis clients et vous dit quoi corriger en premier.',
      'Si vous m’envoyez un export de vos avis (CSV, ou juste un lien vers votre page d’avis), je vous renvoie gratuitement les 3 thèmes qui reviennent le plus, avec les avis à l’appui.',
      'Ça vous intéresse ?',
      signature,
    ].filter(Boolean).join('\n\n'),
  }
}
