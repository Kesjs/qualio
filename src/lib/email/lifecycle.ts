/** Étapes des relances de cycle de vie : fenêtres de dates en un seul endroit, sans appel base. */

export type LifecycleStage = 'activation_nudge' | 'project_nudge' | 'feedback_request' | 'decision_reminder'

export type LifecycleStageConfig = {
  stage: LifecycleStage
  /** Âge minimum, en jours (depuis l'inscription, ou depuis la dernière synthèse pour decision_reminder). */
  minDays: number
  /** Âge maximum exclu, en jours. Passé ce délai, la relance n'est plus envoyée. */
  maxDays: number
}

export const LIFECYCLE_STAGES: readonly LifecycleStageConfig[] = [
  { stage: 'activation_nudge', minDays: 2, maxDays: 6 },
  { stage: 'project_nudge', minDays: 3, maxDays: 9 },
  { stage: 'feedback_request', minDays: 4, maxDays: 12 },
  { stage: 'decision_reminder', minDays: 5, maxDays: 14 },
]

/** Plafond de destinataires par étape et par exécution du cron ; le reste passe au lendemain, tant que la fenêtre est ouverte. */
export const LIFECYCLE_BATCH_LIMIT = 200

/** Un seul envoi par personne et par étape : la clé ne change jamais pour une même étape. */
export const LIFECYCLE_EVENT_KEY = 'v1'
