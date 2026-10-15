import { escapeHtml, plural, renderEmail } from '@/lib/email/layout'
import { createUnsubscribeToken } from '@/lib/email/unsubscribe'

type Base = { origin: string; userId: string }
const unsubscribeUrl = (origin: string, userId: string) => `${origin}/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(userId))}`

/** Plan Gratuit : pas de synthèse, pas d'IA. Il annonce ce qui attend et ce que Pro ferait. */
export function freeDigestEmail({ origin, userId, projectName, newCount, lockedCount, synthesesLeft }: Base & { projectName: string; newCount: number; lockedCount: number; synthesesLeft: number }) {
  const lines = [
    `${plural(newCount, 'nouvel avis', 'nouveaux avis')} sur ${projectName} depuis votre dernière synthèse.`,
    `Il vous reste ${synthesesLeft} synthèse${synthesesLeft > 1 ? 's' : ''} ce mois-ci : lancez-la depuis votre tableau de bord.`,
  ]
  if (lockedCount > 0) lines.push(`${plural(lockedCount, 'avis reçu', 'avis reçus')} par le widget ${lockedCount > 1 ? 'attendent' : 'attend'} d’être analysé${lockedCount > 1 ? 's' : ''}. Rien n’est perdu.`)
  lines.push('Avec Pro, la synthèse est automatique chaque semaine.')
  const { html, text } = renderEmail({ heading: 'Vos nouveaux avis', lines, cta: { label: 'Ouvrir Qualio', url: `${origin}/dashboard` }, unsubscribeUrl: unsubscribeUrl(origin, userId) })
  return { subject: `${plural(newCount, 'nouvel avis', 'nouveaux avis')} sur ${projectName}`, html, text }
}

/** Pro ou Agence sans synthèse cette semaine : version courte, sans conseil inventé. */
export function calmDigestEmail({ origin, userId, totalNew, lastSynthesisLabel }: Base & { totalNew: number; lastSynthesisLabel: string | null }) {
  const lines = [
    totalNew > 0 ? `${plural(totalNew, 'nouvel avis', 'nouveaux avis')} cette semaine, aucun ne demande de décision urgente.` : 'Aucun nouvel avis cette semaine.',
    lastSynthesisLabel ? `Votre dernière synthèse date du ${lastSynthesisLabel}.` : 'Vous n’avez pas encore de synthèse.',
    'Qualio continue de classer les avis dès leur arrivée. Rien à faire cette semaine.',
  ]
  const { html, text } = renderEmail({ heading: 'Semaine calme', lines, cta: { label: 'Voir mes avis', url: `${origin}/dashboard` }, unsubscribeUrl: unsubscribeUrl(origin, userId) })
  return { subject: 'Semaine calme : rien d’urgent cette semaine', html, text }
}

/** Alerte : un thème négatif a nettement augmenté cette semaine. */
export function alertEmail({ origin, userId, projectName, theme, current, previous }: Base & { projectName: string; theme: string; current: number; previous: number }) {
  const lines = [
    `${plural(current, 'avis négatif', 'avis négatifs')} sur « ${theme} » cette semaine, contre ${previous} la semaine précédente (${projectName}).`,
    'Ouvrez Qualio pour lire les avis concernés et décider de la suite.',
  ]
  const { html, text } = renderEmail({ heading: 'Un thème se dégrade', lines, cta: { label: 'Voir les avis', url: `${origin}/dashboard/feedback` }, unsubscribeUrl: unsubscribeUrl(origin, userId) })
  return { subject: `Alerte : « ${theme} » augmente dans vos avis négatifs`, html, text }
}

/** Service : limite d'avis atteinte. Envoyé une fois par projet et par mois. */
export function limitReachedEmail({ origin, projectName, limit }: { origin: string; projectName: string; limit: number }) {
  const { html, text } = renderEmail({
    heading: `${projectName} a atteint ${limit} avis analysés`,
    lines: ['Les nouveaux avis reçus par le widget sont conservés, mais pas analysés.', 'Passez à Pro pour les analyser. Rien n’est perdu.'],
    cta: { label: 'Voir les offres', url: `${origin}/pricing` },
  })
  return { subject: `${projectName} : limite de ${limit} avis atteinte`, html, text }
}

/** Service : confirmation d'un abonnement payant. */
export function upgradeConfirmedEmail({ origin, planLabel, unlocked }: { origin: string; planLabel: string; unlocked: number }) {
  const lines = [
    unlocked > 0 ? `${plural(unlocked, 'avis en attente a été débloqué', 'avis en attente ont été débloqués')} et ${unlocked > 1 ? 'sont analysés' : 'est analysé'} dès maintenant.` : 'Vos nouvelles limites sont actives.',
    'Vous pouvez gérer votre abonnement depuis vos réglages.',
  ]
  const { html, text } = renderEmail({ heading: `Votre plan ${planLabel} est actif`, lines, cta: { label: 'Ouvrir Qualio', url: `${origin}/dashboard` } })
  return { subject: `Votre plan ${planLabel} est actif`, html, text }
}

/** Service : paiement refusé. */
export function paymentFailedEmail({ origin, planLabel }: { origin: string; planLabel: string }) {
  const { html, text } = renderEmail({
    heading: 'Le paiement de votre abonnement n’a pas abouti',
    lines: [`Stripe n’a pas pu prélever le paiement de votre plan ${planLabel}.`, 'Mettez à jour votre moyen de paiement depuis vos réglages pour garder vos avis analysés.'],
    cta: { label: 'Ouvrir mes réglages', url: `${origin}/dashboard/settings` },
  })
  return { subject: 'Paiement non abouti pour votre abonnement Qualio', html, text }
}

/** Service : fin d'abonnement, retour au Gratuit. */
export function subscriptionEndedEmail({ origin }: { origin: string }) {
  const { html, text } = renderEmail({
    heading: 'Votre abonnement est terminé',
    lines: ['Votre compte repasse au plan Gratuit. Rien n’est supprimé.', 'Les avis au-delà des limites du Gratuit restent visibles en lecture seule.'],
    cta: { label: 'Ouvrir Qualio', url: `${origin}/dashboard` },
  })
  return { subject: 'Votre abonnement Qualio est terminé', html, text }
}

/** Service : premier contact, une seule fois. */
export function welcomeEmail({ origin, feedbackCount }: { origin: string; feedbackCount: number }) {
  const lines = feedbackCount < 3
    ? ['Ajoutez 3 avis pour obtenir votre première recommandation sourcée.', 'Vous pouvez importer un CSV, saisir un avis ou installer le widget.']
    : ['Vos avis sont prêts : lancez votre première synthèse.']
  const { html, text } = renderEmail({ heading: 'Bienvenue sur Qualio', lines, cta: { label: feedbackCount < 3 ? 'Ajouter des avis' : 'Ouvrir Qualio', url: `${origin}${feedbackCount < 3 ? '/dashboard/collection' : '/dashboard'}` } })
  return { subject: 'Bienvenue sur Qualio', html, text }
}
