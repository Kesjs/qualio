import type { ActionItem } from '@/lib/feedback/types'

/** Fictional local example; never inserted, classified or counted as customer data. */
export const DEMO_RECOMMENDATION: ActionItem = {
  id: 'local-weekly-example', title: 'Rendre la facturation visible dans le menu', description: null,
  rationale: 'Ces trois avis fictifs décrivent la même difficulté : retrouver une facture.',
  priority: 'high', status: 'open', theme: 'Facturation', created_at: '2026-10-13T08:00:00Z',
  feedback_ids: ['demo-1', 'demo-2', 'demo-3'],
  evidence: [
    { id: 'demo-1', content: 'Je ne retrouve pas ma facture dans mon espace.', source: 'manual', created_at: '2026-10-12T08:00:00Z' },
    { id: 'demo-2', content: 'Où puis-je télécharger mes factures ?', source: 'csv', created_at: '2026-10-09T08:00:00Z' },
    { id: 'demo-3', content: 'Un lien vers la facturation dans le menu m’aiderait.', source: 'widget', created_at: '2026-10-03T08:00:00Z' },
  ],
}
