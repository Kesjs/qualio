/**
 * Informations juridiques à renseigner UNE fois, ici. Tant qu'un champ est vide,
 * la page affiche « À compléter » en orange et l'envoi des emails de prospection reste bloqué : ne mettez pas le site en ligne avant.
 */
export const LEGAL = {
  publisher: '',        // Nom de l'éditeur (personne ou société)
  legalForm: '',        // Forme juridique, ex. entreprise individuelle, SARL
  registration: '',     // Numéro d'immatriculation (RCCM, IFU…) s'il existe
  address: '',          // Adresse postale
  director: '',         // Directeur de la publication
  email: 'contact@tryqualio.pro',
  host: 'Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis',
  governingLaw: '',     // Droit applicable et juridiction, ex. « droit béninois, tribunaux de Cotonou »
  updatedAt: '28 octobre 2026',
} as const

/** Les informations minimales à afficher dans un email commercial : qui envoie, et où. */
export function senderIdentityReady() {
  return Boolean(LEGAL.publisher.trim() && LEGAL.address.trim())
}

export function senderIdentityLine() {
  const parts = [LEGAL.publisher, LEGAL.legalForm, LEGAL.registration].map((value) => value.trim()).filter(Boolean)
  return `${parts.join(', ')} — ${LEGAL.address.trim()}`
}
