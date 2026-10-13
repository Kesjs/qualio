/** Secteurs proposés dans Réglages > Projet (liste fermée, filtrable plus tard). */
export const PROJECT_SECTORS = ['Produit / SaaS', 'Agence ou freelance', 'Boutique en ligne', 'Autre'] as const
export type ProjectSector = (typeof PROJECT_SECTORS)[number]
