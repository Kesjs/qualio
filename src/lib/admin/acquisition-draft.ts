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
    const top = report.topProblem
    if (top) {
      const mentionsLabel = top.mentions > 1 ? `${top.mentions} avis` : '1 avis'
      return {
        subject: top.mentions > 1
          ? `${report.subjectName} : « ${top.title} » revient dans ${top.mentions} avis`
          : `${report.subjectName} : « ${top.title} » ressort des avis`,
        body: [
          greeting,
          `Dans les ${report.reviewCount} derniers avis ${report.sourceLabel} de ${report.subjectName}, un point revient plus que les autres : « ${top.title} », cité dans ${mentionsLabel}.${others > 0 ? ` ${others === 1 ? 'Un autre sujet ressort' : `${others} autres sujets ressortent`} nettement.` : ''}`,
          `Le détail, avec les avis qui l’appuient, sans inscription : ${report.url}`,
          'Je l’ai généré avec Qualio, l’outil que je construis pour ça. Est-ce que ça correspond à ce que vous observez ?',
          signature,
        ].join('\n\n'),
      }
    }
    return {
      subject: `${report.reviewCount} avis ${report.sourceLabel} de ${report.subjectName}, lus pour vous`,
      body: [
        greeting,
        `J’ai lu les ${report.reviewCount} derniers avis ${report.sourceLabel} de ${report.subjectName} et je les ai regroupés par sujet.`,
        `Le rapport complet, avec les avis qui appuient chaque point : ${report.url}`,
        'Il est à vous, sans inscription ni engagement. Je l’ai fait avec Qualio, l’outil que je construis pour ce genre d’analyse.',
        'Est-ce que ça correspond à ce que vous observez de votre côté ?',
        signature,
      ].join('\n\n'),
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
