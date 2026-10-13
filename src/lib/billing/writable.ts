export type SiteRow = { id: string; created_at: string | null }

/**
 * Doc 2.3 : en cas de retour au Gratuit, rien n'est supprimé. Seuls les projets les plus anciens,
 * jusqu'à la limite du plan, restent modifiables ; les autres passent en lecture seule.
 */
export function writableSiteIds(sites: SiteRow[], projectLimit: number): string[] {
  return [...sites]
    .sort((a, b) => (Date.parse(a.created_at ?? '') || 0) - (Date.parse(b.created_at ?? '') || 0) || a.id.localeCompare(b.id))
    .slice(0, Math.max(0, projectLimit))
    .map((site) => site.id)
}
