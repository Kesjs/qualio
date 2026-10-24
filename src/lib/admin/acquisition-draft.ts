export const GENERIC_EMAIL = /^(billing|support|contact|hello|info|sales|bonjour|accueil|reception|reservation|admin)@/i

export type DraftEvidence = { label: string; evidence: string | null; source_url: string }
type DraftInput = { fullName?: string | null; companyName?: string | null; followUpOf?: { subject: string } | null; evidence?: DraftEvidence[] }

function evidenceLine(companyName: string, evidence: DraftEvidence[] = []) {
  const item = evidence[0]
  if (!item) return null
  const clean = (item.evidence ?? item.label).replace(/^Terme détecté\s*:\s*/i, '').replace(/[“”]/g, '').trim()
  return `En regardant ${companyName}, j’ai relevé un signal public lié à ${item.label.toLowerCase()}${clean ? ` (${clean})` : ''}. Source consultée : ${item.source_url}`
}

/** Premier message ou relance courte. Le contenu reste relu et modifiable avant l'envoi. */
export function buildDraft({ fullName, companyName, followUpOf, evidence }: DraftInput) {
  const greeting = `Bonjour${fullName ? ` ${fullName}` : ''},`
  const company = companyName ?? 'votre équipe'
  const observed = evidenceLine(company, evidence)
  const signature = 'Bonne journée,\nKennedy — Qualio\nhttps://tryqualio.pro\ncontact@tryqualio.pro\n\nSi vous ne souhaitez pas recevoir d’autres messages, répondez simplement « stop ».'
  if (followUpOf) {
    return {
      subject: /^re\s*:/i.test(followUpOf.subject) ? followUpOf.subject : `Re: ${followUpOf.subject}`,
      body: `${greeting}\n\nJe me permets de relancer mon message précédent, au cas où il se serait perdu.\n\nQualio rassemble les avis clients de ${company} et en ressort les thèmes qui reviennent le plus. Je peux vous envoyer un exemple basé sur vos propres avis si cela vous intéresse.\n\nSi vous avez 10 minutes cette semaine, je peux vous montrer le résultat sur un cas concret : https://tryqualio.pro\n\n${signature}`,
    }
  }
  return {
    subject: `Une question sur les retours clients chez ${company}`,
    body: `${greeting}\n\n${observed ?? `Je me suis intéressé à ${company}, mais je n’ai pas trouvé de signal public suffisamment précis pour personnaliser davantage ce message.`}\n\nQualio aide les équipes à transformer les retours clients en thèmes, tendances et actions prioritaires, au lieu de laisser les avis se disperser.\n\nComment identifiez-vous aujourd’hui ce qui revient le plus souvent dans vos retours clients ?\n\nSi vous avez 10 minutes cette semaine, je peux vous montrer un exemple concret : https://tryqualio.pro\n\nSi ce sujet concerne une autre personne, pourriez-vous m’indiquer le bon contact ?\n\n${signature}`,
  }
}
