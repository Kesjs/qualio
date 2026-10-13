/** Validated public launch specification; does not grant billing entitlements. */
export const LAUNCH_OFFERS = [
  { id: 'free', name: 'Gratuit', monthly: 0, annual: 0, projects: 1, feedback: 50, description: 'Pour commencer avec vos avis', features: ['1 synthèse toutes les 14 jours', 'Import CSV et saisie manuelle', 'Vos avis conservés'], ready: true },
  { id: 'pro', name: 'Pro', monthly: 19, annual: 190, projects: 5, feedback: 2000, description: 'Pour suivre vos avis chaque semaine', features: ['Synthèse automatique chaque semaine', 'Widget sur votre site', 'Email du lundi', 'Historique des décisions'], ready: false },
] as const
