import type { FixContext, RepositoryProvider, SiteStackType } from '../fix-context/types'

export interface FixPromptInput {
  issue: { id: string; title: string; severity: string; category: string; created_at?: string | null }
  context: FixContext
  evidence: Array<{ id: string; type: string; payload: unknown }>
  site: { url: string; environment: string; stack_type: SiteStackType; repository_provider: RepositoryProvider }
}

const STACK_HINTS: Record<SiteStackType, string[]> = {
  nextjs: ['Rechercher le texte visible ou le sélecteur dans app, pages et src/components.', 'Vérifier le Route Handler, la Server Action ou le gestionnaire client lié au parcours.'],
  react_vite: ['Rechercher le texte visible ou le sélecteur dans src et les composants de la route.', 'Vérifier le gestionnaire d’événement, le routeur et les appels réseau associés.'],
  shopify: ['Rechercher le texte visible dans les sections, snippets et templates du thème.', 'Vérifier les scripts du thème et les appels Storefront associés au parcours.'],
  webflow: ['Rechercher l’élément par son texte, son attribut ou sa classe dans le Designer.', 'Vérifier les interactions Webflow et le code personnalisé de la page.'],
  wordpress: ['Rechercher le texte dans le thème, les blocs et extensions responsables de la page.', 'Vérifier les hooks, scripts et requêtes liés à l’action observée.'],
  unknown: ['Rechercher le texte visible, le sélecteur et la route dans le dépôt.', 'Identifier le composant ou le gestionnaire responsable avant de modifier le code.'],
}

function list(items: string[], empty: string): string {
  return (items.length ? items : [empty]).map((item, index) => `${index + 1}. ${item}`).join('\n')
}

export function buildFixPrompt({ issue, context, evidence, site }: FixPromptInput): string {
  const locationHints = [...context.locate_hints, ...STACK_HINTS[site.stack_type]]
  const evidenceLines = evidence.length
    ? evidence.map((item) => `- ${item.id} · ${item.type} · ${JSON.stringify(item.payload)}`).join('\n')
    : '- Aucune preuve exploitable n’a été jointe. Ne pas inventer de détail.'

  return [
    '# Mission',
    `Corriger uniquement l’incident Qualio ${issue.id} sans modifier les comportements non concernés.`,
    '',
    '# Contexte observé',
    `Site: ${site.url}`,
    `Environnement: ${site.environment}`,
    `Stack déclarée: ${site.stack_type}`,
    `Dépôt déclaré: ${site.repository_provider} (Qualio n’a pas accès au code source)`,
    `Incident: ${issue.title}`,
    `Sévérité: ${issue.severity}`,
    `Catégorie: ${issue.category}`,
    `Page: ${context.page_url ?? 'non déterminée'}`,
    `Viewport: ${context.viewport ? `${context.viewport.name} ${context.viewport.width}x${context.viewport.height}` : 'non déterminé'}`,
    '',
    '# Reproduction',
    list(context.repro_steps, 'Reproduire le contrôle décrit par les preuves disponibles.'),
    '',
    '# Comportement attendu',
    context.expected,
    '',
    '# Comportement observé',
    context.actual,
    '',
    '# Preuves Qualio',
    evidenceLines,
    '',
    '# Pistes de localisation',
    list([...new Set(locationHints)], 'Rechercher le texte visible et la route concernée.'),
    '',
    '# Incertitudes',
    list(context.uncertainties, 'Aucune incertitude supplémentaire déclarée.'),
    '',
    '# Instruction de correction',
    'Trouver la cause dans le dépôt, appliquer le correctif minimal, préserver le reste du comportement et ajouter ou mettre à jour le test approprié. Ne pas supposer qu’un fichier ou une ligne existe uniquement parce que Qualio a observé le site rendu.',
    '',
    '# Validation',
    context.acceptance_check,
    'Après déploiement, relancer Qualio pour confirmer le statut resolved et vérifier l’absence de régression.',
  ].join('\n')
}
