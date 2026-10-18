/** Validated public launch specification; does not grant billing entitlements. */
export const LAUNCH_OFFERS = [
  { id: 'free', name: 'Gratuit', monthly: 0, annual: 0, projects: 1, feedback: 50, description: 'Pour commencer avec vos avis', features: ['2 synthèses manuelles sur 30 jours', 'Widget, import CSV et saisie manuelle', 'Avis reçus conservés en attente'], ready: true },
  { id: 'pro', name: 'Pro', monthly: 19, annual: 190, projects: 5, feedback: 2000, description: 'Pour suivre vos avis chaque semaine', features: ['Synthèse automatique chaque semaine', 'Widget et avis reçus analysés', 'Email du lundi', 'Historique et évolution des décisions', 'Partage de tâches par lien et PDF'], ready: true },
  { id: 'agency', name: 'Agence', monthly: 49, annual: 490, projects: 15, feedback: 10000, description: 'Pour gérer plusieurs clients et présenter des rapports sourcés', features: ['Synthèse automatique chaque semaine', 'Widget sur 15 sites', 'Rapport client partageable', 'Export CSV et support prioritaire'], ready: true },
] as const
