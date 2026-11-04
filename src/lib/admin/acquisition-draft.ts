export const GENERIC_EMAIL = /^(billing|support|contact|hello|info|sales|bonjour|accueil|reception|reservation|admin)@/i

export type DraftEvidence = { label: string; evidence: string | null; source_url: string }
export type DraftReport = { url: string; reviewCount: number; sourceLabel: string; subjectName: string; topProblem: { title: string; mentions: number } | null; problemCount: number }
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

/** Premier message ou relance courte. Le contenu reste relu et modifiable avant l'envoi.
 *  La mention « adresse publiée sur votre site » et le « stop » sont ajoutés par le pied de page de l'email (renderAcquisitionEmail). */
export function buildDraft({ fullName, companyName, companyNotes, followUpOf, evidence, report }: DraftInput) {
  const greeting = `Bonjour${fullName ? ` ${fullName}` : ''},`
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
    const others = report.problemCount - 1
    return {
      subject: `${report.reviewCount} avis ${report.sourceLabel} de ${report.subjectName}, lus pour vous`,
      body: [
        greeting,
        `J’ai lu les ${report.reviewCount} derniers avis ${report.sourceLabel} de ${report.subjectName} et je les ai regroupés par sujet.`,
        report.topProblem ? `Le point qui revient le plus : « ${report.topProblem.title} », mentionné dans ${report.topProblem.mentions} avis.${others > 0 ? ` ${others === 1 ? 'Un autre sujet ressort' : `${others} autres sujets ressortent`} nettement.` : ''}` : '',
        `Le rapport complet, avec les avis qui appuient chaque point : ${report.url}`,
        'Il est à vous, sans inscription ni engagement. Je l’ai fait avec Qualio, l’outil que je construis pour ce genre d’analyse.',
        'Est-ce que ça correspond à ce que vous observez de votre côté ?',
        signature,
      ].filter(Boolean).join('\n\n'),
    }
  }
  if (isAgency(companyName, companyNotes)) {
    return {
      subject: AGENCY_SUBJECT,
      body: [
        greeting,
        'Quand une agence fait évoluer le site ou l’app d’un client, les retours utilisateurs arrivent souvent en vrac : emails, formulaires, avis. Difficile d’en tirer une priorité claire à présenter au client.',
        'Qualio regroupe ces retours par thèmes et en sort trois actions prioritaires, chacune justifiée par les retours d’origine. Le résultat se partage au client par un simple lien.',
        `Exemple concret : ${EXAMPLE_URL}`,
        `Je peux préparer gratuitement un premier rapport pour l’un des clients de ${company}, à partir de ses avis publics, pour que vous jugiez sur pièce.`,
        'Ça vous intéresserait de tester sur un projet ?',
        signature,
      ].join('\n\n'),
    }
  }
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
