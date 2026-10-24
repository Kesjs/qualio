export const GENERIC_EMAIL = /^(billing|support|contact|hello|info|sales|bonjour|accueil|reception|reservation|admin)@/i

type DraftInput = { fullName?: string | null; companyName?: string | null; followUpOf?: { subject: string } | null }

/** Premier message ou relance courte. Le contenu reste relu et modifiable avant l'envoi. */
export function buildDraft({ fullName, companyName, followUpOf }: DraftInput) {
  const greeting = `Bonjour${fullName ? ` ${fullName}` : ''},`
  const company = companyName ?? 'votre équipe'
  const signature = 'Bonne journée,\nKennedy — Qualio\nhttps://tryqualio.pro\ncontact@tryqualio.pro\n\nSi vous ne souhaitez pas recevoir d’autres messages, répondez simplement « stop ».'
  if (followUpOf) {
    return {
      subject: /^re\s*:/i.test(followUpOf.subject) ? followUpOf.subject : `Re: ${followUpOf.subject}`,
      body: `${greeting}\n\nJe me permets de relancer mon message précédent, au cas où il se serait perdu.\n\nQualio rassemble les avis clients de ${company} et en ressort les thèmes qui reviennent le plus. Je peux vous envoyer un exemple basé sur vos propres avis si cela vous intéresse.\n\n${signature}`,
    }
  }
  return {
    subject: `Une question sur les retours clients chez ${company}`,
    body: `${greeting}\n\nJe travaille sur Qualio, un espace qui aide les équipes produit à transformer les retours clients en thèmes, tendances et actions prioritaires.\n\nComment centralisez-vous aujourd’hui ces retours ?\n\nSi ce sujet concerne une autre personne, pourriez-vous m’indiquer le bon contact ?\n\n${signature}`,
  }
}
