export type PublicFeedback = {
  kind: string
  theme: string
  title: string
  summary: string
  source: string
  href: string
  tone: 'orange' | 'red' | 'green'
}

export const publicFeedback: PublicFeedback[] = [
  {
    kind: 'Friction UX',
    theme: 'Navigation',
    title: 'La hiérarchie de la barre latérale est difficile à comprendre.',
    summary: 'Le retour décrit une confusion entre projets, conversations et contexte actif.',
    source: 'Retour public · Hermes Desktop',
    href: 'https://github.com/NousResearch/hermes-agent/issues/59323',
    tone: 'orange',
  },
  {
    kind: 'Bug',
    theme: 'Affichage',
    title: 'Un long message d’erreur déborde de l’interface.',
    summary: 'Le retour demande que le message se replie correctement sur plusieurs lignes.',
    source: 'Retour public · Supabase',
    href: 'https://github.com/supabase/supabase/issues/10689',
    tone: 'red',
  },
  {
    kind: 'Demande',
    theme: 'Apparence',
    title: 'Proposer une interface classique, avec moins d’effets translucides.',
    summary: 'Le retour oppose lisibilité, marges inutiles et effets visuels difficiles à désactiver.',
    source: 'Retour public · Nextcloud',
    href: 'https://github.com/nextcloud/server/issues/34727',
    tone: 'green',
  },
]
